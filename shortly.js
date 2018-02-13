var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));


app.get('/',
  function (req, res) {
    if (req.session.user) {
      res.render('index');
    } else {
      req.session.error = 'Access denied!';
      res.redirect('/login');
    }
  });

app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.post('/login', function (req, res) {

  var username = req.body.username;
  var password = req.body.password;

  db.knex('users').where({
    username: username
  }).select('password').then(function (data, err) {
    bcrypt.compare(password, data[0].password, function (errr, success) {
      console.log('ress', success);
      if (success) { // if the password is right we get a true as a success
        req.session.user = username;
        req.session.save((err3) => { //after saving the user on the session redirect to index and let user view links
          if (!err3) {
            console.log('in !err block');
            res.redirect('/');
          }
        });
      } else {
        console.log('wrong password');
        res.redirect('/login');
      }
    });
  });
});




app.get('/index',
  function (req, res) {
    if (req.session.user) {
      res.render('index');
    } else {
      req.session.error = 'Access denied!';
      res.redirect('/login');
    }
  });

app.get('/create',
  function (req, res) {
    res.render('index');
  });

app.get('/links',
  function (req, res) {
    Links.reset().fetch().then(function (links) {
      res.status(200).send(links.models);
    });
  });

app.post('/links',
  function (req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function (found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function (err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
            .then(function (newLink) {
              res.status(200).send(newLink);
            });
        });
      }
    });
  });


app.get('/signup',
  function (req, res) {
    res.render('signup');
  });

app.post('/signup', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  util.createUser(username, password, function (error, data) {
    if (error) {
      console.log(error);
    } else {
      req.session.user = username;
      res.redirect('/');
    }
  });

});

app.get('/logout',
  function (req, res) {
    req.session.destroy(function(err){
      if(err) throw err;
      console.log('logged out');
      res.redirect('/login');
    })
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function (req, res) {
  new Link({ code: req.params[0] }).fetch().then(function (link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function () {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function () {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
