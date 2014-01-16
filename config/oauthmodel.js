/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function(dbPool) {
    var authorizedClientIds = ['abc1', 'def2', '283180601731744'];
    return {
        getAccessToken : function (bearerToken, callback) {
            dbPool.getConnection(function(err, connection){
                if(err) return callback(err);
                connection.query('SELECT access_token, client_id, expires, user_id FROM oauth_access_tokens ' +
                    'WHERE access_token = ?', [bearerToken], function(err, result){
                    if(err) {
                        callback(err, false);
                    } else {
                        callback(err, result.length > 0 ? result[0] : false);
                    }
                });
            });
            /*pg.connect(connString, function (err, client, done) {
             if (err) return callback(err);
             client.query('SELECT access_token, client_id, expires, user_id FROM oauth_access_tokens ' +
             'WHERE access_token = $1', [bearerToken], function (err, result) {
             // This object will be exposed in req.oauth.token
             // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
             // an explicit user object is included (token.user, must include id) it will be exposed
             // in req.user instead
             callback(err, result.rowCount ? result.rows[0] : false);
             done();
             });
             });*/
        },
        getClient : function (clientId, clientSecret, callback) {
            dbPool.getConnection(function(err, connection){
                if(err) return callback(err);
                connection.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE ' +
                    'client_id = ? AND client_secret = ?', [clientId, clientSecret], function(err, result){
                    if(err) {
                        callback(err, false);
                    } else {
                        callback(err, result.length > 0 ? result[0] : false);
                    }
                });
            });
            /*pg.connect(connString, function (err, client, done) {
             if (err) return callback(err);
             client.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE ' +
             'client_id = $1 AND client_secret = $2', [clientId, clientSecret],
             function (err, result) {
             // This object will be exposed in req.oauth.client
             callback(err, result.rowCount ? result.rows[0] : false);
             done();
             });
             });*/
        },
        getRefreshToken : function (bearerToken, callback) {
            dbPool.getConnection(function(err, connection){
                if(err) return callback(err);
                connection.query('SELECT refresh_token, client_id, expires, user_id FROM oauth_refresh_tokens ' +
                    'WHERE refresh_token = ?', [bearerToken], function(err, result){
                    if(err) {
                        callback(err, false);
                    } else {
                        callback(err, result.length > 0 ? result[0] : false);
                    }
                });
            });
            /*pg.connect(connString, function (err, client, done) {
             if (err) return callback(err);
             client.query('SELECT refresh_token, client_id, expires, user_id FROM oauth_refresh_tokens ' +
             'WHERE refresh_token = $1', [bearerToken], function (err, result) {
             // The returned user_id will be exposed in req.user.id
             callback(err, result.rowCount ? result.rows[0] : false);
             done();
             });
             });*/
        },

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
        grantTypeAllowed : function (clientId, grantType, callback) {
            callback(false, true);
            /*
             if (grantType === 'password') {
             return callback(false, authorizedClientIds.indexOf(clientId.toLowerCase()) >= 0);
             }
             callback(false, true);*/
        },

        saveAccessToken : function (accessToken, clientId, userId, expires, callback) {
            dbPool.getConnection(function(err, connection){
                if(err) return callback(err);
                connection.query('INSERT INTO oauth_access_tokens(access_token, client_id, user_id, expires) ' +
                    'VALUES (?, ?, ?, ?)', [accessToken, clientId, userId, expires], function(err, result){
                    callback(err);
                });
            });
            /*pg.connect(connString, function (err, client, done) {
             if (err) return callback(err);
             client.query('INSERT INTO oauth_access_tokens(access_token, client_id, user_id, expires) ' +
             'VALUES ($1, $2, $3, $4)', [accessToken, clientId, userId, expires],
             function (err, result) {
             callback(err);
             done();
             });
             });*/
        },

        saveRefreshToken : function (refreshToken, clientId, userId, expires, callback) {
            dbPool.getConnection(function(err, connection){
                if(err) return callback(err);
                connection.query('INSERT INTO oauth_refresh_tokens(refresh_token, client_id, user_id, expires) ' +
                    'VALUES (?, ?, ?, ?)', [refreshToken, clientId, userId, expires], function(err, result){
                    callback(err);
                });
            });
            /*pg.connect(connString, function (err, client, done) {
             if (err) return callback(err);
             client.query('INSERT INTO oauth_refresh_tokens(refresh_token, client_id, user_id, ' +
             'expires) VALUES ($1, $2, $3, $4)', [accessToken, clientId, userId, expires],
             function (err, result) {
             callback(err);
             done();
             });
             });*/
        },

        /*
         * Required to support password grant type
         */
        getUser : function (username, password, callback) {
            dbPool.getConnection(function(err, connection){
                if(err) return callback(err);
                connection.query('SELECT id FROM user WHERE username = ? AND password = MD5(?)',
                    [username, password], function(err, result){
                        if(err) {
                            callback(err, false);
                        } else {
                            callback(err, result.length > 0 ? result[0] : false);
                        }
                    });
            });
            /*pg.connect(connString, function (err, client, done) {
             if (err) return callback(err);
             client.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username,
             password], function (err, result) {
             callback(err, result.rowCount ? result.rows[0] : false);
             done();
             });
             });*/
        }

    };
};
