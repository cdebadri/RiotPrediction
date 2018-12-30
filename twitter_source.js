var twitter = require('twit');
require('dotenv').config();
var translate = require('google-translate-api')
var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/';
var client = new twitter({
	consumer_key : process.env.TWITTER_CONSUMER_KEY,
	consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
	access_token : process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret : process.env.TWITTER_ACCESS_TOKEN_SECRET
});
// var keys = [];
var data, text, user_data;
var india = '68.1766451354,7.96553477623,97.4025614766,35.4940095078', count = 0;
var stream = client.stream('statuses/filter', { locations : india,
	languages : ['en', 'hi', 'bn', 'ur']
});

function setTweetData(tweet, text) {
	var user_data = {
		id_str : tweet.user.id_str,
		name : tweet.user.name,
		screen_name : tweet.user.screen_name,
		location : tweet.user.location,
		url : tweet.user.url,
		profile_image_url : tweet.user.profile_image_url_https
	}
	var data = { 
		id_str : tweet.id_str,
		text : text,
		lang : tweet.lang,
		place : tweet.place.full_name,
		date : tweet.created_at,
		retweets : tweet.retweets_count,
		favorites : tweet.favorites_count,
		sensitivity : tweet.possibly_sensitive,
		user : user_data,
		status : 'dormant'  
	};
	if(typeof tweet.extended_entities !== 'undefined') 
		data['media'] = tweet.extended_entities.media
	return data
}

function extract() {
	MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
		if (err) throw err;
		var dbo = db.db("MOB");
	
		stream.on('tweet', function(tweet) {

			// for (var k in tweet) keys.push(k);
			// console.log(keys);
			stream.stop()
			if (tweet.lang != 'und') {
				// console.log(tweet.text);
				if(tweet.truncated)
					text = tweet.extended_tweet.text;
				else
					text = tweet.text
				// console.log('place = ' + tweet.place.full_name);
				// console.log('language = ' + tweet.lang);
				// text = text.replace(/@(.*)[\n\s\.?!$]/gi, '')
				// text = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
				data = setTweetData(tweet, text)
				dbo.collection('tweets').insertOne(data, function(err, res) {
					if (err) throw err;
					console.log('inserted');
				});
			}
			stream.start()
		});
	});
}

extract();
stream.on('error', function(error) {
	console.log(error);
	extract();
});
