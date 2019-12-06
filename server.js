const express = require('express');
var session = require('express-session')
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const localtunnel = require('localtunnel');

app.use(bodyParser.urlencoded({ extended: false })); 

//run this command in cloud shell to start proxy from mysql:
//./cloud_sql_proxy -instances=umass-class:us-central1:umassclass=tcp:3306
var con = mysql.createConnection({ //create 'con' a connection with mysql
  host: "localhost",
  user: "root",
  password: "*****",
  database: "******"
});

con.connect(function(err) {     //connect to mysql with 'con'
  if (err) throw err;
  console.log("Connected!");
  });

 //create a local tunnel for the html to point to 
(async () => {
  const tunnel = await localtunnel({ port: 8080, subdomain : 'tardis' });
 
  // the assigned public url for your tunnel
  // i.e. https://abcdefgjhij.localtunnel.me
  tunnel.url;
 
  tunnel.on('close', () => {
    console.log('localtunnel closed!')
  });
})();


app.post('/addAccount', (req, res) => {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;

  var sql = "INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)"; //this is the command that is run in mysql
  con.query(sql, [firstName, lastName, email, password], function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
    res.send("Thanks for registering!")
    return res.redirect('http://umassclass.com'); //redirect to new page after done postingt to mysql
    
  });
});


app.post('/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  if (username && password) {
    connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/home');
      } else {
        res.send('Incorrect Username and/or Password!');
      }     
      res.end();
    });
  } else {
    res.send('Please enter Username and Password!');
    res.end();
  }
});


  const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`app listening at http://${host}:${port}`);
});
