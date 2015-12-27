var Client = require('node-rest-client').Client;

var client = new Client();


var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb'//,
    //debug : true
});

/* connect
 * TODO : handle any connection errors
 */
connection.connect();


exports.getDelTimeAndPrice = function(req, res) {
    var body = req.body;
    
    var delivery_time = 1;
    var price = 0;
    // make sure every thing is there in the body
    if(body.item_category == undefined || body.item_count == undefined || body.customer_id == undefined) {
        console.log("body error"); 
        res.status(400).send({error : "Wrong body"});
    } else {
        // fetch the product using the item category
        connection.query("SELECT * FROM products WHERE id = ?", body.item_category, function(err, rows, fields) {
            var pRow = rows[0];
            if(err || pRow == undefined || !pRow.availability) {
                console.log(err + "pRow error");
                res.status(404).send();
            } else {
                // validate the item count
                if(body.item_count < pRow.item_count_floor || body.item_count > pRow.item_count_max) {
                    console.log("item count error");
                    res.status(400).send({error : "wrong item_count"});
                } else {
                    // add each items delay
                    delivery_time += pRow.each_item_delay*body.item_count;

                    // fetch the user's mantaghe
                    connection.query("SELECT mantaghe FROM customer WHERE id = ?", body.customer_id, function(err, rows, fields) {
                        var cRow = rows[0];
                        if(err || cRow == undefined) {
                            console.log(err + "cRow error");
                            res.status(404).send();
                        } else {
                            // fetch the mantaghe delay
                            connection.query('SELECT delivery_delay FROM manategh WHERE name = ?', cRow.mantaghe, function(err, rows, fields) {
                                var mRow = rows[0];
                                if(err || mRow == undefined) {
                                    console.log(err);
                                    res.status(500).send();
                                } else {
                                    // add the mantaghe delay
                                    delivery_time += mRow.delivery_delay;

                                    // calculate the price
                                    price += body.item_count*pRow.nerkh;

                                    // send the response back
                                    res.status(200).send({
                                        delivery_time : delivery_time,
                                        price : price
                                    });
                                }
                            });
                        }
                    });


                }
            }
        });
    }
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
                                    item_count : req.body.item_count,
                                    customer_id : req.user.id
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

exports.getOrders = function(req, res) {
    // make sure its an operator
    if(req.user.role != 'OPERATOR') res.status(401).send();
    else {
        var limit = 10;
        var min_id = 0;
        var sending_status = 0;
        var delivery_status = 0;
        //var response = [];

        // parse the delivery status
        var reqDelStatus = req.query.delivery_status;
        if(reqDelStatus != undefined || reqDelStatus != null) {
            if(reqDelStatus == 0) sending_status = 0;
            else if(reqDelStatus == 1) sending_status = 1;
            else if(reqDelStatus == 2) {sending_status = 1; delivery_status = 1;}
        }

        // parse the limit
        if(req.query.limit != undefined && req.query.limit != null && req.query.limit > 0 && req.query.limit < 15) limit = parseInt(req.query.limit);

        // parse the min_id
        if(req.query.min_id != undefined && req.query.min_id != null) min_id = parseInt(req.query.min_id);
        
        // fetch the order based on the url query
        connection.query(
                'SELECT orders.id, orders.sending_status, orders.delivery_status, customer.mantaghe, products.product_name FROM products INNER JOIN (orders INNER JOIN customer ON orders.customer_id = customer.id) ON orders.item_category = products.id WHERE orders.id > ? AND orders.sending_status = ? AND orders.delivery_status = ?   LIMIT ?', 
                [min_id, sending_status, delivery_status, limit], function(err, rows, fields) {
                    if(err) {
                        console.log(err);
                        res.status(500).send();
                    } else if(rows.length == 0) {
                        res.status(404).send({error : "no records found"});
                    } else {
                        res.status(200).send(rows);
                    }
                    
                });
    }
}

exports.getOrder = function(req, res) {
    // make sure its an operator
    if(req.user.role != 'OPERATOR') res.status(401).send();
    else if(req.params.order_id == undefined || req.params.order_id < 1 || req.params.order_id == null) res.status(400).send();
    else {
        // perform the query using the order id
        connection.query('SELECT products.product_name, orders.item_count, orders.customer_id, orders.order_time, orders.p_delivery_time, orders.delivery_time, orders.sending_status, orders.delivery_status, orders.total_price, customer.mantaghe, customer.address FROM products INNER JOIN (orders INNER JOIN customer ON orders.customer_id = customer.id) ON orders.item_category = products.id WHERE orders.id = ?', req.params.order_id, function(err, rows, fields) {
            if(err) {
                console.log(err);
                res.status(500).send();
            } else if (rows[0] == undefined) {
                res.status(404).send();
            } else {
                res.status(200).send(rows[0]);
            }
        })
    }
}

exports.deleteOrder = function(req, res) {
    if(req.user.role != 'OPERATOR') res.status(401).send();
    else if(req.params.order_id == undefined || req.params.order_id < 1 || req.params.order_id == null) res.status(400).send();
    else {
        // delete the order
        connection.query('DELETE FROM orders WHERE id = ?', req.params.order_id, function(err, result) {
            if(err) {
                console.log(err);
                res.status(500).send();
            } else {
                res.status(200).send();
            }
        })
    }
}

exports.updateSendingStatus = function(req, res) {
    var jBody = req.body;
    if(req.user.role != 'OPERATOR') res.status(401).send();
    else if(req.params.order_id == undefined || req.params.order_id < 1 || req.params.order_id == null) {
        console.log("order_id error");
        res.status(400).send();
    }
    else if(jBody == undefined || jBody == null || jBody.sending_status < 0 || jBody.sending_status > 1) {
        console.log("sending_status error" +  req.body.sending_status);
        res.status(400).send();
    }
    else {
        // update the sending status
        connection.query('UPDATE orders SET sending_status = ? WHERE id = ?', [jBody.sending_status,  req.params.order_id], function(err, result) {
            if(err) {
                console.log(err);
                res.status(500).send();
            } else {
                res.status(200).send();
            }
        })
    }
}

exports.updateDeliveryStatus = function(req, res) {
    var jBody = req.body;
    if(req.user.role != 'OPERATOR') res.status(401).send();
    else if(req.params.order_id == undefined || req.params.order_id < 1 || req.params.order_id == null) {
        console.log("order_id error");
        res.status(400).send();
    }
    else if(jBody == undefined || jBody == null || jBody.delivery_status < 0 || jBody.delivery_status > 1) {
        console.log("delivery_status error" +  req.body.delivery_status);
        res.status(400).send();
    } else {
        // delivery time
        var d = new Date();
        // update the delivery status only if the sending status is true
        if(jBody.delivery_status == 1) {
            connection.query('UPDATE orders SET delivery_status = ?, delivery_time = ? WHERE id = ? AND sending_status = 1', [jBody.delivery_status, d.getTime(), req.params.order_id], function(err, result) {
                if(err) {
                    console.log(err);
                    res.status(500).send();
                } else if(result.changedRows == 0) {
                    console.log("No row was changed");
                    res.status(400).send();
                } else {
                    res.status(200).send();
                }
            })
        } else {
            connection.query('UPDATE orders SET delivery_status = ?, delivery_status = ? WHERE id = ?', [jBody.delivery_status, d.getTime(),  req.params.order_id], function(err, result) {
                if(err) {
                    console.log(err);
                    res.status(500).send();
                } else if(result.changedRows == 0) {
                    console.log("No row was changed");
                    res.status(400).send();
                } else {
                    res.status(200).send();
                }
            })
        }
        
    }
}
