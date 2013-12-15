/**
 * Module dependencies.
 */
var _ = require('underscore');
var Response = require('../util/response');
var config = require('../../config/config');


module.exports = function(dbPool) {
    return {
        /**
         *
         * @param req [ keyword, ~zip, ~distance, ~price_min, ~price_max, ~cover, ~category]
         * @param res
         *
         * keyword : auth, title, isbn, publisher
         */
        all : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var userZip = req.user.zip;
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
                escapedString = connection.escapeId(param.keyword);
                sql = 'SELECT * FROM textbook ' +
                    'WHERE del=0 AND ' +
                    '( isbn13 LIKE "%' + escapedString + '%" OR ' +
                    'author LIKE "%' + escapedString + '%" OR ' +
                    'title LIKE "%' + escapedString + '%" OR ' +
                    'publisher LIKE "%' + escapedString + '%")';
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
                            return Response.error(res, err, 'You can not find books for now. Sorry for inconvenient');
                        }
                        if (result.length == 0) {
                            return Response.success(res, []);
                        }
                        escapedString = result[0];
                        for(idx = 1; idx < result.length; idx++) {
                            escapedString += ", " + connection.escape(result[idx]);
                        }
                        sql += ' AND zip IN (' + escapedString +')';
                        connection.query( sql, function(err, result) {
                            connection.release();
                            if (err) {
                                return Response.error(res, err, 'You can not find books for now. Sorry for inconvenient');
                            }
                            return Response.success(res, result);
                        });
                    });
                } else {
                    connection.query( sql, function(err, result) {
                        connection.release();
                        if (err) {
                            return Response.error(res, err, 'You can not find books for now. Sorry for inconvenient');
                        }
                        return Response.success(res, result);
                    });
                }
                /*
                 SELECT z.*, o.*, (6371 * 2 * ASIN(SQRT(
                 POWER(SIN((o.org_lat - abs(z.latitude)) * pi()/180 / 2),
                 2) + COS(o.org_lat * pi()/180 ) * COS(abs(z.latitude) *
                 pi()/180) * POWER(SIN((o.org_long - z.longitude) *
                 pi()/180 / 2), 2) ))) as distance
                 FROM zcta z
                 LEFT JOIN (SELECT latitude org_lat, longitude org_long, zip org_zip
                 FROM zcta where zip = '00601') o ON 1=1
                 having distance <= 60;
                * */


            });
        },
        /**
         * return book detail
         *
         * @param req
         * @param res
         * @url_param - bookId
         *
         */
        get : function(req, res) {
            var param = req.body;
            var userId = req.user.id;
            var bookId = req.params.bookId;
            var sql = '';

            dbPool.getConnection(function(err, connection){
                if (err) {
                    return Response.error(res, err, 'Can not get db connection.');
                }
                sql = 'SELECT tb.*, u.username ow_username, u.email ow_email, u.first_name ow_firstname, u.last_name ow_lastname, u.phone ow_phone, u.address ow_address, u.zip ow_zip ' +
                    'FROM textbook tb ' +
                    'LEFT JOIN user u ON u.id = tb.owner_id ' +
                    'WHERE id = ?'
                connection.query( sql, function(err, result) {
                    connection.release();
                    if (err) {
                        return Response.error(res, err, 'You can not find books for now. Sorry for inconvenient');
                    }
                    if (result.length == 0) {
                        return Response.error(res, err, 'Can not find book for this ID.');
                    }
                    return Response.success(res, result);
                });
            });
        }
    };
}
