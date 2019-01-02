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
                return res.status(200).json({ 'info' : data[0] })
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

router.post('/actions', function(req, res) {
    MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
        var dbo = db.db('MOB')
        // var tweets = []
        // dbo.collection('posts2').find(
        //     {
        //         id_str : {
        //             $in : req.query.actions
        //         }
        //     }
        // ).toArray(function(err2, data) {
        //     tweets = data
        // })
        dbo.collection('users').updateOne(
            {
                id : req.body.id
            }, {
                $push : {
                    actions : {
                        $each : req.body.actions
                    }
                }
            }
        )
        db.close()
        return res.sendStatus(200)
    })
})

router.get('/actions', function(req, res) {
    MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
        var dbo = db.db('MOB')
        dbo.collection('users').updateOne(
            {
                id : req.query.id
            }, {
                $set : {
                    actions : []
                }
            }
        )
        db.close()
        return res.sendStatus(200)
    })
})

module.exports = router