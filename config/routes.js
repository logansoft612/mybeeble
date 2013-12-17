/*jslint node: true */
var async = require('async');

module.exports = function (app, passport, auth, dbPool) {
    "use strict";

    var notification = require('../app/controllers/notifications')(dbPool);
    //User Routes
    var users = require('../app/controllers/users')(dbPool, passport);
    /*app.post('/api/signin', passport.authenticate('local', {
        failureFlash: 'Invalid email or password.'
    }), users.session);*/
    app.post('/api/signin', users.session);
    app.post('/api/users', users.create);
    app.get('/api/users', auth.requiresLogin, auth.user.isSuperman, users.all);
    app.get('/api/users/:userId', auth.requiresLogin, auth.user.hasAuthorization, users.get);
    app.put('/api/users/:userId/permission', auth.requiresLogin, auth.user.isSuperman, users.changePermission);

    app.post('/api/users/pwdreset', users.pwdreset);
    app.put('/api/users/:userId', auth.requiresLogin, auth.user.hasAuthorization, users.update);
    app.del('/api/users/:userId', auth.requiresLogin, auth.user.hasAuthorization, users.closeAccount);
    app.get('/api/logout', auth.requiresLogin, users.signout);

    //Finish with setting up the userId param
    app.param('userId', users.user);

    var wishes = require('../app/controllers/wishes')(dbPool, notification);
    //app.get('/api/wishes', wishes.adminAll);
    app.get('/api/users/:userId/wishes', wishes.all);
    app.post('/api/users/:userId/wishes', wishes.create);
    app.get('/api/users/:userId/wishes/:wishId', wishes.read);
    app.put('/api/users/:userId/wishes/:wishId', wishes.update);
    app.del('/api/users/:userId/wishes/:wishId', wishes.delete);

    //app.param('wishId', wishes.wish);

    var bookmarks = require('../app/controllers/bookmarks')(dbPool, notification);
    //app.get('/api/bookmarks', bookmarks.adminAll);
    app.get('/api/users/:userId/bookmarks', bookmarks.all);
    app.post('/api/users/:userId/bookmarks', bookmarks.create);
    app.get('/api/users/:userId/bookmarks/:bookmarkId', bookmarks.read);
    app.del('/api/users/:userId/bookmarks/:bookmarkId', bookmarks.delete);

    //app.param('bookmarkId', bookmarks.bookmark);

    var books = require('../app/controllers/books')(dbPool);
    app.get('/api/books', books.all);
    app.get('/api/books/:bookId', books.get);

    //app.param('bookId', books.book);

    var posts = require('../app/controllers/posts')(dbPool, notification);
    app.get('/api/users/:userId/posts', posts.search);
    app.post('/api/users/:userId/posts', posts.create);
    app.get( '/api/users/:userId/posts/:postId', posts.get);
    app.post('/api/users/:userId/posts/:postId', posts.update);    ///--- This should be changed to PUT method
    //app.post('/api/users/:userId/updateposts', posts.update);    ///--- This should be changed to PUT method
    app.del('/api/users/:userId/posts/:postId', posts.delete);

    //app.param('postId', posts.post);


    //Condition Routes
    var messages = require('../app/controllers/messages')(dbPool, notification);
    //app.get('/api/messages', messages.adminAll);
    app.get('/api/users/:userId/messages', messages.all);
    app.get('/api/users/:userId/messages/:messageId', messages.get);
    app.post('/api/users/:userId/messages/:messageId', messages.send);

    //app.param('messageId', messages.get);

    //app.get('/api/notifications', notification.adminAll);
    app.get('/api/users/:userId/notifications', notification.all);
    app.get('/api/users/:userId/notifications/unread', notification.unread);

    var index = require('../routes/index');
    app.get('/', index.index);
    app.get('/book', index.book);
    app.get('/post', index.post);
    app.get('/bookmark', index.bookmark);
    app.get('/wish', index.wish);
    app.get('/message', index.message);
    app.get('/notification', index.notification);
};