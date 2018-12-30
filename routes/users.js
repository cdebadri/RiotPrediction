var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/'

router.post('/auth', function(req, res) {
    MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
        var dbo = db.db('MOB')
        dbo.collection('users').find({
            'id' : req.body.id
        }).limit(1) 
        .toArray(function(err, data) {
            if(typeof data === 'undefined' || data.length == 0)
                return res.sendStatus(401)
            else if(req.body.password === data[0].password) {
                console.log('200') 
                return res.status(200).json({ 'tags' : data[0].tags })
            }
            else
                return res.sendStatus(401)
        })
        db.close()
    })
})

router.post('/tags', function(req, res) {
    MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
        var dbo = db.db('MOB')
        dbo.collection('users').updateOne(
            { 'id' : req.body.id },
            { '$set' : { 'tags' : req.body.tags }}
        )
        db.close()
        return res.sendStatus(200)
    })
})

module.exports = router