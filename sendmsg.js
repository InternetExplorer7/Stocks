module.exports = function(to, body) {
        var accountSid = 'AC6d6e616157be804eebd6312095875188';
        var authToken = "99b2103f765bba44d08723867afd4194";
        var client = require('twilio')(accountSid, authToken);
        client.messages.create({
                body: body,
                to: to,
                from: "+19013004207" // Change this number to: +19013004207
        }, function(err, message) {
                if (err) {
                        throw err;
                }
        });
}