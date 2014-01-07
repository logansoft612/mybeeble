/**
 * Module dependencies.
 */
var _ = require('underscore');
Response = require('../util/response');
var POSTED_A_NEW_BOOK = 0,
    BOUGHT_A_NEW_BOOK = 1;

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
                connection.query( "SELECT COUNT(*) as cnt FROM user_activity WHERE user_id = ?", [userId], function(err, result) {
                    if (err) {
                        return Response.error(res, err, 'Can not get db connection.');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = connection.format('SELECT * FROM user_activity WHERE user_id = ?', [userId]);
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You did not get activities. Sorry for inconvenient');
                        }
                        return Response.success(res, {total: totalCnt, result: result});
                    });
                });
            });
        },
        delete: function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            var activityId = req.params.activityId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM user_activity WHERE user_id =? AND id=?',
                    [ userId , activityId], function(err, result2) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete this activity. Sorry for inconvenience.');
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
                connection.query( 'DELETE FROM user_activity WHERE user_id =?',
                    [ userId ], function(err, result2) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete activities. Sorry for inconvenience.');
                        }
                        return Response.success(res, result2);
                    });
            });
        },
        newPost : function(userId, bookId, title) {
            // User have posted new book
            // Register this activity in table.
            var sql = "";

            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - activity create error. ( new post ) - ", err);
                    return;
                }
                sql = 'INSERT INTO user_activity(user_id, activity, link, title) VALUES (?, ?, ?, ?)';
                connection.query( sql, [userId, POSTED_A_NEW_BOOK, bookId, title], function(err, results){
                    connection.release();
                    if (err) {
                        console.log(" - activity create error. ( new post ) - ", err);
                        return;
                    }
                    if(results.length == 0) {
                        return;
                    }
                });
            });
        },
        /**
         * @METHOD POST
         * create new activity for new Order
         *
         * @param req {bookId: {number}, title: {string}, transactionId: {string}}
         * @param res
         */
        newOrder : function(req, res) {
            //userId, bookId, title, transactionId
            // New order is made
            // Register this activity in table
            var param = req.body;
            var userId = req.params.userId;


            dbPool.getConnection(function(err, connection){
                if(err) {
                    console.log(" - activity create error. ( new purchase ) - ", err);
                    return;
                }
                sql = 'INSERT INTO user_activity(user_id, activity, link, title, info) VALUES (?, ?, ?, ?, ?)';
                connection.query( sql, [userId, BOUGHT_A_NEW_BOOK, param.bookId, param.title, param.transactionId], function(err, results){
                    connection.release();
                    if (err) {
                        console.log(" - activity create error. ( new purchase ) - ", err);
                        return;
                    }
                    if(results.length == 0) {
                        return;
                    }
                });
            });
        }
    };
}
