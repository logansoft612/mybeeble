/*jslint node: true */
/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
    "use strict";

    if (!req.isAuthenticated()) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

/**
 * User authorizations routing middleware
 */
exports.user = {
    hasAuthorization: function (req, res, next) {
        "use strict";

        if (req.profile.id !== req.user.id && req.user.role !== 'admin') {
            return res.send(401, 'You are not allowed to access this resource');
        }
        next();
    },
    /**
     * Checks user role
     */
    isSuperman: function (req, res, next) {
        "use strict";

        if (req.user.role !== 'admin') {
            return res.send(401, 'You are not allowed to access this resource');
        }
        next();
    }
};
