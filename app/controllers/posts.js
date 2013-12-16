/**
 * Module dependencies.
 */
var _ = require('underscore');
var fs = require('fs');
var Response = require('../util/response');
var Util = require('../util/util');
var config = require('../../config/config');

module.exports = function(dbPool, notifier) {
    return {
        /**
         *
         * @param req [ keyword]
         * @param res
         *
         * keyword : auth, title, isbn, publisher
         */
        search : function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
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
         * @param req [ title, isbn, author, category(ID), publisher, zip, price, address, description, isold, contact ( string array or string) [email, text, call], cover ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var contactInfo = '';
            var coverPath = '';
            if(req.files) {
                console.log(req.files);
                var tmp_path = req.files.coverfile.path;
                var todayFolder = util.getTodayAsString();
                var folderName = config.root + '/public/' + todayFolder;
                var target_filename = Util.getTickTime() + req.files.coverfile.originalFilename;
                coverPath = todayFolder + '/' + target_filename;
                var target_path = folderName + '/' + target_filename;
                console.log(folderName);
                if(!fs.lstatSync(folderName).isDirectory()) {
                    fs.mkdirSync(folderName);
                }
                fs.rename(tmp_path, target_path, function(err) {
                    if(err) {
                        console.log(err);
                    }
                    fs.unlink(tmp_path, function(err){if (err) {console.log(err);}});
                })
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
                connection.query( 'INSERT INTO textbook(category_id, title, author, isbn13, publisher, type, price, description, zip, owner_id, old, contact, coverpath) ' +
                    'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, userId, param.isold, contactInfo, coverPath],
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
         * @param req [ title, isbn, author, category, publisher, zip, price, address, description, isOld, contact ( string array or string) [email, text, call], cover ]
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
