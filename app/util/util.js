/**
 * Created by Valeriy Romanov
 * Date: 12/7/13
 * Time: 11:05 PM
 * To change this template use File | Settings | File Templates.
 */
exports.generateRandomPassword = function() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var randomstring = '';
    var charCount = 0;
    var numCount = 0;

    for (var i=0; i<string_length; i++) {
        if((Math.floor(Math.random() * 2) == 0) && numCount < 3 || charCount >= 5) {
            var rnum = Math.floor(Math.random() * 10);
            randomstring += rnum;
            numCount += 1;
        } else {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
            charCount += 1;
        }
    }
    return randomstring;
}
exports.getTodayAsString = function() {
    var today = new Date()
    var yyyy = today.getFullYear().toString();
    var mm = (today.getMonth()+1).toString();
    var dd  = today.getDate().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]);
}
exports.getTickTime = function() {
    var today = new Date()
    return today.getTime().toString();
}