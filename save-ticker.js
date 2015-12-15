var contact = require('./models/user');
var Promise = require('bluebird');
module.exports = function(ID, ticker) {
        return contact.findOne({
                _id: ID
        }).then(function(user) { // Check if user is in DB, response is user object from Database.
                if (user.stocks.indexOf(ticker) === -1) { // Ticker not found in array, add to user db.
                        user.stocks.push(ticker);
                        user.save();
                        return ticker;
                } else {
                        return ticker;
                }
        });
}