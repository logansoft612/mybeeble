/*jslint node: true */
var async = require('async');

module.exports = function (app, passport, auth, dbPool) {
    "use strict";

    var activities = require('../app/controllers/activities')(dbPool);
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

    app.post('/api/users/:userId/rate', auth.requiresLogin, auth.user.hasAuthorization, users.rate);
    app.put('/api/users/:userId/firstlogin', auth.requiresLogin, auth.user.hasAuthorization, users.firstlogin);
    app.put('/api/users/:userId/acceptterm', auth.requiresLogin, auth.user.hasAuthorization, users.acceptterm);
    app.get('/api/users/:userId/feedback', auth.requiresLogin, auth.user.hasAuthorization, users.feedback);

    app.post('/api/users/pwdreset', users.pwdreset);
    app.put('/api/users/:userId', auth.requiresLogin, auth.user.hasAuthorization, users.update);
    app.del('/api/users/:userId', auth.requiresLogin, auth.user.hasAuthorization, users.closeAccount);
    app.get('/api/logout', auth.requiresLogin, users.signout);

    //Finish with setting up the userId param
    app.param('userId', users.user);

    //---------------------------------------------------

    app.get('/api/users/:userId/activities', auth.requiresLogin, auth.user.hasAuthorization, activities.all);
    app.del('/api/users/:userId/activities', auth.requiresLogin, auth.user.hasAuthorization, users.deleteAll);
    app.del('/api/users/:userId/activities/:activityId', auth.requiresLogin, auth.user.hasAuthorization, users.delete);
    app.post('/api/users/:userId/activities', auth.requiresLogin, auth.user.hasAuthorization, users.newOrder);



    var wishes = require('../app/controllers/wishes')(dbPool, notification);
    //app.get('/api/wishes', wishes.adminAll);
    app.get('/api/users/:userId/wishes', auth.requiresLogin, auth.user.hasAuthorization, wishes.all);
    app.post('/api/users/:userId/wishes', auth.requiresLogin, auth.user.hasAuthorization, wishes.create);
    app.get('/api/users/:userId/wishes/:wishId', auth.requiresLogin, auth.user.hasAuthorization, wishes.read);
    app.put('/api/users/:userId/wishes/:wishId', auth.requiresLogin, auth.user.hasAuthorization, wishes.update);
    app.del('/api/users/:userId/wishes/:wishId', auth.requiresLogin, auth.user.hasAuthorization, wishes.delete);

    //app.param('wishId', wishes.wish);

    var bookmarks = require('../app/controllers/bookmarks')(dbPool, notification);
    //app.get('/api/bookmarks', bookmarks.adminAll);
    app.get('/api/users/:userId/bookmarks', auth.requiresLogin, auth.user.hasAuthorization, bookmarks.all);
    app.post('/api/users/:userId/bookmarks', auth.requiresLogin, auth.user.hasAuthorization, bookmarks.create);
    app.get('/api/users/:userId/bookmarks/:bookmarkId', auth.requiresLogin, auth.user.hasAuthorization, bookmarks.read);
    app.del('/api/users/:userId/bookmarks/:bookmarkId', auth.requiresLogin, auth.user.hasAuthorization, bookmarks.delete);

    //app.param('bookmarkId', bookmarks.bookmark);

    var categories = require('../app/controllers/categories')(dbPool);
    app.get('/api/users/:userId/categories', auth.requiresLogin, auth.user.isSuperman, categories.all);
    app.post('/api/users/:userId/categories', auth.requiresLogin, auth.user.isSuperman, categories.create);
    app.get('/api/users/:userId/categories/:categoryId', auth.requiresLogin, auth.user.isSuperman, categories.read);
    app.put('/api/users/:userId/categories/:categoryId', auth.requiresLogin, auth.user.isSuperman, categories.update);
    app.del('/api/users/:userId/categories/:categoryId', auth.requiresLogin, auth.user.isSuperman, categories.delete);

    //app.param('categoryId', categories.category);

    var books = require('../app/controllers/books')(dbPool);
    app.get('/api/books', books.search);
    app.get('/api/books/list', books.all);
    app.get('/api/books/:bookId', books.read);
    app.post('/api/books', books.create);
    app.put('/api/books/:bookId', books.update);
    app.del('/api/books/:bookId', books.delete);

    //app.param('bookId', books.book);

    var posts = require('../app/controllers/posts')(dbPool, notification, activities);
    app.get('/api/users/:userId/posts', auth.requiresLogin, auth.user.hasAuthorization, posts.search);
    app.post('/api/users/:userId/posts', auth.requiresLogin, auth.user.hasAuthorization, posts.create);
    app.get( '/api/users/:userId/posts/:postId', auth.requiresLogin, auth.user.hasAuthorization, posts.read);
    app.post('/api/users/:userId/posts/:postId', auth.requiresLogin, auth.user.hasAuthorization, posts.update);    ///--- This should be changed to PUT method
    //app.post('/api/users/:userId/updateposts', posts.update);    ///--- This should be changed to PUT method
    app.del('/api/users/:userId/posts/:postId', auth.requiresLogin, auth.user.hasAuthorization, posts.delete);

    //app.param('postId', posts.post);

    //Condition Routes
    var messages = require('../app/controllers/messages')(dbPool, notification);
    //app.get('/api/messages', messages.adminAll);
    app.get('/api/users/:userId/messages', auth.requiresLogin, auth.user.hasAuthorization, messages.all);
    app.post('/api/users/:userId/messages', auth.requiresLogin, auth.user.hasAuthorization, messages.create);
    app.get('/api/users/:userId/messages/:messageId', auth.requiresLogin, auth.user.hasAuthorization, messages.get);
    app.post('/api/users/:userId/messages/:messageId', auth.requiresLogin, auth.user.hasAuthorization, messages.send);

    //app.param('messageId', messages.get);

    //app.get('/api/notifications', notification.adminAll);
    app.get('/api/users/:userId/notifications', auth.requiresLogin, auth.user.hasAuthorization, notification.all);
    app.get('/api/users/:userId/notifications/unread', auth.requiresLogin, auth.user.hasAuthorization, notification.unread);
    app.put('/api/users/:userId/notifications/:notificationId', auth.requiresLogin, auth.user.hasAuthorization, notification.check);
    app.del('/api/users/:userId/notifications', auth.requiresLogin, auth.user.hasAuthorization, notification.deleteAll);
    app.del('/api/users/:userId/notifications/:notificationId', auth.requiresLogin, auth.user.hasAuthorization, notification.delete);

    var index = require('../routes/index');
    app.get('/', index.index);
    app.get('/book', index.book);
    app.get('/post', index.post);
    app.get('/bookmark', index.bookmark);
    app.get('/wish', index.wish);
    app.get('/message', index.message);
    app.get('/notification', index.notification);
};