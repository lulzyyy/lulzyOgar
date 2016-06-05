# LulzyOgar
A fully functional open source c0nsume.me server implementation, written in Node.js. LulzyOgar is designed to be used with the c0nsume.me client. If you find any issues, tell me. Btw. code needs to be cleaned up because I edited other version of Ogar.

### Official Website
The official website is www.c0nsume.me You connect to your server using, for example http://c0nsume.me/private.php?ip=127.0.0.1:600

## Obtaining and Using

First, you need Node.js.
- For Windows, click https://nodejs.org/dist/v4.4.5/node-v4.4.5-x64.msi and install it.
- Download LulzyOgar by clicking 'Clone or Download' -> 'Download ZIP' and unzip these files somewhere
- Open console and write 
```
npm install ws
npm install geoip-lite 
npm install -g forever
```
- Go to LulzyOgar/src folder and click 'Start-Node.bat' to run. You can also click 'Start-Forever.bat' if you want server to be automatically restarted.(But then cant execute any server commands in console).

- For Linux do:
```
~$ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
~$ sudo apt-get install -y nodejs
~$ sudo apt-get install -y build-essential
```

To install LulzyOgar do:
```
~$ git clone git://github.com/lulzyyy/lulzyOgar.git lulzyOgar
~$ cd lulzyOgar/src
~$ npm install
~$ node index.js
```

Currently, LulzyOgar listens on the following addresses and ports:
* *:600 - for the game server

Please note that on some systems, you may have to run the process as root or otherwise elevate your privileges to allow the process to listen on the needed ports. **If you are getting an EADDRINUSE error, it means that the port required to run Ogar is being used. Usually, Skype is the culprit. To solve this, either close out skype, or change the serverPort value in gameserver.ini to a different port. You will have to change your connection ip to "127.0.0.1:PORT"**

Once the game server is running, you can connect (locally) by typing http://c0nsume.me/private.php?ip=127.0.0.1:600 into your browser's address bar.

## Configuring Ogar
Use "gameserver.ini" to modify Ogar's configurations field. Player bots are currently basic and for testing purposes. To add/remove bot names, edit the file named "botnames.txt" which is in the same folder as "gameserver.ini". Names should be separated by using the enter key.
To add for example 10 bots just write in console 'addbots 10' and to kick them, write 'kickbots 10'.
## Game modes
LulzyOgar has support for 3 basic game modes. To switch between game modes, change the value of "gamemode" in the configurations file to the selected game mode id and restart the server. The current supported game modes are:

Id   | Name
-----|--------------
0    | Free For All
1    | Teams
2    | Experimental

## Console Commands
The current available console commands are listed here. Command names are not case sensitive, but player names are.

 - Addbot [Number]
   * Adds [Number] of bots to the server. If an amount is not specified, 1 bot will be added.
 - Kickbots [number]
   * Kicks a number of bots (leave field blank and it will kick all bots)
 - Restart [minutes]
   * Restarts the server after a number of minutes or if you leave min blank, restarts immediatly
 - Spawnmass [id] [mass]
   * sets a players spawnmass. set to 0 to return to normal value
 - Merge [id]
   * forces user to merge
 - Killbots [number]
   * Kills a number of bots (leave field blank and it will kick all bots)
 - Ban [IP]
   * Bans an IP and sends a MSG. Do ban record to record ban
 - Banlist
   * Lists banned IPs
 - Clearban
   * Clears ban list
 - Split [ID] [Count]
   * Splits a player
 - Colortext [color]
   * Changes console Color and Style (blue, green,red,yellow,bold,reset,dim,white, help)
 - Explode [id]
   * explodes player
 - Board [String 1] [String 2] [String 3] ...
   * Replaces the text on the leaderboard with the string text.
 - Boardreset
   * Resets the leaderboard to display the proper data for the current gamemode
 - Change [Config setting] [Value]
   * Changes a config setting to a value. Ex. "change serverMaxConnections 32" will change the variable serverMaxConnections to 32. Note that some config values (Like serverGamemode) are parsed before the server starts so changing them mid game will have no effect.
 - Clear
   * Clears the console output
 - Color [Player ID] [Red] [Green] [Blue]
   * Replaces the color of the specified player with this color.
 - Exit
   * Closes the server.
 - Food [X position] [Y position] [Mass]
   * Spawns a food cell at those coordinates. If a mass value is not specified, then the server will default to "foodStartMass" in the config.
 - Gamemode [Id]
   * Changes the gamemode of the server. Warning - This can cause problems.
 - Help
   * Shows List Of Commands
 - Kick [Player ID]
   * Kicks the specified player or bot from the server.
 - Kill [Player ID]
   * Kills all cells belonging to the specified player.
 - Killall
   * Kills all player cells on the map.
 - Mass [Player ID] [Number]
   * Sets the mass of all cells belonging to the specified player to [Number].
 - Name [Player ID] [New Name]
   * Changes the name of the player with the specified id with [New Name].
 - Playerlist
   * Shows a list of connected players, their IP, player ID, the amount of cells they have, total mass, and their position.
 - Pause
   * Pauses/Unpauses the game.
 - Reload
   * Reloads the config file used by the server. However, the following values are not affected: serverPort, serverGamemode, serverBots, serverStatsPort, serverStatsUpdate.
 - Status
   * Shows the amount of players currently connected, time elapsed, memory usage (memory used/memory allocated), and the current gamemode.
 - Virus [X position] [Y position] [Mass]
   * Spawns a virus cell at those coordinates. If a mass value is not specified, then the server will default to "virusStartMass" in the config.

## License
Please see [LICENSE.md](https://github.com/OgarProject/Ogar/blob/master/LICENSE.md).
