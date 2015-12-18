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


exports.fetchManateghList = function(req, res) {
    // fetch the manategh from the database
    connection.query("SELECT * FROM manategh", function(err, rows, fields) {
        if(err) console.log(err);
        
        // the response array
        var resArray = [];
        var i = 0;
        while(i < rows.length) {
            resArray.push(rows[i].name);
            i++;
        }

        res.status(200).send(resArray);

    });
}
