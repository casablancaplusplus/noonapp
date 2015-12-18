var express = require('express'),
    orders = require('./routes/orders');
var bodyParser = require('body-parser');

var app = express();

if(app.get('env')) {
    app.use(express.logger('dev'));
    app.use(bodyParser.json());
}


// get an order's delivery time and price
app.post('/orders/dtandp', bodyParser.json(), orders.getDelTimeAndPrice);


app.listen(3000);
console.log('Listening on localhsot...');
