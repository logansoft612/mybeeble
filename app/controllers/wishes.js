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
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( "SELECT COUNT(*) as cnt FROM user_wish WHERE user_id = ?", [userId], function(err, result) {
                    if (err) {
                        return Response.error(res, err, 'You can not get wish list. Sorry for inconvenient');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = 'SELECT * FROM user_wish WHERE user_id = "' + userId + '"';
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not get wish list. Sorry for inconvenient');
                        }
                        return Response.success(res, {total: totalCnt, result: result});
                    });
                });
            });
        },

        /**
         *
         * @param req [ title, isbn, price_min, price_max ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            var userName = req.user.first_name + ' ' + req.user.last_name;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'INSERT INTO user_wish(user_id, title, isbn, price_min, price_max) values (?, ?, ?, ?, ?)',
                    [userId, param.title, param.isbn, param.price_min, param.price_max], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create new user.');
                        }
                        notifier.wishlistAdded(param.title, param.isbn, param.price_min, param.price_max, userId, userName);
                        return Response.success(res, result);
                    })
            });
        },

        /**
         *
         * @param req [ wishId ]
         * @param res
         */
        read : function(req, res) {
            var param = req.body;
            var wishId = req.params.wishId;
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM user_wish WHERE user_id = ? AND id = ?',
                    [userId, wishId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not find wish.');
                        }
                        if(result.length == 0) {
                            return Response.error(res, result, 'Can not find the wish.');
                        }
                        return Response.success(res, result);
                    })
            });
        },

        update : function(req, res) {
            var param = req.body;
            var wishId = req.params.wishId;
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE user_wish SET title=?, isbn=?, price_min=?, price_max=?' +
                    ' WHERE user_id=? AND id=?', [param.title, param.isbn, param.price_min, param.price_max, userId, wishId], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Did not update a wish info.');
                    }
                    if(result.affectedRows == 0) {
                        return Response.error(res, result, 'Can not find the wish.');
                    }
                    return Response.success(res, result);
                })
            })
        },

        delete : function(req, res) {
            var param = req.body;
            var wishId = req.params.wishId;
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM user_wish WHERE user_id=? AND id=?',
                    [userId, wishId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete current wish.');
                        }
                        return Response.success(res, result);
                    })
            });
        }
    };
}
