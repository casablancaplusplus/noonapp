// install this module useing "$ npm install node-rest-client" before using
var Client = require('node-rest-client').Client;

var client = new Client();

client.on('error', function(err) {
    console.log('something went wrong on the client', err);
});


exports.sendVerificationCode = function(receptor, verificationCode) {

    var apiKey='56792F63586A2B57474232706E4561513872764E56673D3D';
    var sender='30006703323323';
    var message='noonapp verification code : ' + verificationCode;
    var url = "https://api.kavenegar.com/v1/"+apiKey+"/sms/send.json?receptor="+receptor+"&sender="+sender+"&message="+message;

    // consume the service
    client.get(url, function(data, response) {
        // parsed response body 
        console.log(data);
        // raw response
        console.log(response);
    }).on('error', function(err) {
        console.log('something went wrong on the request', err);
    });
}
