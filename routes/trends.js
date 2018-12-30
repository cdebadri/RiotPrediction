var express = require('express')
var router = express.Router()
var twitter = require('twit');
require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;

var client = new twitter({
	consumer_key : process.env.TWITTER_CONSUMER_KEY,
	consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
	access_token : process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret : process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var url = 'mongodb://localhost:27017/'

router.get('/', function(req, res, next) {
    client.get('trends/place', { id : 23424848 }, function(err, data, response) {
        if(response.status != 200) {
            MongoClient.connect(url, { useNewUrlParser : true }, function(err1, db) {
                var dbo = db.db("MOB")
                dbo.collection("trends").find({
                    id : '23424848'
                },
                { 
                    projection : { _id : 0 }
                })
                .toArray((err2, data2) => {
                    return res.json({ 'trends' : data2[0].trends })
                })
            })
        } else {
            var tags = []
            for(var i = 0; i < data[0].trends.length; i++)
                tags[i] = data[0].trends[i].name
            MongoClient.connect(url, { useNewUrlParser : true }, function(err1, db) {
                var dbo = db.db("MOB")
                dbo.collection("trends").updateOne(
                    { 'id' : '23424848' },
                    { '$set' : { trends : tags } },
                    { 'upsert' : true }
                )
            })
            return res.json({ 'trends' : tags })
        }
    })
})

module.exports = router