/**
 * Module dependencies.
 */
var _ = require('underscore');
Response = require('../util/response');

module.exports = function(dbPool, notifier) {
    return {
        /**
         *
         * @param req [ keyword, ~zip, ~distance, ~price_min, ~price_max, ~cover, ~category]
         * @param res
         *
         * keyword : auth, title, isbn, publisher
         */
        search : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var userZip = req.user.zip;
            var totalCnt = 0;
            var idx = 0;
            var sql = '';
            var escapedString = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                escapedString = connection.escapeId(param.keyword);
                sql = 'SELECT * FROM textbook ' +
                    'WHERE del=0 AND ' +
                    '( isbn13 LIKE "%' + escapedString + '%" OR ' +
                    'author LIKE "%' + escapedString + '%" OR ' +
                    'title LIKE "%' + escapedString + '%" OR ' +
                    'publisher LIKE "%' + escapedString + '%") AND owner_id = ' + userId;

                connection.query( sql, function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'You can not find the posted books. Sorry for inconvenient');
                    }
                    return Response.success(res, result);
                });
            });
        },

        /**
         *
         * @param req [ title, isbn, author, category, publisher, zip, price, address, city, state, description, isOld, contact ( string array or string) [email, text, call], cover ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var contactInfo = '';

            if(req.files) {
                console.log(req.files);
                for(var file in req.files) {
                    console.log(file);
                }
            }

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Error(res, err, 'Can not get db connection.');
                }
                if(Object.prototype.toString.call(param.contact) === '[object Array]') {
                    contactInfo = imploid(",", param.contact);
                } else {
                    contactInfo = param.contact;
                }
                connection.query( 'INSERT INTO textbook(category_id, title, author, isbn13, publisher, type, price, description, zip, owner_id, old, contact) ' +
                    'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, userId, param.isOld, contactInfo],
                    function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create new user. Sorry for inconvenience.');
                        }
                        notifier.bookPosted(result.insertId, param.title, param.isbn, param.price);
                        return Response.success(res, result);
                    });
            });
        },
        /**
         *
         * @param req
         * @param res
         * @url_param - postId(bookId)
         */
        delete : function(req, res) {
            var param = req.body;
            var postId = req.params.postId;
            var userId = req.user.id;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE textbook SET del=1 WHERE id=? AND owner_id=?', [postId, userId], function(err, result) {
                    connection.release();
                    if (err || result.affectedRows == 0) {
                        return Response.error(res, err, 'Did not delete current post. Sorry for inconvenience.');
                    }

                    notifier.bookRemoved(postId);
                    return Response.success(res, result);
                });
            });
        },

        /**
         *
         * @param req [ title, isbn, author, category, publisher, zip, price, address, city, state, description, isOld, contact ( string array or string) [email, text, call], cover ]
         * @param res
         * @url_param - postId
         */
        update : function(req, res, next, id) {
            var param = req.body;
            var postId = req.params.postId;
            var userId = req.user.id;
            var contactInfo = '';
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Error(res, err, 'Can not get db connection.');
                }
                if(Object.prototype.toString.call(param.contact) === '[object Array]') {
                    contactInfo = imploid(",", param.contact);
                } else {
                    contactInfo = param.contact;
                }
                connection.query( 'UPDATE textbook SET category_id=?, title=?, author=?, isbn13=?, publisher=?, type=?, price=?, description=?, zip=?, old=?, contact=? ' +
                    'WHERE owner_id = ? AND id = ? ',
                    [param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, param.isOld, contactInfo, userId, postId],
                    function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not update current post. Sorry for inconvenience.');
                        }
                        return Response.success(res, result);
                    });
            });
        }
    };
}
