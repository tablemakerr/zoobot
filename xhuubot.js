//Import statements
const tmi = require('tmi.js');

// Variables

// Spotify needs:
var request = require('request');
var spotifyClientId = 'SPOTIFY_CLIENT_ID'; // Your client id
var spotifyClientSecret = 'SPOTIFY_CLIENT_SECRET'; // Your secret
var spotifyToken = "SPOTIFY_ACCESS_TOKEN"

// Craft the spotify authentication query with the information unique to the bot.
var spotifyAuthOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(spotifyClientId + ':' + spotifyClientSecret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
}

// Twitch needs:
const opts = {
  identity: {
    username: "xhuubot",
    password: "TWITCH_CHAT_OAUTH_PASSWORD"
  },
  channels: [
    "tablemakerr"
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// An array that is instantiated to keep track of song requests to prevent duplicates/spamming
// A long enough time of the script running probably means this could end up being a huge array
// Restarting the bot will obviously clear this entirely.
const songs = []

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

/*
* Connect to the spotify API and get the currently playing song information
* @param chatTarget - Where we will send our chat messages.
*/
function getSongInfo(chatTarget) {
  // Connect the bot to Spotify
  request.post(spotifyAuthOptions, function(error, response, body) {
    //console.log("Within getSongInfo()");

    // If we get the proper response code, continue
    if (!error && response.statusCode == 200) {

      // Use the access token to access the Spotify Web API
      var spotifyOptions = {
        url: 'https://api.spotify.com/v1/me/player',
        headers: {
          'Authorization': 'Bearer ' + spotifyToken
        },
        json: true
      };

      // Send the GET request to ask for the currently playing track
      request.get(spotifyOptions, function(error, response, body) {
        // Now we break the track up into some easily digestible bits to return back to the chat.

        // Song name
        const song = body.item.name
        //console.log(song)

        // Album name
        const album = body.item.album.name

        /**
         * Artists are returned as an object rather than just a string so we need to iterate over the objects and just grab the first one
         * Even in the case of multiple artist we only really care about the first one as that is the "owner" of the song in this basic context
         */
        const artists = body.item.album.artists
        var real_artist = ""
        artists.forEach(artist => real_artist = artist.name);

        // Now construct the songInfo as a basic array we can ....actually idk why I left this in, probably can delete this and change the say() statement below
        var songInfo = [song, album, real_artist]
        //console.log(songInfo)

        // Spout out the information
        client.say(chatTarget, `Currently playing ${songInfo[0]} by ${real_artist} on ${album}`);
      });
    }
  });
};

/**
 * 
 * @param {*} chatTarget - Where we will send our chat message
 * @param {*} spotifyRequestURI  - The given spotifyRequestURI that will be pushed into the queue if it is not a duplicate
 */
function addToQueue(chatTarget, spotifyRequestURI) { 
  // Split the spotify URI so we can inspect the unique string at the end.  
  spotifyURIInfo = spotifyRequestURI.split(":");
  //console.log(spotifyURIInfo)
  // If this song has already been requested....
  if (songs.includes(spotifyURIInfo[2])) {
    // Get outta here.
    client.say(chatTarget, `Request denied, this song has already been requestsed`)
  } else {
    // Else, this is a brand new song request, add it to the list before continuing
    songs.push(spotifyURIInfo[2])

    // Send the POST request to login as the bot.
    request.post(spotifyAuthOptions, function(error, response, body) { 
      //console.log("Within addToQueue()"); 
      //console.log(spotifyRequestURI)

      // If we are successful in connecting...continue
      if (!error && response.statusCode == 200) { 
        // Now construct the URL needed to actually add the song to the queue using the given requestURI
        var spotifyOptions = {
          url: `https://api.spotify.com/v1/me/player/queue?uri=${spotifyRequestURI}`,
          headers: {
            'Authorization': 'Bearer ' + spotifyToken
          },
          json: true
        };

        // Send the POST request to actually add the song to the queue, we expect a 204 response code according to documentation.
        request.post(spotifyOptions, function(error, response, body) {
          //console.log(response.statusCode)
          if (!error && response.statusCode == 204) {
            client.say(chatTarget, `Request accepted`);
          } else {
            // If for some reason we fail....
            client.say(chatTarget, `Request denied`);
          }
        });
      }
    });
  }
};


// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  //const commandName = msg.trim();
  const commandName = msg.split(" ");

  switch (commandName[0]) {
    case '!playing':
      getSongInfo(target)
      console.log(`* Executed ${commandName} command`);
      break;
    case '!queue':
      if (commandName[1] == "") {
        client.say(target, `You need to include a SpotifyURI`);
      } else {
        addToQueue(target, commandName[1])
      }
      break;
    case '!help':
      sayHelpMessage()
      break;
    default:
      client.say(target, `Unknown command ${commandName[0]}`);
      console.log(`* Unknown command ${commandName[0]}`);
  }
}

// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}