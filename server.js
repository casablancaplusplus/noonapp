var express = require('express'),
    orders = require('./routes/orders'),
    manategh = require('./routes/manategh'),
    customers = require('./routes/customers');
var bodyParser = require('body-parser');

var app = express();

if(app.get('env')) {
    app.use(express.logger('dev'));
    app.use(bodyParser.json());
}


// get an order's delivery time and price
app.post('/orders/dtandp', bodyParser.json(), orders.getDelTimeAndPrice);

// register a new customer
app.post('/customers', bodyParser.json(), customers.registerNewCustomer);

// Fetch the manategh
app.get('/manategh', manategh.fetchManateghList);

app.listen(3000);
console.log('Listening on localhsot...');
