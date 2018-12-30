import pymongo
from rnn_lstm import analyseSentiment, analyseToxicity
import http.client, json, sys, copy, urllib.parse
from googletrans import Translator
from hatesonar import Sonar
import re

def mediaAnalyse(data):
    texts = []
    headers = {
        'apikey' : '0d408391ab88957'
    }
    for i in range(len(data['media'])):
        params = urllib.parse.urlencode({
            '@Language' : 'eng',
            '@isOverlayRequired' : 'false',
            '@url' : data['media'][i]['media_url_https'],
            '@iscreatesearchablepdf' : 'false',
            '@issearchablepdfhidetextlayer' : 'false'
        })
        conn = http.client.HTTPSConnection('api.ocr.space')
        conn.request('POST', '/parse/image', params, headers)
        response = json.loads(conn.getresponse().read().decode('utf-8'))
        texts.append(response['ParsedResults'][3])
    results = analyseSentiment(texts)

def geocode(place):
    conn = http.client.HTTPSConnection('us1.locationiq.com', 443)
    conn.request('GET', '/v1/search.php?key=269d9376ef6d64&q=' + place + '&format=json&limit=1') 
    r = json.loads(conn.getresponse().read().decode('utf-8'))
    return [r[0]['lon'], r[0]['lat']]

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['MOB']
tweets = db['tweets']
posts = db['posts2']
texts, ids, data, data_media, cache = [], [], [], [], []
translator = Translator()
sonar = Sonar()

for i in tweets.find({}, {'_id' : 0}).limit(20):
    flag = True
    tweets.delete_one({ 'id_str' : i['id_str'] })
    if i['lang'] in ['ur', 'bn', 'hi', 'te', 'en'] and i['text'] != None:
        print('sentence = ' + i['text'])
        print('lang = ' + i['lang'])
        try:
            string = translator.translate(i['text'], dest='en')
            print(string.text)
            i['text'] = string.text
        except:
            flag = False
            print('error')

    else:
        flag = False
    if flag:
        texts.append(i['text'])
        ids.append(i['id_str'])
        if 'media' in i.keys():
            data_media.append(i)
        data.append(i)

if len(texts) != 0:
    # results = analyseSentiment(texts)
    # results_media = mediaAnalyse(data_media)
    for j in range(len(text)):
        results.append(sonar.ping(text)['top_class'])
    for j in range(len(results)):
        tweets.delete_one({'id_str' : ids[j]})
        if results[j] == 'hate_speech' or results[j] == 'offensive_language':
            coord = geocode(data[j]['place'])
            data[j]['lon'], data[j]['lat'] = coord[0], coord[1]
            del data[j]['place']
            cache.append(data[j])

else:
    print('No new tweets. Exiting...')
    sys.stdout.flush()
    sys.exit()

for j in range(len(cache)):
    if cache[j]['lon'] == None or cache[j]['lat'] == None:
        continue
    posts.insert_one(cache[j])

print('done')
sys.stdout.flush()





