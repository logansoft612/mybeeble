var LocalStrategy = require('passport-local').Strategy,
    config = require('./config');


module.exports = function(passport, dbPool) {
    //Serialize sessions
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        dbPool.getConnection(function(err, connection) {
            if (err) {
                return done(err, null);
            }
            connection.query("SELECT * FROM user WHERE id = ?", [id], function(err, user) {
                connection.release();
                done(err, user[0]);
            });
        });
    });

    /**
     * passport login check
     * @ param [ username, password ]
     */
    passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function(username, password, done) {
            dbPool.getConnection(function(err, connection) {
                if (err) {
                    return done(err);
                }
                connection.query("SELECT * FROM user WHERE username = ? AND password = MD5(?)", [username, password], function(err, user) {
                    connection.release();
                    if (err) {
                        return done(err);
                    }
                    if (!user || user.length != 1) {
                        return done(null, false, {
                            message: 'Username or password is incorrect.'
                        });
                    }
                    if (user[0].del == 1 ) {
                        return done(null, false, {
                            message: 'This account is closed.'
                        });
                    }
                    return done(null, user[0]);
                });
            });
        }
    ));
};
