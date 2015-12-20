var smsSender = require('./sms');

var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb',
    debug : true
});


exports.getCustomerAddress = function(req, res) {
    // compare the customers id provided in the url and the authenticated user
    if(req.params.customer_id != req.user.id) {
        res.status(401).send();
    } else {
        res.status(200).send({address : req.user.address});
    }

}

exports.updateCustomerAddress = function(req, res) {
    if(req.params.customer_id != req.user.id) {
        res.status(401).send();
    } else {
        // parse the body
        var jBody = req.body;
        if(jBody.new_address == undefined || jBody.new_address == null) {
            res.status(400).send({error :"invalid body"});
        } else {
            // update the address 
            connection.query('UPDATE customer SET address = ? WHERE id = ?', [jBody.new_address, req.user.id], function(err, result) {
                if(err) {
                    console.log(err);
                    res.status(500).send();
                } else {
                    res.status(200).send();
                }
            });

        }
    }
}

exports.registerNewCustomer = function(req, res) {
    // parse the body
    var reqBody = req.body;

    // expected fields
    var phoneNumber = undefined;
    var mantaghe = undefined;
    var address = undefined;

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

    

    // make sure nothing is undefined
    //if(phoneNumber == undefined || mantaghe == undefined || address == undefined) {
    //    res.status(400).send({error : "wrong parameters"});
    //} else {

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
            // values that are going to be inserted in the token table for this customer
            var verValues = {}; 
            // get the inserted row id
            verValues.customer_id = result.insertId;

            // generate the verification code
            verValues.verification_code = "";
            for(var i = 0; i<4; i++) {
               verValues.verification_code += Math.floor((Math.random() * 10)); 
            }

            // generate verification token
            verValues.verification_token = "";
            for(var i = 0; i<9; i++) {
                verValues.verification_token += Math.floor((Math.random() * 10));
            }

            // insert the data in the database
            connection.query('INSERT INTO tokens SET ?', verValues, function(err, result) {
                if(err) {
                    console.log(err);
                    res.status(500).send({error : "Couldn't insert the data in the database"});
                } else {
                    
                    res.status(200).send({verification_token : verValues.verification_token});

                    // TODO send verification_code in an sms
                    smsSender.sendVerificationCode(values.phone_number, verValues.verification_code);
                }
            });

        }
    });


}//}
