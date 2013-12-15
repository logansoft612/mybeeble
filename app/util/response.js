/**
 * Created with JetBrains WebStorm.
 * User: valeriy
 * Date: 12/6/13
 * Time: 10:32 PM
 * To change this template use File | Settings | File Templates.
 */

exports.success = function(response, result) {
    console.info("success: ", result);
    return response.jsonp({success: 1, result: result});
}
exports.error = function(response, error, message) {
    console.error("error: ", error, message);
    return response.jsonp({success: 0, err: error, msg: message});
}