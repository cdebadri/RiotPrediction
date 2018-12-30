var express = require('express');
var app = express();
var twitter = require('twit');
var MongoClient = require('mongodb').MongoClient
require('dotenv').config();
var bodyParser = require('body-parser')
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cors = require('cors')

var client = new twitter({
	consumer_key : process.env.TWITTER_CONSUMER_KEY,
	consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
	access_token : process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret : process.env.TWITTER_ACCESS_TOKEN_SECRET
});
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended : false }))
app.use(cors())

var url = 'mongodb://localhost:27017/'
var postData = [{}];
function getData() {
	MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
		if (err) throw err;
		var dbo = db.db("MOB"); //to be completed
		dbo.collection('posts').find({}, { 
			projection : { 
				_id : 0,
				 user : 0,
				 media : 0
			}}).toArray(function(err, res) {
			if (err) throw err;
			postData = res;
		});
	});
	return postData;
}

io.set('origins', '*:*');
io.on('connection', function(data) {
	postData = getData()
	if(typeof postData !== 'undefined')
		data.emit('stream', { 'message' : postData });
	setInterval(() => {
		postData = getData()
		if(typeof postData !== 'undefined')
			data.emit('stream', { 'message' : postData });
				// data.on('disconnect', () => {
				// 	console.log('disconnected');
				// });
	}, 60000);
});

http.listen(3000)


var trends = require('./routes/trends.js')
var users = require('./routes/users.js')
var tweet = require('./routes/tweet.js')

app.use('/map', express.static('map'));
app.use('/trends', trends)
app.use('/users', users)
app.use('/tweet', tweet)

app.listen(6050);