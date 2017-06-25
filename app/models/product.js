// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var searchable = require('mongoose-searchable');

var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Product', (new Schema({
    name: String,
    description: String,
    owner: {type: Schema.Types.ObjectId, ref: 'User'}
})).plugin(searchable));
