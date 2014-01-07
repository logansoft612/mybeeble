/**
 * Module dependencies.
 */
var _           = require('underscore');
var Response    = require('../util/response');
var config      = require('../../config/config');
var fs          = require('fs');

module.exports = function(dbPool) {
    return {
        /**
         * Search registered textbooks by keyword. ( For user search book )
         *
         * @param req [ keyword]
         * @param res
         *
         * keyword : auth, title, isbn, publisher
         */
        search : function(req, res) {
            var param = req.query;
            var userId = req.params.userId;
            var keyword = param.keyword;

            if(!keyword || keyword === '') {
                keyword = '';
            }
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                keyword = '%'+keyword+'%';
                connection.query( 'SELECT * FROM textbook WHERE status=? AND ' +
                    ' ( isbn13 LIKE ? OR  author LIKE ? OR  title LIKE ? OR  publisher LIKE ?)'
                    , [config.app.textbook_status[2] /* allow */, keyword, keyword, keyword , keyword], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not find the textbooks. Sorry for inconvenient');
                        }
                        return Response.success(res, result);
                    });
            });
        },
        /**
         * Get registered textbooks list. ( Admin users use this service to accept or decline newly suggested textbooks. )
         *
         * @param req { ~offset: {number}, ~len: {number},  ~keyword: {string}, mode: : {number}(all, new , allow, deny) }
         * @param res
         *
         */
        all : function(req, res) {
            var param = req.query;
            var userId = req.params.userId;

            var keyword = req.query.keyword;
            var mode = req.query.mode;

            var sql = '';
            var totalCnt = 0;

            if(config.app.textbook_status.indexOf(mode) < 0 || mode == config.app.textbook_status[0]) {
                mode = '%';  // all
            }
            if (!keyword) {
                keyword = '%';
            } else {
                keyword = '%'+keyword+'%';
            }

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT COUNT(*) as cnt FROM textbook WHERE status LIKE ? AND ' +
                    ' ( isbn13 LIKE ? OR  author LIKE ? OR  title LIKE ? OR  publisher LIKE ?)'
                    , [mode, keyword, keyword, keyword , keyword], function(err, result) {
                        if (err) {
                            return Response.error(res, err, 'You can not get textbooks. Sorry for inconvenient');
                        }
                        if(result.length > 0) {
                            totalCnt = result[0]['cnt'];
                        }
                        sql = connection.format('SELECT * FROM textbook WHERE status LIKE ? AND ' +
                            ' ( isbn13 LIKE ? OR  author LIKE ? OR  title LIKE ? OR  publisher LIKE ?)'
                            , [mode, keyword, keyword, keyword , keyword]);
                        if (param.len && param.len > 0) {
                            sql += ' LIMIT ' + param.len;
                            if (param.offset && param.offset > 0) {
                                sql += ' OFFSET ' + param.offset;
                            }
                        }
                        connection.query( sql, function(err, result) {
                            connection.release();
                            if (err) {
                                return Response.error(res, err, 'You can not get textbooks. Sorry for inconvenient');
                            }
                            return Response.success(res, {total: totalCnt, result: result});
                        });
                    });
            });
        },
        /**
         * Get textbook detail
         *
         * @param req
         * @param res
         * @url_param - bookId
         */
        read : function(req, res) {
            var param = req.query;
            var bookId = req.params.bookId;
            var keyword = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM textbook WHERE id = ? '
                    , [ bookId ], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not get this textbook. Sorry for inconvenient');
                        }
                        return Response.success(res, result);
                    });
            });
        },
        /**
         * Suggest new textbook
         *
         * @param req [ keyword]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var contactInfo = '';
            var coverPath = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Error(res, err, 'Can not get db connection.');
                }
                if(Object.prototype.toString.call(param.contact) === '[object Array]') {
                    contactInfo = imploid(",", param.contact);
                } else {
                    contactInfo = param.contact;
                }
                connection.query( 'INSERT INTO textbook(textbook.category_id, textbook.title, textbook.author, textbook.isbn13, textbook.publisher, textbook.type, textbook.price, textbook.description, textbook.user_id, textbook.status) ' +
                    'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [param.category, param.title, param.author, param.isbn, param.publisher, param.type, param.price, param.description, userId, config.app.textbook_status[1] /* new */ ],
                    function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create the new textbook. Sorry for inconvenience.');
                        }

                        if(req.files) {
                            if (req.files.coverfile.originalFilename === "") {
                                fs.unlink(req.files.coverfile.path);
                            } else {
                                var tmp_path = req.files.coverfile.path;
                                var target_path = config.path.book_img + result.insertId + '.jpg';
                                fs.rename(tmp_path, target_path, function(err) {
                                    if(err) {
                                        console.log("---file move error. file ID : " + result.insertId + " error : ", err);
                                    }
                                });
                            }
                        }
                        return Response.success(res, result);
                    });
            });
        },
        /**
         * Update textbook status ( Administrator update the newly registered textbook )
         *
         * @param req { mode: : {number}(all, new , allow, deny) }
         * @param res
         * @url_param - bookId
         */
        update : function(req, res) {
            var param = req.body;
            var bookId = req.params.bookId;

            var mode = param.mode;

            if(config.app.textbook_status.indexOf(mode) < 1) {
                return Response.error(res, null, 'You should give right permission mode. [new, allow, deny]');
            }
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE textbook SET status=? WHERE id = ? '
                    , [ mode, bookId ], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not modify this textbook. Sorry for inconvenient');
                        }
                        return Response.success(res, result);
                    });
            });
        },
        /**
         * delete textbook
         *
         * @param req
         * @param res
         * @url_param - bookId
         *
         */
        delete : function(req, res) {
            var bookId = req.params.bookId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'DELETE FROM textbook WHERE id = ?', [bookId], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'You can not delete this textbook for now. Sorry for inconvenient');
                    }
                    return Response.success(res, result);
                });
            });
        }
    };
}
