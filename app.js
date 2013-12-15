
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

var passport = require('passport');
var fs = require('fs');
var mysql  = require('mysql');

var config = require('./config/config');
auth = require('./config/middlewares/authorization');

//Bootstrap db connection
var dbPool = mysql.createPool(config.db);

//Bootstrap models

/*
var models_path = __dirname + '/app/models';
var walk = function(path) {
  fs.readdirSync(path).forEach(function(file) {
    var newPath = path + '/' + file;
    var stat = fs.statSync(newPath);
    if (stat.isFile()) {
      if (/(.*)\.(js|coffee)/.test(file)) {
        require(newPath);
      }
    } else if (stat.isDirectory()) {
      walk(newPath);
    }
  });
};
walk(models_path);
*/
//bootstrap passport config
require('./config/passport')(passport, dbPool);

var app = express();

//express settings
require('./config/express')(app, passport);

require('./config/routes')(app, passport, auth, dbPool);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//expose app
exports = module.exports = app;