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
                user : ''
            }
    },
    methods : {
        addWords : function() {
            this.keyword_track = this.keyword_track + this.keyword_string;
            console.log(this.keyword_track)
            this.keywords = this.keyword_track.split(',')
            this.keyword_string = '';
            this.keyword_track = this.keyword_track + ','
        },
        authenticate : function() {
            axios.post('http://localhost:6050/users/auth', {
                'id' : this.id,
                'password' : this.password
            }).then((response) => {
                if(response.status == 200) { 
                    $('#login').modal('hide')
                    this.user = this.id
                    this.keyword_track = response.data.tags
                    this.addWords()
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
        showPost : function(markId) {
            console.log(markId)
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
            postData[i] = { 'lat' : parseFloat(app.posts[i].lat),
                            'lon' : parseFloat(app.posts[i].lon), 
                            'count' : 2 
            };
        } 
        if (typeof postData !== 'undefined' && postData.length > 0 ) {
            heatmapLayer.setData({ max : postData.length, data : postData });
            var marks = [{}]
            for (var i = 0; i < postData.length; i++) {
                var html = '<div>' + app.posts[i].text + '</div>' +
                            '<div><span><b>retweets:</b> ' + app.posts[i].retweets +
                            ' <b>favorites:</b> ' + app.posts[i].favorites +
                            ' <button class="btn btn-link">more</button>'
                marks[i] = new L.marker([postData[i].lat, postData[i].lon]).addTo(map)
                    .bindPopup(html)
                    .openPopup();
                marks[i]._myid = app.posts[i].id_str
                marks[i].on('popupopen', function(event) {
                    app.showPost(event.popup._source._myid)
                })
            }
        }        
    });
});


