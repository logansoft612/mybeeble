/**
 * Created by Valeriy Romanov.
 * Date: 12/2/13
 * Time: 11:41 AM
 * To change this template use File | Settings | File Templates.
 */
var path            = require('path'),
    nodemailer      = require('nodemailer'),
    emailTemplates  = require('email-templates'),
    templateDir     = path.resolve( __dirname, '..', 'templates');

var hostname = 'http://localhost:3000/';
var transport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "valeriyr82@gmail.com",
        pass: "dragonkiller."
    }
});

/**
 * Create patient
 */
exports.passwordRestEmail = function(email, newPwd, cb) {
    if (email == null || email === '') {
        return cb(false);;
    }
    emailTemplates(templateDir, function (err, template) {
        if (err) {
            console.log("Password Reset Email Error : ", err);
            return cb(false, err);
        } else {
            var info = {
                hostname : hostname,
                login_url : 'patients/activate/',
                newPwd : newPwd
            };
            template('resetpwd', info, function(err, html, text) {
                if (err) {
                    console.log("Password Reset Email Error : ", err);
                    return cb(false, err);
                } else {
                    transport.sendMail({
                        from    : 'myBeeble (Web master)',
                        to      : email,
                        subject : 'New Password',
                        html    : html,
                        text    : text
                    }, function(err, responseStatus) {
                        if(err) {
                            console.log("Password Reset Email Error : ", err);
                            return cb(false, err);
                        }
                        console.log("Password Rest Email Sent : " + email);
                        return cb(true);
                    });
                }
            });
        }
    });
};