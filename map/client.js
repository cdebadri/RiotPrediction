var L = require('../node_modules/leaflet');
var HeatmapOverlay = require('../node_modules/leaflet-heatmap');
var axios = require('axios')

var app = new Vue ({
    el : '#app',
    data() {
            return {
                posts : [{}],
                keywords : [],
                keyword_string : '',
                keyword_track : '',
                trends : new Array(0),
                id : '',
                password : '',
                user : '',
                actions : [],
                tweet : {
                    id : '',
                    user : '',
                    user_screen_name : '',
                    profile_img : '',
                    text : '',
                    media : [{}]
                }
            }
    },
    methods : {
        addWords : function() {
            this.keyword_track = this.keyword_track + this.keyword_string;
            this.keywords = this.keyword_track.split(',')
            this.keyword_string = '';
            this.keyword_track = this.keyword_track + ','
        },
        authenticate : function() {
            while(this.actions.length > 0)
                this.actions.pop()
            axios.post('http://localhost:6050/users/auth', {
                'id' : this.id,
                'password' : this.password
            }).then((response) => {
                if(response.status == 200) { 
                    $('#login').modal('hide')
                    this.user = this.id
                    this.keyword_track = response.data.info.tags
                    this.addWords()
                    for(var i = 0; i < response.data.info.actions.length; i++)
                        this.actions.push(response.data.info.actions[i])
                    this.loadActions()
                }
                else {
                    $('#login').modal()
                    document.getElementById('incorrect').setAttribute('hidden', false)
                }
            }).catch((error) => {

            })
        },
        showLogin : function() {
            this.user = ''
            this.id = ''
            this.password = ''
            $('#login').modal()
        },
        saveTags : function() {
            axios.post('http://localhost:6050/users/tags', {
                'id' : this.user,
                'tags' : this.keyword_track
            }).then((response) => {
                if(response.status == 200)
                    console.log('saved')
            }).catch((error) => {

            })    
        },
        clearTags : function() {
            this.keyword_string = ''
            this.keyword_track = ''
            this.saveTags()
            this.addWords()
        },
        showPost : function() {
            console.log('reached = ' + this.tweet.id)
            axios.get('http://localhost:6050/tweet', {
                params : {
                    'id_str' : this.tweet.id
                }
            }).then((response) => {
                if(response.status == 200) {
                    this.tweet.user = response.data.info.user.name
                    this.tweet.user_screen_name = response.data.info.user.screen_name
                    this.tweet.profile_img = response.data.info.user.profile_image_url
                    this.tweet.text = response.data.info.text
                    this.tweet.media = response.data.info.media 
                    document.getElementById('profile_pic').src = this.tweet.profile_img
                    if(typeof this.tweet.media !== 'undefined') {
                        for(var i = 0; i < this.tweet.media.length; i++) {
                            document.getElementById('pic' + i.toString()).src = this.tweet.media[i].media_url_https
                        }    
                        console.log('media=' + this.tweet.id)
                    } else {
                        for(var i = 0; i < 4; i++)
                            document.getElementById('pic' + i.toString()).src = ''
                    }
                }
            }).catch((error) => {
                console.log('error')
            })
            $('#tweet').modal()
        },
        loadActions : function() {
            $('#list-tab').empty()
            for(var i = 0; i < this.actions.length; i++) {
                var idLabel = document.createElement('li')
                idLabel.className = 'list-group-item list-group-item-action list-group-item-primary'
                idLabel.role = 'tab'
                idLabel.id = 'tweet' + this.actions[i]
                idLabel.innerHTML = this.actions[i]
                document.getElementById('list-tab').appendChild(idLabel)
            }
        },
        addAction : function() {
            $('#tweet').modal('hide')
            this.actions.push(this.tweet.id)
            this.loadActions()
        },
        saveActions : function() {
            axios.post('http://localhost:6050/users/actions', {
                id : this.user,
                actions : this.actions
            }).then((response) => {
                if(response.status == 200) {
                    console.log('saved actions')
                    while(this.actions.length > 0)
                        this.actions.pop()
                    $('#list-tab').empty()
                }
            }).catch((error) => {
                console.log('error actins')
            })
        },
        clearActions : function() {
            axios.get('http://localhost:6050/users/actions', {
                params : {
                    id : this.user
                }
            }).then((response) => {
                if(response.status == 200)
                    while(this.actions.length > 0)
                        this.actions.pop()
                $('#list-tab').empty()
            }).catch((error) => {
                console.log('error clearing')
            })
        }
    },
    created() {
        $(document).ready(function() {
            $('#login').modal()
        })
        
        axios.get('http://localhost:6050/trends')
            .then((response) => {
                for(var i = 0; i < response.data.trends.length; i++)
                    Vue.set(this.trends, i, response.data.trends[i])
            })
            .catch((err) => {
                console.log(err)
            })
    }

});

// var mymap = L.map('mapid').setView([23.48, 80.12], 5);

var baseLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2RlYmFkcmkiLCJhIjoiY2ptcjh1YmNlMXluajNxcDU0b3NrOWowbiJ9.kGcSMPD0cZyz0tLOTIIilw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
});

var cfg = {
    "radius": 2,
    "maxOpacity": .8, 
    "scaleRadius": true, 
    "useLocalExtrema": true,
    "latField": 'lat',
    "lngField": 'lon',
    "valueField": 'count'
};
  
  
var heatmapLayer = new HeatmapOverlay(cfg);

var map = new L.map('mapid', {
    center: new L.LatLng(23.48, 80.12),
    zoom: 4,
    layers: [baseLayer, heatmapLayer]
});

const socket = io('http://localhost:3000', { reconnect : true });
socket.on('connect', function() {
    console.log('found server');
    socket.on('stream', (data) => {
        for(var i = 0; i < data.message.length; i++)
            Vue.set(app.posts, i, data.message[i])
        console.log('received');
        var postData = [{}];
        for (var i = 0; i < app.posts.length; i++) {
            postData[i] = { 
                'lat' : parseFloat(app.posts[i].lat),
                'lon' : parseFloat(app.posts[i].lon), 
                'count' : 2 
            };
        } 
        if (typeof postData !== 'undefined' && postData.length > 0 ) {
            heatmapLayer.setData({ max : postData.length, data : postData });
            var marks = [{}]
            for (var i = 0; i < postData.length; i++) {
                var htmldiv = document.createElement('div')
                var div = document.createElement('div')
                div.innerHTML = app.posts[i].text
                htmldiv.appendChild(div)
                div = document.createElement('div')
                var span = document.createElement('span')
                span.innerHTML = '<b>retweets:</b> ' + app.posts[i].retweets + ' <b>favorites:</b> ' + app.posts[i].favorites
                var button = document.createElement('button')
                button.className = 'btn btn-link'
                button.innerHTML = 'more'
                button.id = app.posts[i].id_str
                span.appendChild(button)
                div.appendChild(span)
                htmldiv.appendChild(div)
                var popup = L.popup().setContent(htmldiv)
                marks[i] = new L.marker([postData[i].lat, postData[i].lon]).addTo(map)
                    .bindPopup(popup)
                marks[i]._myid = app.posts[i].id_str
                marks[i].on('popupopen', function(event) {
                    app.tweet.id = event.popup._source._myid
                    document.getElementById(app.tweet.id).addEventListener('click', app.showPost)
                })
            }
        }        
    });
});


