var express     = require('express');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config'); // get our config file
var User   = require('../app/models/user'); // get our mongoose model
var Product = require('../app/models/product');

// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router(); 

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)

// TODO: route middleware to verify a token

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  // find the user
  console.log("finduser", req.body);
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {
      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, config.secret, {
          expiresIn: 60*60*24 // expires in 24 hours
        });
        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   
    }
  });
});

// route to sign up (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
  console.log("signup", req.body.name);
  User.find({name : req.body.name}, function (err, docs) {
    if (err) throw err;
    if (docs.length){
      res.json({
        success: false,
        message: "User exist"
      });
    } else {
      // create an user
      var nick = new User({ 
        name: req.body.name, 
        password: req.body.password,
        admin: false 
      });
      console.log(nick);
      // save the user
      nick.save(function(err) {
        if (err) throw err;
        console.log('User saved successfully');
        res.json({
          success: true, 
          message: 'Signed up successfully'
        });
      });
    }
  });
});

// GET /searchUsers?q=...
apiRoutes.get('/searchUsers', (req, res) => {
  var queryString = String(req.query.q);
  console.log(req.query);
  User.find({}, (err, data) => {
    data = data.filter((e) => {
      return e.name.indexOf(queryString) !== -1 || 
        (e.address && e.address.indexOf(queryString) !== -1) ||
        (e.realName && e.realName.indexOf(queryString) !== -1);
    });
    res.json(data);
  });
});

// GET /searchProducts?q=...
apiRoutes.get('/searchProducts', (req, res) => {
  var queryString = String(req.query.q);
  console.log(req.query);
  Product.find({}, (err, data) => {
    data = data.filter((e) => {
      return e.name.indexOf(queryString) !== -1 || 
        (e.description && e.description.indexOf(queryString) !== -1);
    });
    res.json(data);
  });
});

apiRoutes.get('/getProducts/:username', (req, res) => {
  console.log(req.params);
  User.findOne({name: req.params.username}).populate('products')
  .exec((err, user) => {
    res.json(user.products);
  });
});

// GET /profile/:username
apiRoutes.get('/profile/:username', (req, res) => {
  User.findOne({name: req.params.username}).populate('products').exec((err, user) => {
    res.json(user);
  });
});

apiRoutes.get('/profile/view/:username', (req, res) => {
  res.render('profile', {username: req.params.username});
});

apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });

});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {
  // verifies secret and checks exp
  jwt.verify(token, config.secret, function(err, decoded) {      
    if (err) {
      return res.json({ success: false, message: 'Failed to authenticate token.' });    
    } else {
      // if everything is good, save to request for use in other routes
      req.decoded = decoded;    
      next();
    }
  });

  } else {
    // if there is no token
    // return an error
    return res.status(403).send({ 
      success: false, 
      message: 'No token provided.' 
    });
  }
});

apiRoutes.get('/profile', (req, res) => {
  User.findById(req.decoded._doc._id).populate('products').exec((err, user) => {
    res.json(user);
  });
});

// route to return all users
apiRoutes.get('/users', function(req, res) {
  //console.log(req);
  User.findById(req.decoded._doc._id, (err, user) => {
    console.log(user);
    if (user.admin) {
      User.find({}, function(err, users) {
        res.json(users);
      });  
    } else {
      res.end();
    }
  });
});

apiRoutes.post('/postProduct', (req, res) => {
  console.log(req.decoded._doc);
  var newProduct = new Product({
    name: req.body.name,
    description: req.body.description,
    owner: req.decoded._doc._id
  });
  newProduct.save(function(err) {
    if (err) throw err;
    console.log('Product posted successfully');
    User.findById(req.decoded._doc._id, (err, user) => {
      if (err) throw err;
      user.products.push(newProduct._id);
      user.save(function(err) {
        if (err) throw err;
        res.json({
          success: true, 
          message: 'Product posted successfully'
        });
      });
    });
  });
});

apiRoutes.post('/eraseProduct', (req, res) => {
  console.log('Erase', req.body.productId);
  User.findById(req.decoded._doc._id, (err, user) => {
    if (err) throw err;
    for (let i = 0; i < user.products.length; ++i) {
      if (user.products[i] == req.body.productId) {
        Product.remove({_id: req.body.productId}, (err) => {
          if (err) throw err;
        });
        user.products.splice(i, 1);
        user.save((err) => {
          if (err) throw err;
          console.log("Erased product successfully");
          res.json({
            success: true,
            message: "Erased product successfully" 
          });
        });
        return;
      }
    }
    res.json({
      success: false,
      message: "Cannot find product"
    })
  });
});

apiRoutes.post('/updateInfo', (req, res) => {
  User.findById(req.decoded._doc._id, (err, user) => {
    if (err) throw err;
    user.realName = req.body.name;
    user.address = req.body.address;
    user.phoneNumber = req.body.phone;
    user.email = req.body.email;
    user.description = req.body.description;
    user.save((err) => {
      if (err) throw err;
      console.log("Updated successfully");
      res.json({
        success: true,
        message: "Updated successfully" 
      });
    });
  });
});
/*
apiRoutes.post('/uploadImage', (req, res) => {
  var Storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, "./images");
    },
    filename: function(req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
  });
  var upload = multer({
    storage: Storage
  }).array("imgUploader", 3); //Field name and max count

  upload(req, res, function(err) {
    if (err) {
      return res.end("Something went wrong!");
    }
    return res.end("File uploaded sucessfully!.");
  });
});

*/
module.exports = apiRoutes;