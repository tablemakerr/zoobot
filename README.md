# zoobot
First chat bot that will combine twitch &amp; spotify API


Most of this is ripped right from Twitch's own example of a basic chat IRC bot found here: https://dev.twitch.tv/docs/irc

Living document of References:
 * https://developer.spotify.com/documentation/web-api/reference-beta/#endpoint-get-information-about-the-users-current-playback
 * https://developer.spotify.com/documentation/web-api/reference-beta/#endpoint-add-to-queue


Permissions required from Spotify API:
 * user-read-currently-playing
 * usre-modify-playback-state

TODO:
* Figure out how to actually make this a Spotify app with proper persistent permissions