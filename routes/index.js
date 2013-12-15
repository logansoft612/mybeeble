
/*
 * GET home page.
 */

exports.index = function(req, res){
    if(!req.user) {
        res.render('index', { title: 'Express' });
    } else {

        res.render('tester', { title: 'Express', user: req.user });
    }
};
exports.book = function(req, res){
    if(!req.user) {
        res.redirect('index');
    } else {
        res.render('tester_book', { title: 'Express', user: req.user });
    }
};
exports.post = function(req, res){
    if(!req.user) {
        res.redirect('index');
    } else {
        res.render('tester_post', { title: 'Express', user: req.user });
    }
};
exports.bookmark = function(req, res){
    if(!req.user) {
        res.redirect('index');
    } else {
        res.render('tester_bookmark', { title: 'Express', user: req.user });
    }
};
exports.wish = function(req, res){
    if(!req.user) {
        res.redirect('index');
    } else {
        res.render('tester_wish', { title: 'Express', user: req.user });
    }
};
exports.message = function(req, res){
    if(!req.user) {
        res.redirect('index');
    } else {
        res.render('tester_message', { title: 'Express', user: req.user });
    }
};
exports.notification = function(req, res){
    if(!req.user) {
        res.redirect('index');
    } else {
        res.render('tester_notification', { title: 'Express', user: req.user });
    }
};