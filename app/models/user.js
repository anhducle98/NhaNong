// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var searchPlugin = require('mongoose-search-plugin');
var searchable = require('mongoose-searchable');

// set up a mongoose model and pass it using module.exports
var Schema = new mongoose.Schema({ 
    name: String,
    password: String, 
    realName: String,
    imageLink: String,
    timeCreated: Date,
    address: String,
    phoneNumber: String,
    email: String,
    description: String,
    products: [{type: mongoose.Schema.Types.ObjectId, ref: 'Product'}],
    admin: Boolean 
});

Schema.plugin(searchable, {
    keywordField:'keywords',
    language:'english',
    fields:['name','realName'],
    extract: function(content, done){
        done(null, content.split(' '));
    }
});
module.exports = mongoose.model('User', Schema);
