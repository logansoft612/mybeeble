
/*
 * GET users listing.
 */

exports.list = function(req, res){
    if(!req.user) {
        res.render('index', { title: 'Express' });
    } else {
        res.render('tester', { title: 'Express', user: req.user });
    }
};