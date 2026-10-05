function isLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    }

    res.redirect("/auth/login");
}


function hasRole(...roles) {
    return (req, res, next) => {

        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (!roles.includes(req.session.user.role)) {
            return res.status(403).send("Access denied");
        }

        next();
    };
}


module.exports = {
    isLoggedIn,
    hasRole
};