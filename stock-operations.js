var saveTicker = require("./save-ticker");
var getCompanyTicker = require('./get-company-ticker');
var getSavedTickers = require("./get-saved-tickers");
var getStockData = require("./get-stock-data");
var Promise = require('bluebird');

module.exports.addStocks = function(ID, companyNames, SpecialsArr) {
        return Promise.map(companyNames, function(companyName) {
                // called for each company name
                return Promise.try(function() {
                        return getCompanyTicker(companyName); // First lets get the stock ticker. COMPLETED [Google]
                }).then(function(ticker) { // Save tickers. COMPLETED [GOOGL]
                        return saveTicker(ID, ticker);
                }).then(function(ticker) { // Now we have it saved, let's get stock data.
                        return getStockData(ticker);
                }).then(function(response) { // response is Stock data for companyName. [change: 32.4%, ..., ..., Google, ..., ...]
                        if (SpecialsArr) { // If wit had some special items in its array. e.g. `year low` `year high` `ebitda`
                                return SpecialsArr.map(function(item) {
                                        switch (item) {
                                                case "yearhigh":
                                                        return response.query.results.quote.Name + " had a year high of " + response.query.results.quote.YearHigh
                                                        break;
                                                case "yearlow":
                                                        return response.query.results.quote.Name + " had a year low of " + response.query.results.quote.YearLow
                                                        break;
                                                case "volume":
                                                        return response.query.results.quote.Name + " volume: " + response.query.results.quote.Volume
                                                        break;
                                                case "EBITDA":
                                                        return response.query.results.quote.Name + " Earnings Before Interest, Taxes, Depreciation, and Amortization for " + response.query.results.quote.Name + " is " + response.query.results.quote.EBITDA
                                                        break;
                                                case "change":
                                                        return response.query.results.quote.Name + " had a change of " + response.query.results.quote.PercentChange
                                                        break;
                                                default:
                                                        break;
                                        }
                                })
                        } else { // Wit didn't return anything, just send back alchemy stuff normal.
                                return response.query.results.quote.Name + " Opened at " + response.query.results.quote.Open + ". Peaked at " + response.query.results.quote.DaysHigh + " with a Low of " + response.query.results.quote.DaysLow + " and a percent change of " + response.query.results.quote.PercentChange + ". Last trade date for " + response.query.results.quote.Name + " was " + response.query.results.quote.LastTradeDate
                        }
                }).catch(function(err) {
                        console.log(err + " Error in addStocks in stock-operations");
                });
        });
}

module.exports.showSavedStocks = function(ID) { // Unique ID for device.
        return Promise.try(function() {
                return getSavedTickers(ID); // Gets saved Tickers - e.g. [Apple, Amazon, Google]
        }).then(function(response) {
                return response.stocks;
        }).map(function(ticker) { // Array of tickers
                // called for each ticker
                return getStockData(ticker); // Transform array with responses, [Object object, Object object, ...]
        }).map(function(response) { // Array of objects, now get them finalized. e.g. ['Stock data for Apple, .... ']
                return response.query.results.quote.Name + " Opened at " + response.query.results.quote.Open + ". Peaked at " + response.query.results.quote.DaysHigh + " with a Low of " + response.query.results.quote.DaysLow + " and a percent change of " + response.query.results.quote.PercentChange + ". Last trade date: " + response.query.results.quote.LastTradeDate
        }).then(function(response) {
                return response;
        }).catch(function(err) {
                console.log("Error " + err);
        });
}