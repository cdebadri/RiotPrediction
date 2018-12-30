var twitter = require('twit');
require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;
const spawn = require('child_process').spawn;
var cron = require('node-cron');

var url = 'mongodb://localhost:27017/';
var client = new twitter({
	consumer_key : process.env.TWITTER_CONSUMER_KEY,
	consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
	access_token : process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret : process.env.TWITTER_ACCESS_TOKEN_SECRET
});

cron.schedule('*/5 * * * *', function() {
	console.log('analysing...');
	const pyprocess = spawn('python3', ['analysis.py']);
	pyprocess.setMaxListeners(0);
	pyprocess.stdout.on('data', function(data) {
		console.log('killing');
		pyprocess.kill();
	});
});

function checkDate(old_date, new_date) {
	old_date = Date.parse(old_date)
	new_date = Date.parse(new_date)
	diff = new_date - old_date
	return diff / (1000 * 60 * 24)
}

function findPercentage(old_val, new_val) {
	if(old_val == NaN)
		old_val = 0
	if(old_val == 0 && new_val > 500)
		return 2
	else if(new_val < 500)
		return 0
	else
		return (new_val - old_val) / old_val
}

cron.schedule('*/15 * * * *', function() {
	console.log('tracking...')
	MongoClient.connect(url, { useNewUrlParser : true }, function(err, db) {
		var dbo = db.db('MOB')
		dbo.collection('posts').find({}, {
			id_str : 1,
			_id : 0,
			date : 1,
			retweets : 1,
			favorites : 1
		}).sort({
			date : 1
		}).limit(100).toArray(function(error, data) {
			if(error)
				console.log(error)
			else {
				var id_list = ''
				for(var i = 0; i < data.length; i++)
					id_list = id_list + ',' + data[i].id_str
				id_list = id_list.substring(1, id_list.length - 1)
				client.get('statuses/lookup', { id : id_list }, function(err2, statuses, response) {
					for(var i = 0; i < data.length; i++) {
						for(var j = 0; j < statuses.length; j++) {
							if(data[i].id_str == statuses[j].id_str) {
								if(checkDate(data[i].date, new Date()) > 7) {
									dbo.collection('posts').deleteOne(
										{
											'id_str' : data[i].id_str
										}
									).then((response) => {
										console.log('deleted')
									}).catch((err1) => {
										console.log(err1)
									})
								} 
								else if(findPercentage(parseFloat(data[i].retweets), parseFloat(statuses[j].retweets)) > 1
								|| findPercentage(parseFloat(data[i].favorites), parseFloat(statuses[j].favorites)) > 1) {
									data[i].retweets = statuses[j].retweets
									data[i].favorites = statuses[j].favorites
									data[i].date = new Date()
									dbo.collection('posts').updateOne(
										{
											'id_str' : data[i].id_str
										}, {
											'$set' : {
												'retweets' : data[i].retweets,
												'favorites' : data[i].favorites,
												'date' : data[i].date,
												'status' : 'live'
											}
										}
									).then((response) => {
										console.log('updated')
									}).catch((err1) => {
										console.log(err1)
									})
								}
								else {
									data[i].retweets = statuses[j].retweets
									data[i].favorites = statuses[j].favorites
									data[i].date = new Date()
									dbo.collection('posts').updateOne(
										{
											'id_str' : data[i].id_str
										}, {
											'$set' : {
												'retweets' : data[i].retweets,
												'favorites' : data[i].favorites,
												'date' : data[i].date,
												'status' : 'dormant'
											}
										}
									).then((response) => {
										console.log('made dormant')
									}).catch((err1) => {
										console.log(err1)
									})
								}
							}
						}
					}
				})
			}
		})
	})
	console.log('ckecked virality')
})
