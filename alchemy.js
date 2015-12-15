//Create the AlchemyAPI object
var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI();
var sendmessage = require('./sendmsg');
var Promise = require("bluebird");

module.exports = function(text, sender, callback) {
        if (text.length < 1) {
                callback(false, undefined); // Nothing in text, don't even send to alchemy.
                return;
        }
        console.log("Text: " + text);
        alchemyapi.entities('text', text, {
                'sentiment': 1
        }, function(response) {
                console.log("Hit alchemy " + JSON.stringify(response));
                Promise.filter(response.entities, function(item) { // Only want companies
                        console.log("Item.type: " + item.type);
                        if (item.type === "Company") {
                                return true;
                        } else {
                                return false;
                        }
                }).map(function(companyArray) {
                        return companyArray.text
                }).then(function(companyArray) { // Array of companies.
                        console.log("CompanyArray: " + companyArray);
                        if (companyArray.length < 1) {
                                callback(false, undefined);
                        } else {
                                callback(true, companyArray)
                        }
                })
        });
}