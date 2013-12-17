/**
 * Module dependencies.
 */
var _ = require('underscore');
Response = require('../util/response');
var BOOKMARKED_YOUR_POST = 0,
    ADDED_TO_WISHLIST_YOUR_POST = 1,
    MESSAGE_RECEIVED = 2,
    YOUR_WISH_IS_POSTED = 3,
    YOUR_BOOKMARK_IS_REMOVED = 4;


var IncreaseUnreadNotification = function ( users , connection , cb) {
    //Increase Unread Notification
    var param;
    if ( Object.prototype.toString.call(users) === '[object Array]' ) {
        if(users.length == 0) {
            cb( false );
            return;
        }
        var sql = "UPDATE user SET notification_cnt = notification_cnt + 1 WHERE id IN ("+users.join(',')+")"
        connection.query(sql, function(err, result) {
            if (err) {
                cb( false );
            }
            cb( true );
        });
    } else if ( typeof users == "string" || typeof users == "number" ) {
        connection.query("UPDATE user SET notification_cnt = notification_cnt + 1 WHERE id = ?", [users], function(err, result) {
            if (err) {
                cb( false );
            }
            cb( true );
        });
    } else {
        cb( false );
        return;
    }
};
var ClearUnreadNotification = function ( users , connection , cb) {
    var param;
    if ( Object.prototype.toString.call(users) === '[object Array]' ) {
        if(users.length == 0) {
            cb( false );
            return;
        }
        var sql = "UPDATE user SET notification_cnt = 0 WHERE id IN ("+users.join(',')+")"
        connection.query(sql, function(err, result) {
            if (err) {
                cb( false );
            }
            cb( true );
        });
    } else if ( typeof users == "string" || typeof users == "number" ) {
        connection.query("UPDATE user SET notification_cnt = 0 WHERE id = ?", [users], function(err, result) {
            if (err) {
                cb( false );
            }
            cb( true );
        });
    } else {
        cb( false );
        return;
    }
}
module.exports = function(dbPool) {
    return {
        /**
         *
         * @param req [ ~offset, ~len]
         * @param res { total: -number-, result: [-notification Rows-]}
         *
         */
        all : function(req, res) {
            var param = req.query;
            var userId = req.params.userId;
            var totalCnt = 0;
            var sql = '';


            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( "SELECT COUNT(*) as cnt FROM notification WHERE user_id = ?", [userId], function(err, result) {
                    if (err) {
                        connection.release();
                        return Response.error(res, err, 'You did not get notifications. Sorry for inconvenient');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = 'SELECT * FROM notification WHERE user_id=' + userId;
                    sql += ' ORDER BY ut DESC';
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    console.log(sql);
                    connection.query( sql, function(err, result2) {
                        if (err) {
                            return Response.error(res, err, 'You did not get notifications. Sorry for inconvenient');
                        }
                        ClearUnreadNotification( userId, connection, function(success) {
                            connection.release();
                        });
                        return Response.success(res, {total: totalCnt, result: result2});
                    });
                });
            });
        },
        /**
         * method GET
         * @param req
         * @param res
         *
         */
        unread : function(req, res) {
            var param = req.body;
            var userId = req.params.userId;

            var notifications;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query('SELECT * FROM notification n WHERE n.user_id = ? AND n.read = 0 ORDER BY ut DESC',
                    [userId], function(err, result) {
                        if (err) {
                            connection.release();
                            return Response.error(res, err, 'Did not get notifications. Sorry for inconvenience.');
                        }
                        notifications = result;
                        connection.query( 'UPDATE notification n SET n.read = 1 WHERE n.user_id =?',
                            [ userId ], function(err, result2) {
                                if (err) {
                                    return Response.error(res, err, 'Did not find this message. Sorry for inconvenience.');
                                }
                                ClearUnreadNotification( userId, connection, function(success) {
                                    connection.release();
                                });
                                return Response.success(res, notifications);
                            });
                });
            });
        },
        check: function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            var notificationId = req.params.notificationId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE notification n SET n.read = 1 WHERE n.user_id =? AND n.id=?',
                    [ userId , notificationId], function(err, result2) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not checked this notification. Sorry for inconvenience.');
                        }
                        return Response.success(res, result2);
                    });
            });
        },
        delete: function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            var notificationId = req.params.notificationId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM notification WHERE user_id =? AND id=?',
                    [ userId , notificationId], function(err, result2) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete this notification. Sorry for inconvenience.');
                        }
                        return Response.success(res, result2);
                    });
            });
        },
        deleteAll: function(req, res) {
            var param = req.body;
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM notification WHERE user_id =?',
                    [ userId ], function(err, result2) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete notifications. Sorry for inconvenience.');
                        }
                        return Response.success(res, result2);
                    });
            });
        },
        bookPosted : function(bookId, bookTitle, isbn, price) {
            // Check user's wish list.
            // If this book is in one user's wish list, create new notification.

            var description = "";
            var idx;
            var notifyValues = [];
            var linkTo = "/api/books/" + bookId;
            var userList = [];
            var sql = "";

            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - notification report error. ( book posted ) - ", err);
                    return;
                }
                sql = 'SELECT user_id FROM user_wish WHERE (title = '+connection.escape(bookTitle)+
                    ' OR isbn = '+connection.escape(isbn)+') AND ( price_min <= '+price+' AND price_max >= '+price+' )';
                connection.query( sql, function(err, results){
                        if (err) {
                            connection.release();
                            console.log(" - notification report error. (book posted) - ", err);
                            return;
                        }
                        if(results.length == 0) {
                            connection.release();
                            return;
                        }

                        for( idx = 0; idx < results.length; idx++ ) {
                            notifyValues.push([
                                results[idx].user_id,
                                YOUR_WISH_IS_POSTED,
                                //"Your wishlist book #{{book_id|book_title}} is posted on MyBeeble for $#{{book_id|book_price}}.",
                                "Your wishlist book <b>" + bookTitle + "</b> is posted on MyBeeble for $" + price + ".",
                                linkTo
                            ]);
                            userList.push(results[idx].user_id);
                        }
                        connection.query( 'INSERT INTO notification(user_id, type, description, link) VALUES ?', [notifyValues], function (err, results) {
                            if (err) {
                                connection.release();
                                console.log(" - notification report error. (book posted) - ", err);
                                return;
                            }
                            IncreaseUnreadNotification(userList, connection, function(){
                                connection.release();
                            });
                        });
                    });
            });
        },

        bookRemoved : function(bookId) {
            // Check user's bookmark.
            // If this book is in one user's bookmark, create new notification.
            //description = 'Textbook of #{{book_id|book_title}} is no longer available. Would you like to add to wishlist?';

            var description = "";
            var idx;
            var notifyValues = [];
            var linkTo = "/api/books/" + bookId;
            var userList = [];

            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - notification report error. ( book removed ) - ", err);
                    return;
                }
                connection.query('SELECT ub.user_id, tb.title FROM user_bookmark ub LEFT JOIN textbook tb ON tb.id = ub.book_id WHERE ub.book_id = ?',
                    [bookId], function(err, results){
                        if (err) {
                            connection.release();
                            console.log(" - notification report error. ( book removed ) - ", err);
                            return;
                        }

                        if(results.length == 0) {
                            connection.release();
                            return;
                        }

                        for( idx = 0; idx < results.length; idx++ ) {
                            notifyValues.push([
                                results[idx].user_id,
                                YOUR_BOOKMARK_IS_REMOVED,
                                //"Textbook of #{{book_id|book_title}} is no longer available. Would you like to add to wishlist?",
                                "Textbook of " + results[idx].title + " is no longer available. Would you like to add to wishlist?",
                                linkTo
                            ]);
                            userList.push(results[idx].user_id);
                        }

                        connection.query( 'INSERT INTO notification(user_id, type, description, link) VALUES ?', [notifyValues], function (err, results) {
                            if (err) {
                                connection.release();
                                console.log(" - notification report error. ( book removed ) - ", err);
                                return;
                            }
                            IncreaseUnreadNotification(userList, connection, function(success){
                                connection.release();
                                if(!success) console.log("Did not increase notification count.");
                            });
                        });
                    });
            });
        },

        messageSent : function(senderId, receiverId, messageTruncate, messageId, messageListId) {
            // create a new notification for message receiver.
            //description = '#{{user_id|user_name}} pinged: "#{{message_id|message_truncate}}" regarding #{{message_id|message_title}}';

            var description = "";
            var linkTo = "/api/messages/" + messageId + "#" + messageListId;

            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - notification report error. ( message sent ) - ", err);
                    return;
                }
                // Get "message title" and "Sender Name" by using      messageListID, senderID, messageID
                connection.query('SELECT m.title, concat(u.first_name, " ", u.last_name) as name FROM message m ' +
                    'LEFT JOIN message_list ml ON m.id = ml.message_id ' +
                    'LEFT JOIN user u ON  ml.sender = u.id ' +
                    'WHERE ml.id = ? AND u.id = ? AND m.id=? ', [messageListId, senderId, messageId], function(err, result) {

                    if (err) {
                        connection.release();
                        console.log(" - notification report error. ( message sent ) - ", err);
                        return;
                    }
                    if (result.length == 0) {
                        connection.release();
                        console.log(" - notification report error. ( message sent ) - " + senderId + ", " + receiverId + ", " + messageTruncate + ", " + messageId + ", " + messageListId);
                        return;
                    }
                    description = '<b>' + result[0].name + '</b> pinged: <b>"' + messageTruncate + '"</b> regarding <b>' + result[0].title + '</b>.';
                    connection.query( 'INSERT INTO notification(user_id, type, description, link) VALUES (?, ?, ?, ?)',
                        [receiverId, MESSAGE_RECEIVED, description, linkTo], function (err, results) {
                        if (err) {
                            connection.release();
                            console.log(" - notification report error. ( message sent ) - ", err);
                            return;
                        }
                        IncreaseUnreadNotification(receiverId, connection, function(success){
                            connection.release();
                            if(!success) console.log("Did not increase notification count.");
                        });
                    });
                });
            });
        },

        bookmarkAdded : function(bookId, adderId, adderName) {
            // create a new notification to book owner.
            //description = '#{{user_id|user_name}} bookmarked your post #{{post_id|post_title}}.';

            var description = "";
            var linkTo = "/api/books/" + bookId;

            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - notification report error. ( bookmark added ) - ", err);
                    return;
                }
                connection.query('SELECT title, owner_id FROM textbook WHERE id = ?'
                    , [bookId], function(err, result) {

                    if (err) {
                        connection.release();
                        console.log(" - notification report error. ( bookmark added ) - ", err);
                        return;
                    }
                    if (result.length == 0) {
                        connection.release();
                        console.log(" - notification report error. ( bookmark added ) - " + bookId + ", " + adderId + ", " + adderName);
                        return;
                    }
                    description = '<b>' + adderName + '</b> bookmarked your post <b>' + result[0].title  + '</b>';
                    connection.query( 'INSERT INTO notification(user_id, type, description, link) VALUES (?, ?, ?, ?)',
                        [result[0].owner_id, BOOKMARKED_YOUR_POST, description, linkTo], function (err, results) {
                            if (err) {
                                connection.release();
                                console.log(" - notification report error. ( bookmark added ) - ", err);
                                return;
                            }
                            IncreaseUnreadNotification(result[0].owner_id, connection, function(success){
                                connection.release();
                                if(!success) console.log("Did not increase notification count.");
                            });
                        });
                });
            });
        },

        wishlistAdded : function(bookTitle, bookIsbn, priceMin, priceMax, adderId, adderName) {
            // create a new notification to book owner.
            //description = '#{{user_id|user_name}} added your post #{{post_id|post_title}} to user wishlist.';

            var description = "";
            var notifyValues = [];
            var userList = []
            var idx;
            var sql = '';

            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - notification report error. ( wishlist added ) - ", err);
                    return;
                }
                sql = 'SELECT * FROM textbook WHERE (title = '+connection.escape(bookTitle)+
                    ' OR isbn13 = '+connection.escape(bookIsbn)+') AND ( price <= '+priceMax+' AND price >= '+priceMin+' )';
                console.log(sql);
                connection.query(sql, function(err, results) {
                        if (err) {
                            connection.release();
                            console.log(" - notification report error. ( wishlist added ) - ", err);
                            return;
                        }
                        console.log("-- wish list is added (notification) -- ", results);
                        if (results.length == 0) {
                            connection.release();
                            return;
                        }
                        for( idx = 0; idx < results.length; idx++ ) {
                            notifyValues.push([
                                results[idx].owner_id,
                                ADDED_TO_WISHLIST_YOUR_POST,
                                //'#{{user_id|user_name}} added your post #{{post_id|post_title}} to user wishlist.';
                                '<b>' + adderName + '</b> added your post <b>' + results[idx].title  + '</b> to user wishlist.',
                                "/api/books/" + results[idx].id
                            ]);
                            userList.push(results[idx].owner_id);
                        }
                        connection.query( 'INSERT INTO notification(user_id, type, description, link) VALUES ?',
                            [notifyValues], function (err, results) {
                                if (err) {
                                    connection.release();
                                    console.log(" - notification report error. ( wishlist added ) - ", err);
                                    return;
                                }
                                IncreaseUnreadNotification(userList, connection, function(success){
                                    connection.release();
                                    if(!success) console.log("Did not increase notification count.");
                                });
                            });
                    });
            });
        }
    };
}
