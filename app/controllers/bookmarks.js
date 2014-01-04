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
            var param = req.query;
            var userId = req.params.userId;
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
                    sql = 'SELECT ub.id id, p.title title, p.author author, p.isbn13, p.isbn10, p.publisher, p.type, p.price, p.description, p.zip, p.longitude, p.latitude, c.title category, ow.username owner, ow.email ow_email, ow.first_name ow_first_name, ow.last_name ow_last_name ' +
                        ' FROM user_bookmark ub ' +
                        ' LEFT JOIN post p      ON ub.book_id = p.id ' +
                        ' LEFT JOIN user u       ON ub.user_id = u.id ' +
                        ' LEFT JOIN category c   ON p.category_id = c.id ' +
                        ' LEFT JOIN user ow      ON p.user_id = ow.id ' +
                        ' WHERE ub.user_id = "' + userId + '"';
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
            var userId = req.params.userId;               // Should Create notification.
            var userName = req.profile.first_name + ' ' + req.profile.last_name;
            var ownerId = 0;
            var categoryId = 0;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM post WHERE id = ?',
                    [param.book_id], function(err, result) {
                        if (err) {
                            connection.release();
                            return Response.error(res, err, 'Can not bookmark current book. Sorry for inconvenient.');
                        }
                        if (result.length === 0) {
                            connection.release();
                            return Response.error(res, err, 'Did not find a book to bookmark.');
                        }
                        ownerId = result[0].user_id;
                        categoryId = result[0].category_id;
                        connection.query( 'INSERT INTO user_bookmark(user_id, book_id, user_id, category_id) values (?, ?, ?, ?)',
                            [userId, param.book_id, ownerId,categoryId], function(err, result2) {
                                connection.release();
                                if (err) {
                                    return Response.error(res, err, 'Can not bookmark current book. Sorry for inconvenient.');
                                }
                                notifier.bookmarkAdded(param.book_id, userId, userName);
                                return Response.success(res, result2);
                            });
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
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT ub.id id, p.title title, p.author author, p.isbn13, p.isbn10, p.publisher, p.type, p.price, p.description, p.zip, p.longitude, p.latitude, c.title category, ow.username owner, ow.email ow_email, ow.first_name ow_first_name, ow.last_name ow_last_name ' +
                    'FROM user_bookmark ub ' +
                    'LEFT JOIN post p       ON ub.book_id = p.id ' +
                    'LEFT JOIN user u       ON ub.user_id = u.id ' +
                    'LEFT JOIN category c   ON p.category_id = c.id ' +
                    'LEFT JOIN user ow      ON p.user_id = ow.id ' +
                    'WHERE ub.user_id = ? AND ub.id = ?',
                    [userId, wishId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not find bookmark.');
                        }
                        if(result.length == 0) {
                            return Response.error(res, err, 'Can not find this bookmark.');
                        }
                        return Response.success(res, result[0]);
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
            var userId = req.params.userId;

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
