/**
 * Created with JetBrains WebStorm.
 * User: valeriy
 * Date: 1/15/14
 * Time: 11:44 AM
 * To change this template use File | Settings | File Templates.
 */
module.exports = function(dbPool) {
    return {
        doAuth: function(req, res, next) {
            if (!req.isAuthenticated()) {
                if(req.query.access_token) {
                    dbPool.getConnection(function(err, connection){
                        if(err) { next(); }
                        connection.query("SELECT u.id, o.user_id, u.username, u.email, u.first_name, u.last_name, u.profile_img, u.user_welcome, u.account_type, u.terms, u.phone, u.address, u.zip, u.longitude, u.latitude, u.notification_cnt, u.ct, u.ut, u.del, u.role, (o.expires >= UTC_TIMESTAMP() ) is_expired "
                            + "FROM oauth_access_tokens o LEFT JOIN user u ON u.id=o.user_id WHERE access_token=?", [req.query.access_token], function(err, result){
                            if(err) { next(); }
                            else {
                                if(result.length && result.length > 0) {
                                    req.user = result[0];
                                }
                            }
                            next();
                        });
                    });
                } else {
                    next();
                }
            } else {
                next();
            }
        }
    }
}