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
