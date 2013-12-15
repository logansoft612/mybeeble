/**
 * Module dependencies.
 */
var _ = require('underscore');
Response = require('../util/response');

var DESCRIPTION_LEN = 100;

function getCondition( mode , id) {
    if (mode) {
        if (mode == "inbox") {
            return " to = "+id;
        } else if (mode == "sent") {
            return " from = "+id;
        }
    }
    return " from = "+id+" AND to = "+id;
}
function getTruncateDescription (text) {
    if(text.length < DESCRIPTION_LEN) {
        return text;
    }
    return text.substring(0, DESCRIPTION_LEN) + "...";
}
module.exports = function(dbPool, notifier) {
    return {
        /**
         *
         * @param req [ ~offset, ~len , ~mode (inbox, sent)]
         * @param res { total: '', result: result}
         */
        all : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var totalCnt = 0;
            var sql = '';


            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( "SELECT COUNT(*) as cnt FROM message WHERE " + getCondition(param.mode), function(err, result) {
                    if (err) {
                        return Response.error(res, err, 'You can not get wish list. Sorry for inconvenient');
                    }
                    if(result.length > 0) {
                        totalCnt = result[0]['cnt'];
                    }
                    sql = 'SELECT * FROM message WHERE ' + getCondition(param.mode);
                    if (param.len && param.len > 0) {
                        sql += ' LIMIT ' + param.len;
                        if (param.offset && param.offset > 0) {
                            sql += ' OFFSET ' + param.offset;
                        }
                    }
                    sql += ' ORDER BY ut DESC'
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not get messages. Sorry for inconvenient');
                        }
                        return Response.success(res, {total: totalCnt, result: result});
                    });
                });
            });
        },
        /**
         * method GET
         * @param req
         * @param res
         * @url_param - messageId
         *
         * @example
         * response
         * {
         *  id   :
         *  from :
         *  to   :
         *  title:
         *  truncate:
         *  ct   :
         *  ut   :
         *  fromName:
         *  toName:
         *  messages: [
         *      {
         *          id:
         *          from:
         *          to:
         *          content:
         *          ut:
         *      }, ...
         *    ]
         * }
         */
        get : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var messageId = req.params.messageId;

            var messageDetail;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query('SELECT m.*, concat(uf.first_name, " ", uf.last_name) fromName, concat(ut.first_name, " ", ut.last_name) toName ' +
                    'FROM message m ' +
                    'LEFT JOIN user uf ON uf.id = m.from ' +
                    'LEFT JOIN user ut ON ut.id = m.to ' +
                    'WHERE m.id = ? AND ( m.from = ? OR m.to = ? )',
                    [messageId, userId, userId], function(err, result) {
                        if (err) {
                            return Response.error(res, err, 'Did not find this message. Sorry for inconvenience.');
                        }
                        if(result.length == 0) {
                            return Response.error(res, err, 'Can not find this message.');
                        }
                        messageDetail = result;
                        connection.query( 'SELECT ml.id, ml.from, ml.to, ml.ut, ml.content' +
                            'FROM message_list ml ' +
                            'WHERE ml.message_id = ? AND ( ml.from = ? OR ml.to = ? ) ' +
                            'ORDER BY ml.ut DESC',
                            [messageId, userId, userId], function(err, result2) {
                                connection.release();
                                if (err) {
                                    return Response.error(res, err, 'Did not find this message. Sorry for inconvenience.');
                                }
                                if(result2.length == 0) {
                                    return Response.error(res, err, 'Can not find this message.');
                                }
                                messageDetail['messages'] = result2;
                                return Response.success(res, messageDetail);
                            });
                    });

            })
        },
        /**
         * Create new records on message and message_list.
         *
         * method POST
         * @param req [ from, to, title, content ]
         * @param res
         * @url_param - none
         *
         * @result
         *  {
         *  message   :
         *  content :
         *  }
         */
        create : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            //var param = {from: 1, to: 3, title: 'inserted from api', content: 'custom content'};
            //var userId = '1';
            if( param.from != userId) {
                return Response.error(res, null, 'Can not create new message. The message creator does not correct.');
            }

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                connection.query( 'INSERT INTO message(from, to, title, truncate) ' +
                    'values (?, ?, ?, ?)',
                    [userId, param.to, param.title, getTruncateDescription(param.content)], function(err, result) {
                        if (err) {
                            connection.release();
                            return Response.error(res, err, 'Did not create new message. Sorry for inconvenient.');
                        }
                        connection.query( 'INSERT INTO message_list(message_id, from, to, content) ' +
                            'values (?, ?, ?, ?)',
                            [result.insertId, param.to, param.content], function(err, result2) {
                                connection.release();
                                if (err) {
                                    return Response.error(res, err, 'Did not create new message - 2. Sorry for inconvenient.');
                                }
                                notifier.messageSent();
                                return Response.success(res, {message: result, content: result2});
                            });
                    });
            });
        },

        /**
         *
         * @param req  [title, from, to, content ]
         * @param res
         * @url_param - messageId
         */
        send : function(req, res) {
            var param = req.body;
            var messageId = req.params.messageId;
            var userId = req.user.id;

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Error(res, err, 'Can not get db connection.');
                }
                connection.query( 'UPDATE message SET truncate = ? WHERE id=?' +
                    [ getTruncateDescription(param.content) , messageId], function(err, result) {
                        if (err || result.affectedRows == 0) {
                            connection.release();
                            return Response.error(res, err, 'Did not send message. Sorry for inconvenient.');
                        }
                        connection.query( 'INSERT INTO message_list(from, to, content) ' +
                            'values (?, ?, ?)',
                            [userId, param.to, param.content], function(err, result2) {
                                connection.release();
                                if (err  || result2.affectedRows == 0) {
                                    return Response.error(res, err, 'Did not send message. Sorry for inconvenient.');
                                }
                                return Response.success(res, result2);
                            })
                    });
            })
        }
    };
}
