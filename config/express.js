/*jslint node: true */
/**
 * Module dependencies.
 */
var express = require('express'),
  flash = require('connect-flash'),
  helpers = require('view-helpers'),
  config = require('./config'),
  jade = require('jade');

module.exports = function(app, passport) {
  "use strict";
  /*

   // all environments
   app.set('port', process.env.PORT || 3000);
   app.set('views', path.join(__dirname, 'views'));
   app.set('view engine', 'jade');
   app.use(express.favicon());
   app.use(express.logger('dev'));
   app.use(express.json());
   app.use(express.urlencoded());
   app.use(express.methodOverride());
   app.use(app.router);
   app.use(express.static(path.join(__dirname, 'public')));

   // development only
   if ('development' == app.get('env')) {
   app.use(express.errorHandler());
   }

   */

  app.set('port', config.port || 3000);
  app.set('showStackError', true);

  //Should be placed before express.static
  app.use(express.compress({
    filter: function(req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  //Setting the fav icon and static folder
  app.use(express.favicon());

  var clientLocation = '/public';
  app.use(express.static(config.root + clientLocation));

  //Don't use logger for test env
  app.use(express.logger('dev'));

  //Set views path, template engine and default layout
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'jade');

  //Enable jsonp
  app.enable("jsonp callback");

  app.configure(function() {
    //cookieParser should be above session
    app.use(express.cookieParser());

    //bodyParser should be above methodOverride
    app.use(express.bodyParser({
        uploadDir: config.root + '/uploads',
        keepExtensions: true
    }));
    app.use(express.limit('5mb'));
    //app.use(express.multipart());

    app.use(express.methodOverride());

    //express/mongo session storage
    app.use(express.session({secret: 'mybeeble-3hXa6JpcA -?exc]_64_4.Y%*:Zj@_$;lY/jLOy?'}))

    //connect flash for flash messages
    //app.use(flash());

    //dynamic helpers
    app.use(helpers(config.app.name));

    //use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    //routes should be at the last
    app.use(app.router);

    //Assume "not found" in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
    app.use(function(err, req, res, next) {
      //Treat as 404
      if (~err.message.indexOf('not found')) return next();

      //Log it
      console.error(err.stack);

      //Error page
      res.status(500).render('500', {
        error: err.stack
      });
    });

    //Assume 404 since no middleware responded
    app.use(function(req, res, next) {
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not found'
      });
    });

    // replaces all html files with jade templates, because jade is cool
    app.get('/js/modules/*.html', function (req, res) {
      var path = __dirname + '/..' + clientLocation + req.url.replace('.html', '.jade');
      jade.renderFile(
        path,
        function (err, html) {
          res.send(html);
        }
      );
    });

  });
};
