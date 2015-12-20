var Client = require('node-rest-client').Client;

var client = new Client();


var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb',
    debug : true
});

/* connect
 * TODO : handle any connection errors
 */
connection.connect();


exports.getDelTimeAndPrice = function(req, res) {
    var jRes = req.body;
    // response sent indicator
    var responseSent = false;

    var responseObj = {};
    responseObj.delivery_time = 1;
    // validate the fields
    // check the category
    var cat = jRes.item_category;
    if((!cat || cat == null) && !responseSent) {
        res.status(400).send({error : 'no item_category was set'});
        responseSent = true;
    }
    // dbug
    console.log("category : " + cat);

    // check the item's count
    var count = jRes.item_count;
    if((!count || count == null || count < 4) && !responseSent) {
        res.status(400).send({error : 'item_count not sent or invalid'});
        responseSent = true;
    }
    //dbug
    console.log("count : " + count);

    // fetch the item category fields from the database
    connection.query('SELECT * FROM products WHERE id = ?', cat, function(err, rows, fields) {
        if(err) {
            console.log(err.message);
            if(!responseSent) {
                res.status(500).send({error : 'product probably does not exist'});
                responseSent = true;
            }
        } else {
            if(rows[0] == undefined && !responseSent) 
                {
                    res.status(500).send({error : 'product probably does not exist'});
                    responseSent = true;
                }
            
            // check availability
            var theRow = rows[0];
            if((theRow.availability == false || theRow.availability == 0) && !responseSent) {
                res.status(400).send({error : 'product is not available'});
                responseSent = true;
            }
            //dbug
            console.log(typeof(fields));
            console.log("THE HELLLLLLLLLLLLLL : " + rows[0]);

            // calculate the price
            responseObj.price = theRow.nerkh * count;
            // calculate some of the delay
            responseObj.delivery_time += count * theRow.each_item_delay;
        }
    });

    // fetch the delays based on the customer's mantaghe
    connection.query('SELECT * FROM delivery_delays WHERE id = ?', 1, function(err, rows, fields) {
        if(err) {
            console.log(err.message);
            if(!responseSent) { 
                res.status(500).send({error : 'something went wrong with the delays table'});
                responseSent = true;

             }
        }
        // mantaghe delivery delay
        var theRow = rows[0];
        responseObj.delivery_time += theRow.delay;
        console.log("delayyyyyyyyyyyyyy : " + rows[0].title);
   
        if(!responseSent)
            res.status(200).send(responseObj);
    });


}

exports.submitOrder = function(req, res) {
    // check the validity of the user
    if(!req.user.validity) {
        res.status(401).send({error : "invalid user"});
    } else {
        
        var jBody = req.body;
        
        var item_count = jBody.item_count;
        var item_category = jBody.item_category;
        if(item_count == undefined || item_count == null || item_category == undefined || item_category == null) {
            res.status(400).send({error : "invalid body"});
        } else {
            // check the availability of the product
            connection.query('SELECT * FROM products WHERE id = ?', item_category, function(err, rows, fields) {
                if(err) {
                    res.status(400).send({error : "item doesn't exist or something wrong with the databse"});
                } else {
                    if(!rows[0].availability) {
                        res.status(400).send({error : "item not available"});
                    } else {
                        // TODO put a limit for the item count

                        // store the order in the database
                        var orderValues = {};

                        orderValues.item_category = item_category;
                        orderValues.item_count = item_count;
                        orderValues.customer_id = req.user.id;
                        var d = new Date();
                        orderValues.order_time = d.getTime();
                        orderValues.sending_status = false;
                        orderValues.delivery_status = false;
                        // get the dtandp
                        try {
                            var args = {
                                data : {
                                    item_category : req.body.item_category,
                                    item_count : req.body.item_count
                                },
                                headers : {"Content-Type" : "application/json"}
                            }

                            client.post("http://localhost:3000/orders/dtandp", args, function(data, response) {
                                var d = JSON.parse(data); 
                                orderValues.p_delivery_time = d.delivery_time;
                                orderValues.total_price = d.price;
                                
                                connection.query("INSERT INTO orders SET ?", orderValues, function(err, result) {
                                    if(err) {
                                        res.status(500).send();
                                    } else {
                                        res.status(200).send();
                                    }
                                });   
                            });
                        } catch(e) {
                            console.log(e);
                        }
/*
                        connection.query("INSERT INTO orders SET ?", orderValues, function(err, result) {
                            if(err) {
                                res.status(500).send();
                            } else {
                                res.status(200).send();
                            }
                        });
*/
                    }
                }
            });
        }
    }
}
