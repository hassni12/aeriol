const jwt = require('jsonwebtoken')
const config = require('config')

const Session = require('../models/session.model')
module.exports = async function (req, res, next) {

   
    //verify token
    try {
        const header = req.header('Authorization');
        let pathname = req.baseUrl + req.route.path

        if(!header && (pathname=="/api/product/"  || pathname=="/api/product/:id" )){
                console.log("called base Url pathname")
                next()
                return;
        }
    
        if(!header){
            return res.status(401).json({ message: 'No token authorization denied' })
        }
        const token = header.split(' ')[1]

        
        const decoded = jwt.verify(token, config.get('jwtSecret'))
        req.user = decoded;
        console.log(req.user)

        const sessions = await Session.findOne({ user: req.user._id, token: token, status: true })
        if (!sessions) return res.status(401).json({ message: 'authorization denied' })


        next();
    } catch (error) {
        // console.log("error dedua")
        res.status(401).json({ "error": error.message })
    }

}
