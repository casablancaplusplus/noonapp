var Client = require('node-rest-client').Client;

var client = new Client();


exports.sendVerificationCode = function(receptor, verificationCode) {

    var apiKey='56792F63586A2B57474232706E4561513872764E56673D3D';
    var sender='30006703323323';
    var message='noonapp verification code : ' + verificationCode;
    var url = "https://api.kavenegar.com/v1/"+apiKey+"/sms/send.json?receptor="+receptor+"&sender="+sender+"&message="+message;

    try {
    // consume the service
    client.get(url, function(data, response) {
        console.log(data);
        console.log(response);
    }); 
    } catch(e) {
        
    }
}
