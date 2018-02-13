var request = require('request');
var db = require('../app/config');
var bcrypt = require('bcrypt');
var Users = require('../app/collections/users');
var User = require('../app/models/user');

exports.getUrlTitle = function (url, cb) {
  request(url, function (err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function (url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

exports.getUser = function (username, callback) {
  
  db.knex('users').where({
    username: username
  }).select().then(function (data, err) {
    if (err) { //error handling kinda
      console.log('err', err);
    } else {
      // if (data.length) { // if the username was found in the database redirect to index
        // req.session.user = username;
        // console.log('data', data);
        // res.redirect('/index');
        // let user = data[0];
        callback(data);
      // }
      // else {
      //   res.redirect('/login');
      // }
    }
  });
};

exports.createUser = function (username, password, callback) {
  
  exports.getUser(username, function (user) {
    console.log('I made it there');
    if (!user[0]) {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);
      console.log('here is the user from create user', username);
      Users.create({ //creating a dummy user for the sake of test
        username: username,
        password: hash,
      }).then(function (newUser) {
        callback(null,newUser);
        console.log('this is the user name after it worked', newUser);
      });
    }
  });
}

