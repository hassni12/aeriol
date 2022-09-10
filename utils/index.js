
const URL = require('url')
const request = require('request')


module.exports = {
    url: function (req,path = '') {
        return req.protocol + "://" + req.headers.host+'/'+path
    }

}