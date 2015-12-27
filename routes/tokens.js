var mysql = require('mysql');
var crypto = require('crypto');
var smsSender = require('./sms');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb',
    debug : true
});


exports.getAccessToken = function(req, res) {
    var jBody = req.body;

    var verification_token = "";
    var verification_code = "";

    if(jBody.verification_token != undefined || jBody.verification_token != null) {
        verification_token = jBody.verification_token;

    if(jBody.verification_code != undefined || jBody.verification_code != null) {
        verification_code = jBody.verification_code;


    // fetch the database version
    connection.query('SELECT * FROM tokens WHERE verification_token = ?', verification_token, function(err, rows, fields) {
        if(err) {
            console.log(err);
            res.status(400).send({error : "invalid verification_token"});
        } else {
            var theRow = rows[0];
            console.log(req.body);
            // compare the data base version with the jBody version
            if(theRow.verification_code != verification_code) {
                res.status(401).send({error : "invalid verification_code"});
            } else {
                // validate the user
                connection.query('UPDATE customer SET validity = true where id = ?', theRow.customer_id, function(err, result) {
                    if(err) {
                        console.log(err);
                        res.status(500).send();
                    } else {
                        // generate an access token
                        var d = new Date();
                        var rawText = ""+theRow.verification_code+""+theRow.verification_token+""+d.getTime()+"PleaseReportThisBugTo09169211845";
                        // md5 encode it
                        var hash = crypto.createHash('md5').update(rawText).digest('hex');
                        console.log(hash);
                        // update values
                        var updateVals = {};
                        updateVals.access_token = hash;
                        updateVals.date_token_created = d.getTime();
                        // store the hash in the data base
                        connection.query('UPDATE tokens SET ? WHERE customer_id = ?', [updateVals, theRow.customer_id], function(err, result) {
                            if(err) {
                                console.log(err);
                                res.status(500).send();
                            } else {
                                res.status(200).send({access_token : hash, customer_id : theRow.customer_id});
                            }
                        });
                    }
                });
            }
        }
    });
    } else {
        res.status(400).send({error : "no verification_code was set"});
    }
    } else {
        res.status(400).send({error : "no verification_token was set"});
    }
}

exports.getNewVerificationCode = function(req, res) {
    var jBody = req.body;

    if(jBody.verification_token == undefined || jBody.new_phone_number == undefined) {
        res.status(400).send();
    } else {
        // fetch the tokens record with the jBody verificaion token
        connection.query('SELECT * FROM tokens WHERE verification_token = ?', jBody.verification_token, function(err, rows, fields) {
            if(err || rows[0] == undefined) {
                console.log("ver token : " + jBody.verification_token);
                console.log(err + "the point where the tokens record is fetched");
                res.status(500).send();
            } else {
                // update the customer using the customer_id field in the rows
                connection.query('UPDATE customer SET phone_number = ? WHERE id = ?', [jBody.new_phone_number, rows[0].customer_id], function(err, result) {
                    if(err) {
                        console.log(err+ " the point where the customer is fetched");
                        res.status(500).send();
                    } else {
                        // send the verification code to the customer via sms
                        smsSender.sendVerificationCode(jBody.new_phone_number, rows[0].verification_code);
                        res.status(200).send();
                    }
                })   
            }
        })
    }
}
