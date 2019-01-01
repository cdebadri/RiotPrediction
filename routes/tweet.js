var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/'

router.get('', function(req, res, next) {
    MongoClient.connect(url, { useNewUrlParser : true }, function(err, client) {
        var db = client.db('MOB')
        db.collection('posts2').findOne(
            {
                'id_str' : req.query.id_str
            },{
                'projection' : {
                    '_id' : 0
                }
            },function(err1, data) {
                if(err1)
                    return res.sendStatus(404)
                return res.status(200).json({ 'info' : data })
            }
        )
    })
})

module.exports = router