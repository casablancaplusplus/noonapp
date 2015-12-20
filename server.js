var express = require('express'),
    orders = require('./routes/orders'),
    manategh = require('./routes/manategh'),
    customers = require('./routes/customers'),
    tokens = require('./routes/tokens'),
    products = require('./routes/products');
var bodyParser = require('body-parser');

var passport = require('passport');
var Strategy = require('passport-http-bearer').Strategy;

var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb',
    debug : true
});

connection.connect();


passport.use(new Strategy(
  function(token, cb) {
    /*db.users.findByToken(token, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      return cb(null, user);
    });
    */
      // fetch the user from the database
      connection.query("SELECT customer_id FROM tokens WHERE access_token = ?", token, function(err, rows, fields) {
          if(err) {return cb(err);}
          else {
              connection.query("SELECT * FROM customer WHERE id = ?", rows[0].customer_id, function(err, rows, fields) {
                  if(err) {return cb(err);}
                  else {
                      return cb(null, rows[0]);
                  }
              });
          }
      });
  }));

var app = express();

if(app.get('env')) {
    app.use(express.logger('dev'));
    app.use(bodyParser.json());
    app.use(require('morgan')('combined'));
}


// get an order's delivery time and price
app.post('/orders/dtandp', bodyParser.json(), orders.getDelTimeAndPrice);

// submit an order
app.post('/orders', passport.authenticate('bearer', {session:false}), orders.submitOrder );




// register a new customer
app.post('/customers', bodyParser.json(), customers.registerNewCustomer);

// retrieve an access token
app.post('/tokens/access_token', bodyParser.json(), tokens.getAccessToken);

// Fetch the manategh
app.get('/manategh', manategh.fetchManateghList);

// fetch customer address
app.get('/customers/:customer_id/address', passport.authenticate('bearer', {session:false}), customers.getCustomerAddress);
// update customer address
app.put('/customers/:customer_id/address', passport.authenticate('bearer', {session:false}), customers.updateCustomerAddress);


// get a products nerkh
app.get('/products/:product_id/nerkh', products.getProductNerkh);
// fetch the available products list
app.get('/products', products.getAvailableProducts);



app.listen(3000);
console.log('Listening on localhsot...');
