var contact = require('./models/user');
var Promise = require('bluebird');

module.exports = function (ID, ticker) {
	return contact.findOne({
		_id: ID
	}).then(function (response){ // User object
		if(response === null) { // User not found, create.
			var newUser = new contact({
				_id: ID,
				stocks: []
			});
			newUser.save();
			return ticker;
		} else {
			return ticker; // User already here, just return.
		}
	});
}