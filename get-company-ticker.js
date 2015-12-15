var bhttp = require('bhttp');
var Promise = require('bluebird');
module.exports = function(companyName) {
        companyName = companyName.replace(/\s+/g, '+');
        return bhttp.get("http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=" + companyName) // Gets company ticker.
                .then(function(response) {
                        response = JSON.parse(response.body);
                        if (response.length === 0) { // No information found..
                                throw new Error("Can't find ticker for " + companyName);
                        } else {
                                if (response[0].Symbol === "VXGOG") { // Sometimes Google gets confused for another company.
                                        response[0].Symbol = "GOOGL";
                                }
                                return response[0].Symbol // Send back the Symbol.
                        }
                });
}