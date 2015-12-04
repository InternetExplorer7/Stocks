var wit = require('node-wit');
var fs = require('fs');
module.exports = function(text, callback) {
        var ACCESS_TOKEN = "AUTH_TOKEN";

        wit.captureTextIntent(ACCESS_TOKEN, text, function(err, res) {
                //console.log("Response from Wit for text input: " + JSON.stringify(res));
                if (err) console.log("Error: ", err);
                callback(res.outcomes[0].entities);
        });
}