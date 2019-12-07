const express = require('express');
var session = require('express-session')
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const localtunnel = require('localtunnel');
const http = require('http');

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(session({
  secret: '******',
  resave: false,
  saveUninitialized: true,
}))
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//run this command in cloud shell to start proxy from mysql:
//./cloud_sql_proxy -instances=umass-class:us-central1:umassclass=tcp:3306
var con = mysql.createConnection({ //create 'con' a connection with mysql
  host: "localhost",
  user: "root",
  password: "******",
  database: "********"
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
    return res.redirect('http://umassclass.com'); //redirect to new page after done postingt to mysql
    
  });
});


var greetingName = -1;

app.post('/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  console.log('here is your email and pass ' + email + ' ' + password);
  if (email && password) {
    con.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function(error, result, fields) {
      if (result.length > 0) {
        greetingName = result[0].firstName;
        req.session.loggedin = true; //now user is logged in
        req.session.username = email;
        res.redirect('/home');
      } else {
        res.send('Incorrect Email and/or Password!');
      }     
      res.end();
    });
  } else {
    res.send('Please enter email and Password!');
    res.end();
  }
});

app.get('/home', function(req, res) {
  if (req.session.loggedin) { //how to check if user is logged in
    console.log('Welcome back, ' + greetingName + '!');
    return res.redirect('http://umassclass.com');
  } else {
    console.log('Please login to view this page!');
    return res.redirect('http://umassclass.com');
  }
  res.end();
});

app.post('/leaveReview', function(req, res) {
  if (req.session.loggedin) { 
    var comment = req.body.comment;
    var sql = "INSERT INTO reviews (review) VALUES (?)"; //this is the command that is run in mysql
    con.query(sql, [comment], function (err, result) {
      if (err) throw err;
      console.log("Review left");
      return res.redirect('/displayReviews'); //redirect to new page after done postingt to mysql
    });
  }  
  else{
    res.redirect('http://umassclass.com/login.html')
  }
});

//html string that will be send to browser
var reo ='<html><head><title>Class Reviews</title></head><body><h1>Class Reviews</h1>{${table}}</body></html>';

//sets and returns html table with results from sql select
//Receives sql query and callback function to return the table
function setResHtml(sql, cb){
    con.query(sql, (err, res, cols)=>{
      if(err) throw err;

      var table =''; //to store html table

      //create html table with data from res.
      for(var i=0; i<res.length; i++){
        table +='<tr><td>'+ (i+1) +'</td><td>'+ res[i].review +'</td></tr>';
      }
      table ='<table border="1"><tr><th>Nr.</th><th>Review</th></tr>'+ table +'</table>';
      
      return cb(table);
    });
}

let reviewSql ='SELECT * FROM reviews';

app.get('/displayReviews', function(req, res) {
  setResHtml(reviewSql, resql=>{
    reo = reo.replace('{${table}}', resql);
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.write(reo, 'utf-8');
    res.end();
  }); 
});



const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`app listening at http://${host}:${port}`);
});
