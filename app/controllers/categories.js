/**
 * Module dependencies.
 */
var _ = require('underscore');
Response = require('../util/response');

module.exports = function(dbPool) {
    return {
        /**
         *
         * @param req [ ~offset, ~len ]
         * @param res { total: '', result: result}
         */
        all : function(req, res) {
            var param = req.query;
            var userId = req.user.id;
            var totalCnt = 0;
            var sql = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( "SELECT COUNT(*) as cnt FROM category", [userId], function(err, result) {
                    if (err) {
                        return Response.error(res, err, 'You can not get category list. Sorry for inconvenient');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = 'SELECT * FROM category ';
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not get category list. Sorry for inconvenient');
                        }
                        return Response.success(res, {total: totalCnt, result: result});
                    });
                });
            });
        },

        /**
         *
         * @param req [ title, slug ]
         * @param res {}
         */
        create : function(req, res) {
            var param = req.body;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'INSERT INTO category( title, slug) values (?, ?)',
                    [ param.title, param.slug], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create new category.');
                        }
                        return Response.success(res, result);
                    });
            });
        },

        /**
         *
         * @param req
         * @param res
         * @url_param - categoryId
         */
        read : function(req, res) {
            var categoryId = req.params.categoryId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM category WHERE id = ? ',
                    [categoryId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Can not find category.');
                        }
                        if(result.length == 0) {
                            return Response.error(res, result, 'Did not find category.');
                        }
                        return Response.success(res, result);
                    });
            });
        },
        /**
         *
         * @param req [ title, slug ]
         * @param res {}
         * @url_param - categoryId
         */
        update : function(req, res) {
            var param = req.body;
            var categoryId = req.params.categoryId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE category SET title=?, slug=? WHERE id=?',
                    [param.title, param.slug, categoryId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Can not update this category info.');
                        }
                        if(result.affectedRows == 0) {
                            return Response.error(res, result, 'Did not update this category info.');
                        }
                        return Response.success(res, result);
                    });
            });
        },
        /**
         * @param req
         * @param res {}
         * @url_param - categoryId
         */
        delete : function(req, res) {
            var categoryId = req.params.categoryId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM category WHERE id=?',
                    [categoryId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete this category.');
                        }
                        return Response.success(res, result);
                    })
            });
        }
    };
}
