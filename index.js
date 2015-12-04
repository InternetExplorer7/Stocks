/* 
BUILT AT PENNAPPS XII -- KAVEH KHORRAM

WORK-IN-PROGRESS

*/
var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/db");
var Schema = mongoose.Schema;

// Create the Schema
var contactSchema = new Schema({
        _id: String,
        stocks: [{
                type: String
        }]
});

// create the model
var contact = mongoose.model('contacts', contactSchema);

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var request = require('request');
var wit = require('./wit');
var alchemy = require('./alchemy');
var sendmessage = require('./sendmsg');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
        extended: false
}));
// parse application/json
app.use(bodyParser.json())

app.get('/starting', function(req, res) {
        res.sendFile(path.join(__dirname, 'starting/index.html'));
});
app.post('/sms', function(req, res) { // User sent text message, start process...
        addNewUser(req.body.From, function(newuser) {
                if (newuser) {
                        console.log("New user");
                        res.send("<Response> <Message>Thanks for texting in, try asking me about stock data for a particular company. To see what else I can do, visit: http://pennapps.mybluemix.net/starting </Message> </Response>");
                        return; // Give message, restart.
                } else { // Current user
                        alchemy(req.body.Body, req.body.From, function(result, response) { // Response is array of companies, result === true when companies are found.
                                wit(req.body.Body, function(entities) {
                                        console.log("AlchemyArray in index: " + response);
                                        if (entities.yearhigh && result || entities.yearlow && result || entities.volume && result || entities.EBITDA && result || entities.change && result) { // Alchemy found companies and user asked for year high results.
                                                console.log("Hitting differences");
                                                var payload = [];
                                                payload.push(Object.keys(entities)[0]); // Year high
                                                payload.push(Object.keys(entities)[1]); // Year Low
                                                payload.push(Object.keys(entities)[2]); // Volume
                                                payload.push(Object.keys(entities)[3]); // EBITDA
                                                payload.push(Object.keys(entities)[4]); // Change
                                                payload = payload.filter(function(item) {
                                                        return item
                                                }); // clears out array of undefined items
                                                getticker(response, req.body.From, payload);
                                        } else if (result) { // Just alchemy return true, ex: Yahoo!, Google and Apple.
                                                console.log("Hitting res");
                                                getticker(response, req.body.From);
                                        } else if (entities.stocksearch) { // Just Wit returned true, ex: Show me my stocks
                                                console.log(entities.stocksearch);
                                                getone(req.body.From, function(contact) {
                                                        if (contact.stocks.length > 0) {
                                                                contact.stocks.forEach(function(ticker) {
                                                                        getstocks(ticker, req.body.From);
                                                                });
                                                        } else {
                                                                sendmessage(req.body.From, "You haven't saved any companies yet!!");
                                                        }
                                                });
                                        } else {
                                                console.log('Bad request ' + req.body.Body);
                                                sendmessage(req.body.From, "Sorry, I didn't quite understand your request. Click here to see what I can understand: http://pennapps.mybluemix.net/starting");
                                        }
                                });
                        });
                }
        });
});

function getticker(stocks, sender, payload) {
        // Turn company names into stock tickers
        console.log("Stocks array, companies found: " + JSON.stringify(stocks));
        stocks.forEach(function(ticker) {
                request("http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=" + ticker, function(error, response, body) {
                        console.log("Response for " + ticker + " " + JSON.stringify(response));
                        if (error) throw error;
                        // body = body.substring(39); OLD YAHOO STUFF
                        // body = body.substring(0, body.length - 1);
                        // body = JSON.parse(body);
                        body = JSON.parse(body);
                        //console.log(body);
                        if (body.length === 0) {
                                //sendmessage(sender, "Sorry, I couldn't find information about " + ticker);
                                return;
                        }
                        if (body[0].Symbol === "VXGOG") {
                                body[0].Symbol = "GOOGL";
                        }               
                        console.log("Got ticker, adding " + body[0].Symbol + " to DB");
                        addToDB(sender, body[0].Symbol); // Adds new ticker to DB
                        console.log("Getting stock data, using " + body[0].Symbol);
                        getstocks(body[0].Symbol, sender, payload);
                });
        });
}

function getstocks(ticker, sender, payload) { // We have the ticker and saved to DB, start sending stock data now
        request({
                url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + ticker + "%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=",
                rejectUnauthorized: false,
                headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
                }
        }, function(error, response, body) {
                if (error) throw error;
                console.log("TICKER: " + ticker);
                body = JSON.parse(body);
                var name;
                if (body.query.results.quote.Name !== null) {
                        name = body.query.results.quote.Name;
                } else {
                        name = body.query.results.quote.Symbol
                }
                if (payload) { // Special requests spotted
                        console.log("Special requests spotted");
                        payload.forEach(function(item) {
                                console.log(item);
                                switch (item) {
                                        case "yearhigh":
                                                sendmessage(sender, name + " had a year high of " + body.query.results.quote.YearHigh);
                                                break;
                                        case "yearlow":
                                                sendmessage(sender, name + " had a year low of " + body.query.results.quote.YearLow);
                                                break;
                                        case "volume":
                                                sendmessage(sender, name + " volume: " + body.query.results.quote.Volume);
                                                break;
                                        case "EBITDA":
                                                sendmessage(sender, "Earnings Before Interest, Taxes, Depreciation, and Amortization for " + name + " is " + body.query.results.quote.EBITDA);
                                                break;
                                        case "change":
                                                sendmessage(sender, name + " had a change of " + body.query.results.quote.PercentChange);
                                                break;
                                        default:
                                                console.log("Hit default, most likely stocksearch " + item);
                                                break;
                                }
                        });
                } else {
                        sendmessage(sender, name + " Opened at " + body.query.results.quote.Open + " Peaked at " + body.query.results.quote.DaysHigh + " with a Low of " + body.query.results.quote.DaysLow + " and a percent change of " + body.query.results.quote.PercentChange + ". Last trade date: " + body.query.results.quote.LastTradeDate);
                }
        });
}

function addToDB(tel, ticker) { // phone number, ticker to add.
        contact.findOne({
                _id: tel
        }, function(err, res) { // Found object
                if (res.stocks.indexOf(ticker) === -1) { // Ticker not found
                        res.update({
                                $push: {
                                        stocks: ticker
                                }
                        }, function (err) {
                                if (err) console.log(err);
                        });
                }
        });
}

function getone(tel, callback) { // phone number, callback
        contact.findOne({
                _id: tel
        }, function(err, res) {
                callback(res);
        });
}

function addNewUser(tel, callback) { // phone number, callback
        contact.findOne({
                _id: tel
        }, function(err, res) {
                if (!res) { // User is not found, create a new contact
                        var newContact = new contact({
                                _id: phone,
                                stocks: []
                        })
                        newContact.save(function(err) {
                                if (err) console.log(err);
                        });
                        callback(true); // New User
                } else {
                        callback(false); // Current user
                }
        });
}

app.listen(appEnv.port); // Change this back when going back to Bluemix