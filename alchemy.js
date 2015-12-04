//Create the AlchemyAPI object
var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI();
var sendmessage = require('./sendmsg');
var Promise = require("bluebird");

module.exports = function(text, sender, callback) {
        var requestBody = [];
        var splitup = text.split(" "); // splitup = [show, me, stocks, for, Google, and, Microsoft, ] <- for some reason extra empty item
        var ticker = 0;
        splitup = splitup.filter(function(item) {
                return item !== "";
        });
        splitup.forEach(function(item) { // Loops through each item, [show] [me] [...]
                console.log("ITEM CHECK THIS::::::: " + item);
                alchemyapi.entities('text', item, {
                        'sentiment': 1
                }, function(response) {
                        if (response.entities[0].length > 0) { // Entity is found for word
                                if (response.entities[0].type === "Company") { // Found word and is a company
                                        if (response.entities[0].text === undefined) {
                                                console.log("UNDEFINED RESPONSE: " + JSON.stringify(response.entities[0].text));
                                        }
                                        ticker++;
                                        requestBody.push(response.entities[0].text); // Adds company to requestBody array
                                        check(ticker);
                                } else {
                                        ticker++;
                                        check(ticker);
                                }
                        } else {
                                ticker++;
                                check(ticker);
                        }
                });
        });

        function long(callback) { // Bank of America, companies more than 1 word w/ spaces.
                console.log("TEXT: " + text)
                alchemyapi.entities('text', text, {
                        'sentiment': 1
                }, function(response) {
                        console.log("Entire response: " + JSON.stringify(response));
                        if (response.entities.length > 0) { // There are entities here.
                                var finalresponse = response.entities.filter(function(item) {
                                        return item.type === "Company"
                                }); // creates an array of companies
                                finalresponse.forEach(function(company) {
                                        requestBody.push(company.text);
                                });
                                checkfordup(function(finalarray) {
                                        callback(finalarray)
                                });
                        }
                });
        }

        function checkfordup(callback) { // TODO: FIX THIS!
                var finalarray = requestBody.filter(function(elem, pos) {
                        return requestBody.indexOf(elem) == pos;
                });
                callback(finalarray)
        }

        function check(count) {
                if (count === splitup.length && requestBody.length > 0) { // checks if ticker is now equal to length of input array and if anything is found in reqbody
                        long(function (newarr) {
                                callback(true, newarr); // Send in the new mixed array, free of dupes.
                        }); // check long before calling back
                } else if (count === splitup.length && requestBody.length < 1) { // Looped through entire string, no individuals found.
                	long(function (newarr) {
                		if(newarr.length >= 0) {
                			callback(true, newarr)
                		} else {
                			callback(false);
                		}
                	});
                }
        }
}