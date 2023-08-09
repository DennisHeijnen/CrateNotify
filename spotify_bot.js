var CronJob = require('cron').CronJob;

var request = require('request'); // "Request" library

var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);

const express = require("express");

require('dotenv').config();

app = express();

// your application requests authorization
var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

function SpotifyUpdateBot() {
	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {

			var spotify_token = body.access_token;
			var user_id = "nederlandse_top_40";
			var limit = "5";
			var playlist_url = "https://api.spotify.com/v1/users/"+user_id+"/playlists?limit="+limit;

			$.ajax({
				url: playlist_url,
				datatype: 'json',
				headers: {
					"Authorization": "Bearer " + spotify_token
				}
			}).done(function(reply){
				var playlists = reply['items'];

				for(x in playlists) {
					playlist = playlists[x];

					if (playlist['name'] == 'Top 40') {
						var playlist_req = playlists[x];
						var playlist_id = playlist_req['id'];
						var tracks_url = "https://api.spotify.com/v1/playlists/"+playlist_id+"/tracks";

						$.ajax({
							url: tracks_url,
							datatype: 'json',
							headers: {
								"Authorization": "Bearer " + spotify_token
							}
						}).done(function(reply){
							var tracks = reply['items'];
							new_tracks = ["Nieuw in de Top 40: \n"];

							for(y in tracks) {
								track = tracks[y];
								track_track = track['track'];
								artists = track_track['artists'];
								var all_artists = '';

								for(z in artists) {
									artist = artists[z];
									all_artists = all_artists+artist['name']+", ";
								};

								all_artists = all_artists.substring(0, all_artists.length - 2);
								date_added = track['added_at'].substring(0, track['added_at'].length - 10);

								var date = new Date();
								date.setDate(date.getDate()-7);
						
								var month = date.getMonth()+1;
								var day = date.getDate();
								var year = date.getFullYear();

								if (month < 10) {
									month = '0' + month;
								};

								if (day < 10) {
									day = '0' + (day-1);
								};

								var date_week_ago = year + '-' + month + '-' + day;

								if (date_added >= date_week_ago) {
									var bot_message = all_artists + " - " + track_track['name'];
									new_tracks.push(bot_message);
								};
							};

							new_tracks = new_tracks.join("\r\n");
							new_tracks = encodeURI(new_tracks);
							new_tracks = new_tracks.replace('&', '%26');

							var api_url = "https://api.telegram.org/bot"+process.env.TELEGRAM_BOT_TOKEN+"/sendMessage?chat_id="+process.env.CHAT_ID+"&text="+new_tracks+"&disable_web_page_preview=true";
					
							$.ajax({
								url: api_url,
								datatype: 'json',
							}).done(function(reply){
								console.log(reply);
							});
						});
					};
				};
			});
		};
	});
};

var job = new CronJob('0 8 * * 6', function() {
  console.log('You will see this message every minute');
  SpotifyUpdateBot();
});
job.start();

app.listen(3000);