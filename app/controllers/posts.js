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
            var param = req.query;
            var userId = req.params.userId;
            var keyword = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                keyword = '%'+param.keyword+'%';
                connection.query( 'SELECT * FROM textbook WHERE del=0 AND ' +
                    ' ( isbn13 LIKE ? OR  author LIKE ? OR  title LIKE ? OR  publisher LIKE ?) AND owner_id = ?'
                    , [keyword, keyword, keyword , keyword, userId], function(err, result) {
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
                if (req.files.coverfile.originalFilename === "") {
                    fs.unlink(req.files.coverfile.path);
                } else {
                    var tmp_path = req.files.coverfile.path;
                    var todayFolder = Util.getTodayAsString();
                    var folderName = config.root + '/public/covers/' + todayFolder;
                    var target_filename = Util.getTickTime() + req.files.coverfile.originalFilename;
                    coverPath = "/covers/" + todayFolder + '/' + target_filename;
                    var target_path = folderName + '/' + target_filename;
                    try {
                        if(!fs.lstatSync(folderName).isDirectory()) {
                            fs.mkdirSync(folderName);
                        }
                    } catch (e) {
                        fs.mkdirSync(folderName);
                    }
                    fs.rename(tmp_path, target_path, function(err) {
                        if(err) {
                            console.log("---file move error.", err);
                        }
                    });
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
                connection.query( 'INSERT INTO textbook(category_id, title, author, isbn13, publisher, type, price, description, zip, owner_id, old, contact, coverpath) ' +
                    'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, userId, param.isold, contactInfo, coverPath],
                    function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not post the book. Sorry for inconvenience.');
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
        get : function(req, res) {
            var param = req.body;
            var postId = req.params.postId;
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM textbook WHERE id = ? AND owner_id = ?'
                    , [postId, userId], function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not find the posted books. Sorry for inconvenient');
                        }
                        if(result.length == 0) {
                            return Response.error(res, err, 'Can not find the textbook.');
                        }
                        return Response.success(res, result[0]);
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
        update : function(req, res) {
            var param = req.body;
            var postId = req.params.postId;
            var userId = req.user.id;
            var contactInfo = '';
            var coverPath = '';
            var sql = '';
            if(req.files) {
                if (req.files.coverfile.originalFilename === "") {
                    fs.unlink(req.files.coverfile.path);
                } else {
                    var tmp_path = req.files.coverfile.path;
                    var todayFolder = Util.getTodayAsString();
                    var folderName = config.root + '/public/covers/' + todayFolder;
                    var target_filename = Util.getTickTime() + req.files.coverfile.originalFilename;
                    coverPath = "/covers/" + todayFolder + '/' + target_filename;
                    var target_path = folderName + '/' + target_filename;
                    try {
                        if(!fs.lstatSync(folderName).isDirectory()) {
                            fs.mkdirSync(folderName);
                        }
                    } catch (e) {
                        fs.mkdirSync(folderName);
                    }
                    fs.rename(tmp_path, target_path, function(err) {
                        if(err) {
                            console.log("---file move error.", err);
                        }
                    });
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
                if(coverPath === "") {
                    sql = connection.format('UPDATE textbook SET category_id=?, title=?, author=?, isbn13=?, publisher=?, ' +
                        ' type=?, price=?, description=?, zip=?, old=?, contact=? ' +
                        ' WHERE owner_id = ? AND id = ? '
                        ,[param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, param.isOld, contactInfo, userId, postId]);
                } else {
                    sql = connection.format('UPDATE textbook SET category_id=?, title=?, author=?, isbn13=?, publisher=?, ' +
                        ' type=?, price=?, description=?, zip=?, old=?, contact=?, coverpath=? ' +
                        ' WHERE owner_id = ? AND id = ? '
                        ,[param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, param.isOld, contactInfo, coverPath, userId, postId]);
                }

                connection.query( sql,function(err, result) {
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
