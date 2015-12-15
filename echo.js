var Promise = require('bluebird');
var stockOperations = require("./stock-operations");
module.exports = {
        addStocks: function(AMZN_ID, companyNames, SpecialsArr, callback) { // AMZN_ID = Amazon Id, companyNames is an array of companies, e.g. ['Microsoft', 'apple', 'Tesla'], specialsArr is an array of special requests from Wit, callback.
                Promise.try(function() {
                        return stockOperations.addStocks(AMZN_ID, companyNames, SpecialsArr);
                }).then(function(response) {
                        return response
                }).filter(function(item) {
                        if (item) {
                                return item;
                        }
                }).then(function(response) {
                        callback(response);
                }).catch(function(err) {})
        },
        showSavedStocks: function(AMZN_ID, callback) { // Unique Amazon USERID - for Database
                Promise.try(function() {
                        return stockOperations.showSavedStocks(AMZN_ID);
                }).then(function(allStockData) {
                        callback(allStockData);
                        // assuming it's already in the right format, but you can transform / process stuff as well, of course.
                }).catch(function(err) {
                        callback("Huh, I couldn't find any stocks for you. Try asking me about stocks for any company, so I can remember next time.");
                });
        }
}