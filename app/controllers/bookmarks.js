/**
 * Module dependencies.
 */
var _ = require('underscore');
Response = require('../util/response');

module.exports = function(dbPool, notifier) {
    return {
        /**
         *
         * @param req [ ~offset, ~len ]
         * @param res { total: '', result: result}
         */
        all : function(req, res) {
            var param = req.body;
            var userId = 1;//req.user.id;
            var totalCnt = 0;
            var sql = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.Error(res, err, 'Can not get db connection.');
                }
                connection.query( "SELECT COUNT(*) as cnt FROM user_bookmark WHERE user_id = ?", [userId], function(err, result) {
                    if (err) {
                        return Response.error(res, err, 'You can not get bookmarks. Sorry for inconvenient');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = 'SELECT ub.id id, tb.title title, tb.author author, tb.isbn13, tb.isbn10, tb.publisher, tb.type, tb.price, tb.description, tb.zip, tb.longitude, tb.latitude, c.title category, ow.username owner, ow.email ow_email, ow.first_name ow_first_name, ow.last_name ow_last_name' +
                        'FROM user_bookmark ub ' +
                        'LEFT JOIN textbook tb  ON ub.book_id = tb.id ' +
                        'LEFT JOIN user u       ON ub.user_id = u.id ' +
                        'LEFT JOIN category c   ON tb.category_id = c.id ' +
                        'LEFT JOIN user ow      ON tb.owner_id = ow.id ' +
                        'WHERE ub.user_id = "' + userId + '"';
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not get bookmarks. Sorry for inconvenient');
                        }
                        return Response.success(res, {total: totalCnt, result: result});
                    });
                });
            });
        },
        /**
         *
         * @param req [ book_id ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var userName = req.user.first_name + ' ' + req.user.last_name;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'INSERT INTO user_bookmark(user_id, book_id) values (?, ?,)',
                    [userId, param.book_id], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create new user.');
                        }
                        notifier.bookmarkAdded(param.book_id, userId, userName);
                        return Response.success(res, result);
                    });
            });
        },

        /**
         *
         * @param req [ bookmarkId ]
         * @param res
         */
        read : function(req, res) {
            var param = req.body;
            var wishId = req.params.bookmarkId;
            var userId = req.user.id;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT ub.id id, tb.title title, tb.author author, tb.isbn13, tb.isbn10, tb.publisher, tb.type, tb.price, tb.description, tb.zip, tb.longitude, tb.latitude, c.title category, ow.username owner, ow.email ow_email, ow.first_name ow_first_name, ow.last_name ow_last_name ' +
                    'FROM user_bookmark ub ' +
                    'LEFT JOIN textbook tb  ON ub.book_id = tb.id ' +
                    'LEFT JOIN user u       ON ub.user_id = u.id ' +
                    'LEFT JOIN category c   ON tb.category_id = c.id ' +
                    'LEFT JOIN user ow      ON tb.owner_id = ow.id ' +
                    'WHERE ub.user_id = ? AND ub.id = ?',
                    [userId, wishId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not find bookmark.');
                        }
                        if(result.length == 0) {
                            return Response.error(res, err, 'You do not have permission.');
                        }
                        return Response.success(res, result);
                    })
            });
        },

        /**
         *
         * @param req [ bookmarkId ]
         * @param res
         */
        delete : function(req, res) {
            var param = req.body;
            var bookmarkId = req.params.bookmarkId;
            var userId = req.user.id;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM user_bookmark WHERE user_id=? AND id=?',
                    [userId, bookmarkId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete current bookmark.');
                        }
                        return Response.success(res, result);
                    })
            });
        }
    };
}
