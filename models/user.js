var mongoose = require('mongoose');

// Create the Schema
var contactSchema = new mongoose.Schema({
        _id: String,
        stocks: [{
                type: String
        }]
});

// create the model
module.exports = mongoose.model('contacts', contactSchema);