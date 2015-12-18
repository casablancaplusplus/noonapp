var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb',
    debug : true
});


exports.registerNewCustomer = function(req, res) {
    // parse the body
    var reqBody = req.body;

    // expected fields
    var phoneNumber = null;
    var mantaghe = null;
    var address = null;

    // fetch the phone number from the body
    if(reqBody.phone_number != undefined && reqBody.phone_number != null) {
        phoneNumber = reqBody.phone_number;
    }

    // fetch the mantaghe
    if(reqBody.mantaghe != undefined && reqBody.mantaghe != null) {
        mantaghe = reqBody.mantaghe;
    }

    // fetch the address
    if(reqBody.address != undefined && reqBody.address != null) {
        address = reqBody.address;
    }

    // store the data in the database 
    var values = {};
    values.phone_number = phoneNumber;
    values.address = address;
    values.mantaghe = mantaghe;
    // get the time in millis since epoc
    var d = new Date();
    values.date_registered = "" + d.getTime();
    values.validity = false;
    
    connection.query('INSERT INTO customer SET ?', values, function(err, result) {
        if(err) {
            console.log(err.message);
            res.status(500).send({error : "could not store the data in the database"});
        } else {
            res.status(200).send();

            // TODO send a verification message
        }
    })

}
