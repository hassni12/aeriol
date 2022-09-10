module.exports = function (req, res, next) {

    //401 unathorized
    //403 forbiddent
    //req.user

    if (!req.user.role=="ADMIN") return res.status(403).send('Access Denied')
    next()


}