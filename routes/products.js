var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'C0nsistency4g00d',
    database : 'noonappDb',
    debug : true
});


exports.getProductNerkh = function(req, res) {
    // fetch the product nerkh
    connection.query('SELECT nerkh FROM products WHERE id = ?', req.params.product_id, function(err, rows, fields) {
        if(err) {
            console.log(err);
            res.status(500).send();
        } else {
            res.status(200).json({nerkh : rows[0].nerkh});
        }
    });
}

exports.getAvailableProducts = function(req, res) {
    // fetch the available products
    connection.query('SELECT * FROM products WHERE availability = 1', function(err, rows, fields) {
        if(err) {
            console.log(err);
            res.status(500);
        } else {
            var jRes = [];
            for(var i = 0; i<rows.length; i++) {
                jRes.push({id:rows[i].id, name:rows[i].product_name});
            }
            res.status(200).send(jRes);

    }});
}
