/**
 * Module dependencies.
 */
var _               = require('underscore');
var Response        = require('../util/response');
var Util            = require('../util/util');
var EmailHelper     = require('../util/emailer');

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
         *
         * @param req [ username, email, password, first_name, last_name, phone, address, zip ]
         * @param res
         */
        create : function(req, res) {
            var param = req.body;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'INSERT INTO user(username, email, password, first_name, last_name, phone, address, zip) ' +
                    'values (?, ?, MD5(?), ?, ?, ?, ?, ?)',
                    [param.username, param.email, param.password, param.first_name, param.last_name, param.phone, param.address, param.zip], function(err, results) {
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
         * @param req [ username, email, password, first_name, last_name, phone, address, zip ]
         * @param res
         * @url_param - userId
         */
        update : function(req, res) {
            var param = req.body;
            var userId = req.params.userId;
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE user SET username=?, email=?, password=MD5(?), first_name=?, last_name=?, phone=?, address=?, zip=? WHERE id=?',
                    [param.username, param.email, param.password, param.first_name, param.last_name, param.phone, param.address, param.zip, userId], function(err, results) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'Did not modify the user\'s profile.');
                        }
                        return Response.success(res, results);
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
                connection.query( 'SELECT * FROM user WHERE id = ?', [id], function(err, result) {
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
            if(["new", "active", "admin"].indexOf(param.role) < 0) {
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

        all: function(req, res) {
            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM user', function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Can not get user list.');
                    }
                    return Response.success(res, result);
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
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'SELECT * FROM user WHERE userId = ?', [userId], function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'Did not find this user.');
                    }
                    if (result.length == 0) {
                        return Response.error(res, err, 'Did not find this user.');
                    }
                    return Response.success(res, result[0]);
                });
            });
        }
    };
}
