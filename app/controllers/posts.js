/**
 * Module dependencies.
 */
var _           = require('underscore');
var fs          = require('fs');
var Response    = require('../util/response');
var Util        = require('../util/util');
var config      = require('../../config/config');

module.exports = function(dbPool, notifier, activity) {
    return {
        /**
         *
         * @METHOD GET
         *
         * @param req [ keyword, category, cover, price_min, price_max, ~zip, ~distance]
         * @param res
         *
         * keyword : auth, title, isbn, publisher
         */
        search : function(req, res) {
            var param = req.query;
            var totalCnt = 0;
            var idx = 0;
            var sql = '';
            var escapedString = '';
            var sqlZipCodeInRadius = 'SELECT z.*, o.*, (6371 * 2 * ASIN(SQRT( ' +
                'POWER(SIN((o.org_lat - abs(z.latitude)) * pi()/180 / 2), ' +
                '2) + COS(o.org_lat * pi()/180 ) * COS(abs(z.latitude) * ' +
                'pi()/180) * POWER(SIN((o.org_long - z.longitude) * ' +
                'pi()/180 / 2), 2) ))) as distance ' +
                'FROM zcta z ' +
                'LEFT JOIN (SELECT latitude org_lat, longitude org_long, zip org_zip ' +
                'FROM zcta where zip = ?) o ON 1=1 ' +
                'having distance <= ?';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                escapedString = '%' + param.keyword + '%';
                sql = connection.format('SELECT * FROM post ' +
                    'WHERE del=0 AND ( isbn13 LIKE ? OR author LIKE ? OR title LIKE ? OR publisher LIKE ?)'
                    ,[escapedString, escapedString, escapedString, escapedString]);
                if (param.category) {
                    sql += ' AND category_id=' + param.category;
                }

                if (param.cover) {
                    if(Object.prototype.toString.call(param.cover) === '[object Array]' && param.cover.length > 0) {
                        escapedString = connection.escape(param.cover[0]);
                        for(idx = 1; idx < param.cover.length; idx++) {
                            escapedString += ", " + connection.escape(param.cover[idx]);
                        }
                        sql += ' AND type IN (' + escapedString +')';
                    } else {
                        sql += ' AND type = ' + connection.escape(param.cover);
                    }
                }
                if (param.price_min) {
                    sql += ' AND price>=' + param.price_min;
                }
                if (param.price_max) {
                    sql += ' AND price<=' + param.price_max;
                }
                if (param.zip && param.distance) {
                    connection.query( sqlZipCodeInRadius, [param.zip, param.distance], function(err, result) {
                        if (err) {
                            connection.release();
                            return Response.error(res, err, 'You can not find posts for now. Sorry for inconvenient');
                        }
                        if (result.length == 0) {
                            return Response.success(res, []);
                        }
                        escapedString = connection.escape(result[0].zip);
                        for(idx = 1; idx < result.length; idx++) {
                            escapedString += ", " + connection.escape(result[idx].zip);
                        }
                        sql += ' AND zip IN (' + escapedString +')';
                        console.log(sql);
                        connection.query( sql, function(err, result) {
                            connection.release();
                            if (err) {
                                return Response.error(res, err, 'You can not find posts for now. Sorry for inconvenient');
                            }
                            return Response.success(res, result);
                        });
                    });
                } else {
                    console.log(sql);
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not find posts for now. Sorry for inconvenient');
                        }
                        return Response.success(res, result);
                    });
                }
            });
        },
        /**
         * return zipcode list in range
         *
         * @METHOD GET
         *
         * @param req [zip, distance]
         * @param res
         * @url_param - postId
         *
         */
        getzip : function(req, res) {
            var param = req.query;
            var sqlZipCodeInRadius = 'SELECT z.*, o.*, (6371 * 2 * ASIN(SQRT( ' +
                'POWER(SIN((o.org_lat - abs(z.latitude)) * pi()/180 / 2), ' +
                '2) + COS(o.org_lat * pi()/180 ) * COS(abs(z.latitude) * ' +
                'pi()/180) * POWER(SIN((o.org_long - z.longitude) * ' +
                'pi()/180 / 2), 2) ))) as distance ' +
                'FROM zcta z ' +
                'LEFT JOIN (SELECT latitude org_lat, longitude org_long, zip org_zip ' +
                'FROM zcta where zip = ?) o ON 1=1 ' +
                'having distance <= ?';
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( sqlZipCodeInRadius, [param.zip, param.distance], function(err, result) {
                    if (err) {
                        connection.release();
                        return Response.error(res, err, 'You can not find posts for now. Sorry for inconvenient');
                    }
                    return Response.success(res, result);
                });
            });
        },
        /**
         * return post detail
         *
         * @param req
         * @param res
         * @url_param - postId
         *
         */
        read : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var postId = req.params.postId;
            var sql = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                sql = 'SELECT p.*, u.username ow_username, u.email ow_email, u.first_name ow_firstname, u.last_name ow_lastname, u.phone ow_phone, u.address ow_address, u.zip ow_zip, c.title category_title, c.slug category_slug, z.latitude, z.longitude, z.city, z.state ' +
                    'FROM post p ' +
                    'LEFT JOIN user u ON u.id = p.user_id ' +
                    'LEFT JOIN category c ON c.id = p.category_id ' +
                    'LEFT JOIN zcta z ON z.zip = p.zip ' +
                    'WHERE p.id = ?'
                connection.query( sql, [postId], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'You can not find post for now. Sorry for inconvenient');
                    }
                    if (result.length == 0) {
                        return Response.error(res, err, 'Can not find post for this ID.');
                    }
                    return Response.success(res, result[0]);
                });
            });
        },

        /**
         *
         * @param req [ title, isbn, author, category(ID), publisher, zip, price, address, description, isold
         *              , contact ( string array or string) [email, text, call], type, email, phone, by_phone, by_email, by_text, comment
         *              , coverfile, use_textbook_cover, textbook_id ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var contactInfo = '';
            var coverPath = '';

            var byPhone = param.by_phone || 0;
            var byText = param.by_text || 0;
            var byEmail = param.by_email || 0;


            if( param.use_textbook_cover ) {
                coverPath = "/books/imgs/" + config.path.book_img + param.textbook_id + '.jpg';
                if(req.files) {
                    fs.unlink(req.files.coverfile.path);
                }
            } else if (req.files) {
                if (req.files.coverfile.originalFilename === "") {
                    fs.unlink(req.files.coverfile.path);
                } else {
                    var tmp_path = req.files.coverfile.path;
                    var todayFolder = Util.getTodayAsString();
                    var folderName = config.path.post_img + todayFolder;
                    var target_filename = Util.getTickTime() + req.files.coverfile.originalFilename;
                    coverPath = "/posts/" + todayFolder + '/' + target_filename;
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
                var sql = connection.format('INSERT INTO post(post.category_id, post.title, post.author, post.isbn13, post.publisher, post.type, post.price, post.description, post.user_id, post.zip, post.old, post.contact, post.coverpath, post.condition, post.email, post.phone, post.by_phone, post.by_text, post.by_email, post.comment) ' +
                    ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [param.category, param.title, param.author, param.isbn, param.publisher, param.type, param.price, param.description, userId, param.zip, param.isold, contactInfo, coverPath, param.condition, param.email, param.phone, byPhone, byText, byEmail, param.comment]);
                console.log(sql);
                connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create the new post. Sorry for inconvenience.');
                        }
                        notifier.bookPosted(result.insertId, param.title, param.isbn, param.price);
                        activity.newPost(userId, result.insertId, param.title);
                        return Response.success(res, result);
                    });
            });
        },
        /**
         *
         * @param req
         * @param res
         * @url_param - postId
         */
        delete : function(req, res) {
            var param = req.body;
            var postId = req.params.postId;
            var userId = req.user.id;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE post SET del=1 WHERE id=? AND user_id=?', [postId, userId], function(err, result) {
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
         * @param req [ title, isbn, author, category(ID), publisher, zip, price, address, description, isold
         *              , contact ( string array or string) [email, text, call], type, email, phone, by_phone, by_email, by_text, comment
         *              , coverfile, use_textbook_cover, textbook_id ]
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

            if( param.use_textbook_cover ) {
                coverPath = "/books/imgs/" + config.path.book_img + param.textbook_id + '.jpg';
                if(req.files) {
                    fs.unlink(req.files.coverfile.path);
                }
            } else if (req.files) {
                if (req.files.coverfile.originalFilename === "") {
                    fs.unlink(req.files.coverfile.path);
                } else {
                    var tmp_path = req.files.coverfile.path;
                    var todayFolder = Util.getTodayAsString();
                    var folderName = config.path.post_img + todayFolder;
                    var target_filename = Util.getTickTime() + req.files.coverfile.originalFilename;
                    coverPath = "/posts/" + todayFolder + '/' + target_filename;
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
                    sql = connection.format('UPDATE post SET post.category_id=?, post.title=?, post.author=?, post.isbn13=?, post.publisher=?, ' +
                        ' post.type=?, post.price=?, post.description=?, post.zip=?, post.old=?, post.contact=?, post.condition=?, post.comment=?, post.email=?, post.phone=?, post.by_phone=?, post.by_text=?, post.by_email=? ' +
                        ' WHERE post.user_id = ? AND post.id = ? '
                        ,[param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, param.isOld, contactInfo, param.condition, param.email, param.phone, param.by_phone, param.by_text, param.by_email, userId, postId]);
                } else {
                    sql = connection.format('UPDATE post SET post.category_id=?, post.title=?, post.author=?, post.isbn13=?, post.publisher=?, ' +
                        ' post.type=?, post.price=?, post.description=?, post.zip=?, post.old=?, post.contact=?, post.coverpath=?, post.condition=?, post.comment=?, post.email=?, post.phone=?, post.by_phone=?, post.by_text=?, post.by_email=? ' +
                        ' WHERE post.user_id = ? AND post.id = ? '
                        ,[param.category, param.title, param.author, param.isbn, param.publisher, param.cover, param.price, param.description, param.zip, param.isOld, contactInfo, coverPath, param.condition, param.comment, param.email, param.phone, param.by_phone, param.by_text, param.by_email, userId, postId]);
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
