var contact = require('./models/user'); // import db
module.exports = function(ID) { // Passes unique Echo ID
        return contact.findOne({
                _id: ID
        });
}