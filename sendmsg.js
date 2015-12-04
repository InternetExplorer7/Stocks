module.exports = function (to, body){
var accountSid = 'ACCOUNTID';
var authToken = "AUTHTOKEN";
var client = require('twilio')(accountSid, authToken);
client.messages.create({
    body: body,
    to: to,
    from: "+NUMBER"  // Change this number to: +19013004207
}, function(err, message) {
    if(err) {
    	throw err;
    }
});
}