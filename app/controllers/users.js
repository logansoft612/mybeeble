/**
 * Module dependencies.
 */
var _               = require('underscore');
var Response        = require('../util/response');
var Util            = require('../util/util');
var EmailHelper     = require('../util/emailer');
var config          = require('../../config/config');
var fs              = require('fs');
//var sys = require('sys');
var exec = require('child_process').exec;

module.exports = function(dbPool, passport) {
    return {
        signin : function(req, res) {
            var param = req.body;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM user WHERE username = ? and password = MD5(?)', [param.userid, param.password], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'You can not login right now. Sorry for inconvenient');
                    }
                    if( rows.length > 0) {
                        return Response.error(res, err, 'User ID or password is incorrect.');
                    }
                    return Response.success(res, result);
                })
            })
        },

        /**
         * @METHOD POST
         *
         * @param req [ username, email, password, first_name, last_name, phone, address, zip, terms ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;

            var terms = param.terms;
            var profileImgPath = "";
            if(!terms) {
                terms = 0;
            }
            if(req.files && req.files.profile_img) {
                profileImgPath = req.files.profile_img.originalFilename;
            }
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'INSERT INTO user(username, email, password, first_name, last_name, phone, address, zip, terms) ' +
                    'values (?, ?, MD5(?), ?, ?, ?, ?, ?, ?)',
                    [param.username, param.email, param.password, param.first_name, param.last_name, param.phone, param.address, param.zip, terms], function(err, results) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not create new user.');
                        }
                        return Response.success(res, results);
                });
            });
        },

        /**
         *
         * @param req [ username, email, password, first_name, last_name, phone, address, zip, profile_img, major, minor, grad_date ]
         * @param res
         * @url_param - userId
         */
        update : function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            var profileImgPath = null;
            if(req.files && req.files.profile_img) {
                profileImgPath = req.files.profile_img.originalFilename;
            }
            /*
            if(req.files && req.files.profile_img) {
                if (req.files.profile_img.originalFilename === "") {
                    fs.unlink(req.files.profile_img.path);
                } else {
                    var tmp_path = req.files.profile_img.path;
                    var todayFolder = Util.getTodayAsString();
                    var folderName = config.root + '/public/avatar/' + todayFolder;
                    var target_filename = Util.getTickTime() + userId + req.files.profile_img.originalFilename;
                    profilePath = "/avatar/" + todayFolder + '/' + target_filename;
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
             */

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }

                var sql = connection.format( 'UPDATE user SET username=?, email=?, password=MD5(?), first_name=?' +
                    ', last_name=?, phone=?, address=?, zip=?, profile_img=?, major=?, minor=?, grad_date=? WHERE id=?'
                    ,[param.username, param.email, param.password, param.first_name, param.last_name, param.phone, param.address, param.zip, profileImgPath, param.major, param.minor, param.grad_date, userId]);
                var sql = "";
                if(param.username) {
                    sql += connection.format('username=?,', [param.username]);
                }
                if(param.email) {
                    sql += connection.format('email=?,', [param.email]);
                }
                if(param.username) {
                    sql += connection.format('username=?,', [param.username]);
                }
                if(param.password) {
                    sql += connection.format('password=?,', [param.password]);
                }
                if(param.first_name) {
                    sql += connection.format('first_name=?,', [param.first_name]);
                }
                if(param.last_name) {
                    sql += connection.format('last_name=?,', [param.last_name]);
                }
                if(param.phone) {
                    sql += connection.format('phone=?,', [param.phone]);
                }
                if(param.address) {
                    sql += connection.format('address=?,', [param.address]);
                }
                if(param.zip) {
                    sql += connection.format('zip=?,', [param.zip]);
                }
                if(profileImgPath) {
                    sql += connection.format('profile_img=?,', [profileImgPath]);
                }
                if(param.major) {
                    sql += connection.format('major=?,', [param.major]);
                }
                if(param.minor) {
                    sql += connection.format('minor=?,', [param.minor]);
                }
                if(param.grad_date) {
                    sql += connection.format('grad_date=?,', [param.grad_date]);
                }
                if(sql.length == 0) {
                    return Response.error(res, err, 'There is no field to update.');
                }
                sql = sql.substring(0, sql.length-1);
                sql = "UPDATE user SET " + sql +  connection.format(' WHERE id=?',[userId]);


                connection.query(sql, function(err, result) {
                        connection.release();
                        if (err) {
                            if(req.files && req.files.profile_img) {
                                fs.unlink(req.files.profile_img.path);
                            }
                            return Response.error(res, err, 'Did not modify the user\'s profile.');
                        }
                        if(req.files && req.files.profile_img) {
                            if (req.files.profile_img.originalFilename === "") {
                                fs.unlink(req.files.profile_img.path);
                            } else {
                                var tmp_path = req.files.profile_img.path;
                                var target_path = config.path.avatar + userId + '.jpg';
                                exec("mv " + tmp_path + " " + target_path, function(error, stdout, stderr){
                                    console.log(stdout);
                                })
                                /*
                                fs.rename(tmp_path, target_path, function(err) {
                                    if(err) {
                                        console.log("---file move error. file ID : " + userId + " error : ", err);
                                    }
                                });
                                */
                            }
                        }
                        return Response.success(res, result);
                    });
            });
        },

        /**
         *
         * @param req [ username, email, password, first_name, last_name, phone, address, zip, profile_img, major, minor, grad_date ]
         * @param res
         * @url_param - userId
         */
        updateavatar : function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            var profileImgPath = "";
            if(req.files && req.files.profile_img) {
                profileImgPath = req.files.profile_img.originalFilename;
            }

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                var sql = connection.format( 'UPDATE user SET profile_img=? WHERE id=?'
                    ,[profileImgPath, userId]);
                connection.query(sql, function(err, result) {
                    connection.release();
                    if (err) {
                        if(req.files && req.files.profile_img) {
                            fs.unlink(req.files.profile_img.path);
                        }
                        return Response.error(res, err, 'Did not modify the user\'s profile.');
                    }
                    if(req.files && req.files.profile_img) {
                        if (req.files.profile_img.originalFilename === "") {
                            fs.unlink(req.files.profile_img.path);
                        } else {
                            var tmp_path = req.files.profile_img.path;
                            var target_path = config.path.avatar + userId + '.jpg';
                            fs.rename(tmp_path, target_path, function(err) {
                                if(err) {
                                    console.log("---file move error. file ID : " + userId + " error : ", err);
                                }
                            });
                        }
                    }
                    return Response.success(res, result);
                });
            });
        },

        /**
         *
         * @param req [ email ]
         * @param res
         */
        pwdreset : function(req, res) {
            var param = req.body;
            var newPwd = Util.generateRandomPassword();

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE user SET password=MD5(?) WHERE email=?', [newPwd, param.email], function(err, results) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Did not reset password.');
                    }
                    if (results.affectedRows > 0) {
                        EmailHelper.passwordRestEmail(param.email, newPwd, function(success, err) {
                            if(success) {
                                return Response.success(res, "Password successfully changed");
                            }
                            return Response.error(res, err, "Your password reset, but can not send email.");
                        });
                    } else {
                        return Response.error(res, null, 'The user does not exist.');
                    }
                })
            })
        },
        /**
         * @METHOD GET
         *
         * @param req [ username ]
         * @param res
         */
        checkid : function(req, res) {
            var param = req.query;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM user WHERE id=?', [param.username], function(err, results) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Can not check the user name. Sorry for inconvenience.');
                    }
                    if (results.length == 0) {
                        return Response.success(res, 'OK');
                    } else {
                        return Response.success(res, 'FAIL')
                    }
                })
            })
        },

        session : function(req, res, next) {
            passport.authenticate('local', function(err, user, info){
                if (err) { return next(err); }
                if (!user) {
                    //return res.redirect('/login');
                    return Response.error(res, null, info);
                }
                req.logIn(user, function(err) {
                    if (err) { return next(err);}
                    //return res.redirect('/users/'+user.username)
                    return Response.success(res, user);
                });
            })(req, res, next);
            //res.jsonp({auth: 'OK'});
        },

        /**
         *   URL PARAM REQUEST
         * @param req
         * @param res
         */
        user : function(req, res, next, id) {
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT id, id as user_id, username, email, first_name, last_name, profile_img, user_welcome, account_type, terms, phone, address, zip, longitude, latitude, notification_cnt, ct, ut, del, role, major, minor, grad_date, feedback FROM user WHERE id = ?', [id], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Did not create new user.');
                    }
                    if (result.length > 0) {
                        req.profile = result[0];
                    }
                    next();
                });
            });
        },
        /**
         * Logout
         */
        signout : function(req, res) {
            req.logout();
            return Response.success(res, 'OK');
        },

        /**
         *
         * @param req
         * @param res
         * @url_param - userId
         */
        closeAccount: function(req, res) {
            var userId = req.params.userId;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE user SET del=1 WHERE id=?',
                    [userId], function(err, results) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not delete the user.');
                        }
                        return Response.success(res, results);
                    });
            });
        },
        /**
         *
         * @param req {role: ""}
         * @param res {success: 1, result: {} }
         * @url_param - userId
         */
        changePermission: function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            if(config.app.user_status.indexOf(param.role) < 0) {
                return Response.error(res, null, 'role type error.');
            }
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE user SET role=? WHERE id=?',
                    [param.role, userId], function(err, results) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not change this user\'s permission.');
                        }
                        return Response.success(res, results);
                    });
            });
        },
        /**
         * @METHOD GET
         *
         * @param req { ~offset: {number}, ~len:{number}}
         * @param res
         */

        all: function(req, res) {
            var param = req.query;
            var totalCnt = 0;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( "SELECT COUNT(*) as cnt FROM user ", function(err, result) {
                    if (err) {
                        return Response.error(res, err, 'You can not get user list. Sorry for inconvenient');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = 'SELECT * FROM user ';
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not get user list. Sorry for inconvenient');
                        }
                        return Response.success(res, {total: totalCnt, result: result});
                    });
                });
            });
        },
        /**
         *
         * @param req
         * @param res {success: 1, result: {} }
         * @url_param - userId
         */
        get: function(req, res) {
            var userId = req.params.userId;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection. Sorry for inconvenient.');
                }
                connection.query( 'SELECT id, id as user_id, username, email, first_name, last_name, profile_img, user_welcome, account_type, terms, phone, address, zip, longitude, latitude, notification_cnt, ct, ut, del, role, major, minor, grad_date, feedback FROM user WHERE id = ?', [userId], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Can not find this user. Sorry for inconvenient.');
                    }
                    if (result.length == 0) {
                        return Response.error(res, err, 'Did not find this user.');
                    }
                    return Response.success(res, result[0]);
                });
            });
        },

        /**
         * Give feedback to a user.
         * @METHOD POST
         *
                 * @param req { rated_user_id : {number} , rate : {number}, comment : {string}, transaction_id: {string} }
         * @param res {success: 1, result: {} }
         * @url_param - userId
         */
        rate: function(req, res) {
            var userId = req.params.userId;
            var param = req.body;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.  Sorry for inconvenient.');
                }
                connection.query( 'INSERT INTO user_feedback(user_id, marker_id, rate, comment, transaction_id) ' +
                'values (?, ?, ?, ?, ?)', [param.rated_user_id, userId, param.rate, param.comment, param.transaction_id], function(err, result) {
                    if (err) {
                        connection.release();
                        return Response.error(res, err, 'Can not not give feedback. Sorry for inconvenient.');
                    }
                    connection.query( 'UPDATE user SET feedback=(SELECT avg(rate) FROM user_feedback WHERE user_id=?) WHERE id=?',
                        [param.rated_user_id, param.rated_user_id], function(err, result2){
                            connection.release();
                            return Response.success(res, result);
                        });
                });
            });
        },
        /**
         * Set user did first login.
         * @METHOD PUT
         *
         * @param req
         * @param res {success: 1, result: {} }
         * @url_param - userId
         */
        firstlogin: function(req, res) {
            var userId = req.params.userId;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.  Sorry for inconvenient.');
                }
                connection.query( 'UPDATE user SET user_welcome=1 WHERE id=?', [userId], function(err, result) {
                    if (err) {
                        connection.release();
                        return Response.error(res, err, 'Can not not update the database. Sorry for inconvenient.');
                    }
                    return Response.success(res, result);
                });
            });
        },
        /**
         * Set user accept terms.
         * @METHOD PUT
         *
         * @param req
         * @param res {success: 1, result: {} }
         * @url_param - userId
         */
        acceptterm: function(req, res) {
            var userId = req.params.userId;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.  Sorry for inconvenient.');
                }
                connection.query( 'UPDATE user SET terms=1 WHERE id=?', [userId], function(err, result) {
                    if (err) {
                        connection.release();
                        return Response.error(res, err, 'Can not not update the database. Sorry for inconvenient.');
                    }
                    return Response.success(res, result);
                });
            });
        },
        /**
         * retrive all feedback history.
         * @METHOD GET
         *
         * @param req
         * @param res {success: 1, result: {} }
         * @url_param - userId
         */
        feedback: function(req, res) {
            var userId = req.params.userId;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.  Sorry for inconvenient.');
                }
                connection.query( 'SELECT uf.*, u.first_name, u.last_name FROM user_feedback uf left join user u ON uf.marker_id = u.id where user_id=? ORDER BY uf.ut DESC', [userId], function(err, result) {
                    if (err) {
                        connection.release();
                        return Response.error(res, err, 'Can not get feedback data. Sorry for inconvenient.');
                    }
                    return Response.success(res, result);
                });
            });
        }
    };
}
