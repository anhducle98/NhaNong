// =======================
// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var config = require('./config'); // get our config file
var mongoose  = require('mongoose');
var exphbs = require('express-handlebars');

var cors = require('cors')

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8888; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database

app.use(express.static('public'));
app.set('superSecret', config.secret); // secret variable
app.set('views', __dirname + '/' + 'views');

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use morgan to log requests to the console
app.use(morgan('dev'));

app.engine('hbs', exphbs.create({
    extname: 'hbs',
}).engine);

app.set('view engine', 'hbs');
// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

var apiRoutes = require('./api/router.js');

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
