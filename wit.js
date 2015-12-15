var wit = require('node-wit');
var fs = require('fs');
module.exports = function(text, callback) {
        var ACCESS_TOKEN = "GETYOUROWNKEY";
        wit.captureTextIntent(ACCESS_TOKEN, text, function(err, res) {
                if (err) console.log("Error: ", err);
                callback(res.outcomes[0].entities);
        });
}