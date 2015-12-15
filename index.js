var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/db");
var echo = require('./echo'); // Load ECHO
var sms = require('./sms'); // load SMS

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var Promise = require('bluebird');



// new modules
var contact = require('./models/user'); // import db
var request = require('request');
var wit = require('./wit');
var alchemy = require('./alchemy');
var sendmessage = require('./sendmsg');
var bhttp = require('bhttp');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
        extended: false
}));
// parse application/json
app.use(bodyParser.json())

app.get('/starting', function(req, res) {
        res.sendFile(path.join(__dirname, 'starting/index.html'));
});

app.post('/api/echo', function(req, res) {
        var uid;
        var body;
        var newUserEntered = false;
        var sms = false;
        if (req.body.From) { // If req.body.From is a valid field, message is from SMS.
                sms = true;
                uid = req.body.From;
                body = req.body.Body;
        } else {
                uid = req.body.session.user.userId;
                body = req.body.request.intent.slots.query.value;
        }
        /*
        POSSIBLE RESPONSE:
        Case #1: Show me my stocks - COMPLETED
        Case #2: What are stocks like for Google and Amazon -- COMPLETED
        Case #3: unrecognized command, throw error. -- COMPLETED
        */
        contact.findOne({
                _id: uid
        }).then(function(user) {
                if (!user) { // user not found, create new account.
                        var newUser = new contact({
                                _id: uid,
                                stocks: []
                        });
                        return newUser.save().then(function(err) {
                                        newUserEntered = true;
                                        checkSend("Welcome to my stocks, try asking me about stocks for any company!", true)
                                })
                                // New user, send back welcome message. Code should stop running after this session.
                }
        });


        alchemy(body, uid, function(result, response) { // Response is array of companies, result === true when companies are found.
                wit(body, function(entities) {

                        if (newUserEntered) {
                                return;
                        }

                        if (!result && Object.keys(entities).length === 1 && entities.stocksearch) { // No companies found, only item from Wit was 'stocksearch'
                                // Case #1: Show me my stocks
                                echo.showSavedStocks(uid, function(responsePayload) {
                                        checkSend(responsePayload);
                                });
                        } else if (result && Object.keys(entities).length > 0) { // Companies were found and obj was returned by Wit, 'year low' 'year high'
                                // Case #2: What are stocks ike for Google and Amazon year high and EBITDA
                                Promise.map(Object.keys(entities), function(specialEntity) {
                                        if (specialEntity !== "stocksearch") {
                                                return specialEntity // Start transforming array, just make sure that 'stocksearch' isn't included.
                                        }
                                }).then(function(response) {
                                        return response.filter(function(item) { // Check for any undefined items inside the array, e.g. 'stocksearch'
                                                if (item === undefined) {
                                                        return false; // Found, probably stocksearch
                                                } else {
                                                        return true;
                                                }
                                        });
                                }).then(function(newArr) {
                                        if (newArr.length < 1) {
                                                echo.addStocks(uid, response, undefined, function(responsePayload) {
                                                        checkSend(responsePayload);
                                                }); // If their is nothing inside of newArr, just return undefiend.
                                        } else {
                                                echo.addStocks(uid, response, newArr, function(responsePayload) {
                                                        checkSend(responsePayload);
                                                }); // newArr is special requests by Wit

                                        }

                                });
                        } else if (result) { // Nothing by Wit, just an array of Companies by AlchemyAPI
                                echo.addStocks(uid, response, undefined, function(responsePayload) {
                                        checkSend(responsePayload);
                                });
                                // Case #2 ext: Google Amazon

                        } else { // Nothing by Wit or AlchemyAPI
                                checkSend("Sorry, I didn't quite understand your request.")
                                        // Case #3: unrecognized command.
                        } // Else
                }); // Wit
        }); // Alchemy

        function checkSend(text, single) {
                if (sms) { // If SMS = true, send it to sendToSMS
                        sendToSMS(text);
                } else { // If SMS = false, send it to sendToEcho
                        if (!single) {
                                text = text.join(' ');
                        }
                        sendToEcho(text);
                }
        }

        function sendToEcho(text) {
                var responseBody = {
                        "version": "0.1",
                        "response": {
                                "outputSpeech": {
                                        "type": "PlainText",
                                        "text": text
                                },
                                "shouldEndSession": true // Set to false to keep going
                        }
                }
                res.send(responseBody);
        }

        function sendToSMS(text) {
                if (typeof text === "string" || text.length === 0) {
                        sendmessage(uid, text);
                        return;
                }
                text.forEach(function(item) {
                        if (item[0].length > 1) {
                                item.forEach(function(extItem) {
                                        sendmessage(uid, extItem);
                                });
                        } else {
                                sendmessage(uid, item);
                        }
                });
        }
});

app.listen(appEnv.port); // Change this back when going back to Bluemix