// Imports
var Teams = require('../gamemodes/Teams.js');
var GameMode = require('../gamemodes');
var Entity = require('../entity');
var EjectedMass = require('../entity/EjectedMass');
// fs sync functions are not called while server is running basicly
var fs = require("fs");
var request = require('request');

function Commands() {
    this.list = {}; // Empty
    this.pcmd;
}

module.exports = Commands;

// Utils
var fillChar = function(data, char, fieldLength, rTL) {
    var result = data.toString();
    if (rTL === true) {
        for (var i = result.length; i < fieldLength; i++)
            result = char.concat(result);
    } else {
        for (var i = result.length; i < fieldLength; i++)
            result = result.concat(char);
    }
    return result;
};

// Commands

Commands.list = {
    help: function(gameServer, split) {
        console.log("[Console] ======================== HELP ======================");
        console.log("[Console] addbot     : add bot to the server");
        console.log("[Console] kickbots   : kick a specified amount of bots");
        console.log("[Console] board      : set scoreboard text");
        console.log("[Console] Restart    : Restart server or set time till restart");
        console.log("[Console] boardreset : reset scoreboard text");
        console.log("[Console] change     : change specified settings");
        console.log("[Console] clear      : clear console output");
        console.log("[Console] color      : set cell(s) color by client ID");
        console.log("[Console] exit       : stop the server");
        console.log("[Console] food       : spawn food at specified Location");
        console.log("[Console] spawnmass  : sets players spawn mass");
        console.log("[Console] gamemode   : change server gamemode");
        console.log("[Console] kick       : kick player or bot by client ID");
        console.log("[Console] kill       : kill cell(s) by client ID");
        console.log("[Console] killall    : kill everyone");
        console.log("[Console] mass       : set cell(s) mass by client ID");
        console.log("[Console] name       : change cell(s) name by client ID");
        console.log("[Console] playerlist : get list of players and bots");
        console.log("[Console] pause      : pause game , freeze all cells");
        console.log("[Console] reload     : reload config");
        console.log("[Console] status     : get server status");
        console.log("[Console] virus      : spawn virus at a specified Location");
        console.log("[Console] Merge      : Forces that player to merge");
        console.log("[Console] Killbots   : Kills bots");
        console.log("[Console] Ban        : Bans an IP and senda a msg saying that person was banned");
        console.log("[Console] Banlist    : Lists banned IPs");
        console.log("[Console] Clearban   : Resets Ban list");
        console.log("[Console] Split      : Splits a player");
        console.log("[Console] Colortext  : changes text style");
        console.log("[Console] Explode    : Explodes a player");
        console.log("[Console] ====================================================");
    },

    explode: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker; // Set color
                for (var i = 0; i < client.cells.length; i++) {
                    var cell = client.cells[i];
                    while (cell.mass > 10) {
                        cell.mass -= gameServer.config.ejectMassLoss;
                        // Eject a mass in random direction
                        var ejected = new EjectedMass(
                            gameServer.getNextNodeId(),
                            null, {
                                x: cell.position.x,
                                y: cell.position.y
                            },
                            gameServer.config.ejectMass
                        );
                        ejected.setAngle(6.28 * Math.random()); // Random angle [0, 2 * pi)
                        ejected.setMoveEngineData(
                            Math.random() * gameServer.config.ejectSpeed,
                            35,
                            0.5 + 0.4 * Math.random()
                        );
                        ejected.setColor(cell.getColor());
                        gameServer.addNode(ejected);
                        gameServer.setAsMovingNode(ejected);
                    }
                    cell.mass = 10;
                }

            }
        }
    },
    colortext: function(gameServer, split) {
        if (split[1]) var c = split[1].toLowerCase();
        else var c = "";
        if (c == "red") {
            console.log("\x1b[31mText is now Red");
            gameServer.red = true;
        } else if (c == "green") {
            console.log("\x1b[32mText is now Green");
            gameServer.green = true;
        } else if (c == "blue") {
            console.log("\x1b[34mText is now Blue");
            gameServer.blue = true;
        } else if (c == "yellow") {
            console.log("\x1b[33mText is now Yellow");
            gameServer.yellow = true;
        } else if (c == "reset") {
            console.log("\x1b[0mText is now Reset");
            gameServer.red = false;
            gameServer.green = false;
            gameServer.blue = false;
            gameServer.yellow = false;
            gameServer.dim = false;
            gameServer.bold = false;
            gameServer.white = false;
        } else if (c == "bold") {
            console.log("\x1b[1mText is now Bold");
            gameServer.bold = true;
        } else if (c == "white") {
            console.log("\x1b[37mText is now White");
            gameServer.white = true;
        } else if (c == "dim") {
            console.log("\x1b[2mText is now Dim");
            gameServer.dim = true;
        } else if (c == "help") {
            console.log("----- Colortext Help -----");
            console.log("Red");
            console.log("Green");
            console.log("Blue");
            console.log("White");
            console.log("Yellow");
            console.log("Dim");
            console.log("Bold");
            console.log("Reset");
        } else {
            console.log("Please specify a valid style or do Colortext help for a list");
        }
    },
    unban: function(gameServer, split) {
        var ip = split[1]; // Get ip
        var index = gameServer.banned.indexOf(ip);
        if (index > -1) {
            gameServer.banned.splice(index, 1);
            console.log("Unbanned " + ip);
            if (gameServer.config.autobanrecord == 1) {
                var oldstring = "";
                var string = "";
                for (var i in gameServer.banned) {
                    var banned = gameServer.banned[i];
                    if (banned != "") {

                        string = oldstring + "\n" + banned;
                        oldstring = string;
                    }
                }


                fs.writeFileSync('./banned.txt', string);
            }
        } else {
            console.log("That IP is not banned");
        }
    },
    split: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        var count = parseInt(split[2]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }
        if (isNaN(count)) {
            console.log("[Console] Since you did not specify split count, We will split the person into 16 cells");
            count = 4;
        }
        if (count > gameServer.config.playerMaxCells) {
            console.log("[Console]" + amount + "Is greater than the max cells, split into the max cell amount");
            count = gameServer.config.playerMaxCells;
        }
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                for (var i = 0; i < count; i++) {
                    gameServer.splitCells(client);
                }
                console.log("[Console] Forced " + client.name + " to split cells");
                break;
            }
        }
    },
    resetvirus: function(gameServer, split) {
        gameServer.troll = [];
        console.log("[Console] Turned any Special Viruses (from op's) Into normal ones");

    },
    ban: function(gameServer, split) {
        // Get ip
        var ip = split[1];
        if (split[1] == "record") {
            if (split[2] = "clear") {
                fs.writeFileSync('./banned.txt', "");
                console.log("[Console] Cleared recorded banlist");
                return;
            }

            var oldstring = "";
            var string = "";
            for (var i in gameServer.banned) {
                var banned = gameServer.banned[i];
                if (banned != "") {

                    string = oldstring + "\n" + banned;
                    oldstring = string;
                }
            }

            fs.writeFileSync('./banned.txt', string);
            console.log("[Console] Successfully recorded banlist");
            return;
        }
        if (gameServer.whlist.indexOf(ip) == -1) {
            if (gameServer.banned.indexOf(ip) == -1) {
                gameServer.banned.push(ip);
                console.log("[Console] Added " + ip + " to the banlist.");
                // Remove from game
                for (var i in gameServer.clients) {
                    var c = gameServer.clients[i];
                    if (!c.remoteAddress) {
                        continue;
                    }
                    if (c.remoteAddress == ip) {

                        //this.socket.close();
                        c.close(); // Kick out
                    }
                }
                if (gameServer.config.rememberBannedPlayers == 1) 
				{

                    var oldstring = fs.readFileSync("./banned.txt", "utf8");
                    var string = "";
                    for (var i in gameServer.banned) {
                        var banned = gameServer.banned[i];
                        if (banned != "") string = oldstring + "\n" + banned;
                    }

                    fs.writeFileSync('./banned.txt', string);
                }
            } else {
                console.log("[Console] That IP is already banned");
            }
        } else {

            console.log("[Console] That IP is whitelisted");
        }
    },
    banlist: function(gameServer, split) {
        console.log("[Console] Current banned IPs (" + gameServer.banned.length + ")");
        for (var i in gameServer.banned) {
            console.log(gameServer.banned[i]);
        }
    },
    clearban: function(gameServer, split) {
        console.log("[Console] Cleared " + gameServer.banned.length + " IP's");
        gameServer.banned = [];
        if (gameServer.config.autobanrecord == 1) {


            fs.writeFileSync('./banned.txt', "");
        }
    },
    spawnmass: function(gameServer, split) {
        var id = parseInt(split[1]);
        var mass = parseInt(split[2]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }
        if (isNaN(mass)) {
            console.log("[Console] Please specify a valid mass!");
            return;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;

                client.spawnmass = mass;

            }
        }
        console.log("[Console] Player " + id + " now spawns with " + mass + " Mass");
    },
    speed: function(gameServer, split) {
        var id = parseInt(split[1]);
        var speed = parseInt(split[2]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }
        if (isNaN(speed)) {
            console.log("[Console] Please specify a valid speed!");
            return;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;

                client.customspeed = speed;

            }
        }
        console.log("[Console] Player " + id + "'s base speed is now " + speed);
    },
    merge: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }

        // Sets merge time
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.norecombine = false;
                client.recombineinstant = true;

                console.log("[Console] Forced " + client.name + " to merge cells");
                break;
            }
        }
    },
    addbot: function(gameServer, split) {
        var add = parseInt(split[1]);
        if (isNaN(add)) {
            add = 1; // Adds 1 bot if user doesnt specify a number
        }
        gameServer.livestage = 2;
        gameServer.liveticks = 0;
        for (var i = 0; i < add; i++) {
            gameServer.bots.addBot();
            gameServer.sbo++;
        }
        console.log("[Console] Added " + add + " player bots");
    },
    kickbots: function(gameServer, split) {
        var toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) {
            toRemove = -1; // Kick all bots if user doesnt specify a number
        }

        var removed = 0;
        var i = 0;
        while (i < gameServer.clients.length && removed != toRemove) {
            if (typeof gameServer.clients[i].remoteAddress == 'undefined') { // if client i is a bot kick him
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                }
                client.socket.close();
                removed++;
                gameServer.sbo--;
            } else
                i++;
        }
        if (toRemove == -1)
            console.log("[Console] Kicked all bots (" + removed + ")");
        else if (toRemove == removed)
            console.log("[Console] Kicked " + toRemove + " bots");
        else
            console.log("[Console] Only " + removed + " bots could be kicked");
    },
    killbots: function(gameServer, split) {
        var toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) {
            toRemove = -1; // Kick all bots if user doesnt specify a number
        }

        var removed = 0;
        var i = 0;
        while (i < gameServer.clients.length && removed != toRemove) {
            if (typeof gameServer.clients[i].remoteAddress == 'undefined') { // if client i is a bot kick him
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                }
                removed++;
                i++;
            } else
                i++;
        }
        if (toRemove == -1)
            console.log("[Console] Killed all bots (" + removed + ")");
        else if (toRemove == removed)
            console.log("[Console] Killed " + toRemove + " bots");
        else
            console.log("[Console] Only " + removed + " bots could be killed");
    },
    board: function(gameServer, split) {
        var newLB = [];
        for (var i = 1; i < split.length; i++) {
            newLB[i - 1] = split[i];
        }

        // Clears the update leaderboard function and replaces it with our own
        gameServer.lleaderboard = false;
        gameServer.gameMode.packetLB = 48;
        gameServer.gameMode.specByLeaderboard = false;
        gameServer.gameMode.updateLB = function(gameServer) {
            gameServer.leaderboard = newLB
        };
        console.log("[Console] Successfully changed leaderboard values");
    },
    boardreset: function(gameServer) {
        // Gets the current gamemode
        var gm = GameMode.get(gameServer.gameMode.ID);

        // Replace functions
        gameServer.gameMode.packetLB = gm.packetLB;
        gameServer.gameMode.updateLB = gm.updateLB;
        console.log("[Console] Successfully reset leaderboard");
        setTimeout(function() {
            gameServer.lleaderboard = true;
        }, 2000);
    },
    change: function(gameServer, split) {
        var key = split[1];
        var value = split[2];

        // Check if int/float
        if (value.indexOf('.') != -1) {
            value = parseFloat(value);
        } else {
            value = parseInt(value);
        }

        if (typeof gameServer.config[key] != 'undefined') {
            gameServer.config[key] = value;
            console.log("[Console] Set " + key + " to " + value);
        } else {
            console.log("[Console] Invalid config value");
        }
    },
    clear: function() {
        process.stdout.write("\u001b[2J\u001b[0;0H");
    },
    color: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }

        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2]), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3]), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4]), 255), 0);

        // Sets color to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.setColor(color); // Set color
                for (var j in client.cells) {
                    client.cells[j].setColor(color);
                }
                break;
            }
        }
    },
    exit: function(gameServer, split) {

        console.log("\x1b[0m[Console] Closing server...");
        gameServer.socketServer.close();
        process.exit(1);
    },
    restart: function(gameServer, split) {
        var time = split[1];
        if (isNaN(time) || time < 1) {

            console.log("\x1b[0m[Console] Restarting server...");
            gameServer.socketServer.close();
            process.exit(3);
        } else {
            console.log("Server Restarting in " + time + " minutes!");
            setTimeout(function() {
                var newLB = [];
                newLB[0] = "Server Restarting";
                newLB[1] = "In 1 Minute";
                this.lleaderboard = false;

                // Clears the update leaderboard function and replaces it with our own
                gameServer.gameMode.packetLB = 48;
                gameServer.gameMode.specByLeaderboard = false;
                gameServer.gameMode.updateLB = function(gameServer) {
                    gameServer.leaderboard = newLB
                };
                console.log("The Server is Restarting in 1 Minute");
                setTimeout(function() {
                    var gm = GameMode.get(gameServer.gameMode.ID);

                    // Replace functions
                    gameServer.gameMode.packetLB = gm.packetLB;
                    gameServer.gameMode.updateLB = gm.updateLB;
                    setTimeout(function() {
                        gameServer.lleaderboard = true;
                    }, 2000);
                }, 14000);

                setTimeout(function() {
                    console.log("\x1b[0m[Console] Restarting server...");
                    gameServer.socketServer.close();
                    process.exit(3);
                }, 60000);
            }, (time * 60000) - 60000);

        }
    },
    food: function(gameServer, split) {
        var pos = {
            x: parseInt(split[1]),
            y: parseInt(split[2])
        };
        var mass = parseInt(split[3]);

        // Make sure the input values are numbers
        if (isNaN(pos.x) || isNaN(pos.y)) {
            console.log("[Console] Invalid coordinates");
            return;
        }

        if (isNaN(mass)) {
            mass = gameServer.config.foodStartMass;
        }

        // Spawn
        var f = new Entity.Food(gameServer.getNextNodeId(), null, pos, mass, gameServer);
        f.setColor(gameServer.getRandomColor());
        gameServer.addNode(f);
        gameServer.currentFood++;
        console.log("[Console] Spawned 1 food cell at (" + pos.x + " , " + pos.y + ")");
    },
    gamemode: function(gameServer, split) {
        try {
            var n = parseInt(split[1]);
            var gm = GameMode.get(n); // If there is an invalid gamemode, the function will exit
            gameServer.gameMode.onChange(gameServer); // Reverts the changes of the old gamemode
            gameServer.gameMode = gm; // Apply new gamemode
            gameServer.gameMode.onServerInit(gameServer); // Resets the server
            console.log("[Game] Changed game mode to " + gameServer.gameMode.name);
        } catch (e) {
            console.log("[Console] Invalid game mode selected");
        }
    },
    kick: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                }
                if (client.socket.remoteAddress) {
                    client.nospawn = true;
                } else {
                    client.socket.close();
                }
                console.log("[Console] Kicked " + client.name);
                break;
            }
        }
    },
    kill: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }

        var count = 0;
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                    count++;
                }

                console.log("[Console] Removed " + count + " cells");
                break;
            }
        }
    },
    killall: function(gameServer, split) {
        var count = 0;
        var len = gameServer.nodesPlayer.length;
        for (var i = 0; i < len; i++) {
            gameServer.removeNode(gameServer.nodesPlayer[0]);
            count++;
        }
        console.log("[Console] Removed " + count + " cells");
    },
    mass: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }

        var amount = Math.max(parseInt(split[2]), 10);
        if (isNaN(amount)) {
            console.log("[Console] Please specify a valid number");
            return;
        }

        // Sets mass to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                for (var j in client.cells) {
                    client.cells[j].mass = amount;
                }

                console.log("[Console] Set mass of " + client.name + " to " + amount);
                break;
            }
        }
    },
    name: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("[Console] Please specify a valid player ID!");
            return;
        }

        var name = split.slice(2, split.length).join(' ');
        if (typeof name == 'undefined') {
            console.log("[Console] Please type a valid name");
            return;
        }
        var premium = "";
        if (name.substr(0, 1) == "<") {
            // Premium Skin
            var n = name.indexOf(">");
            if (n != -1) {

                premium = '%' + name.substr(1, n - 1);
                for (var i in gameServer.skinshortcut) {
                    if (!gameServer.skinshortcut[i] || !gameServer.skin[i]) {
                        continue;
                    }
                    if (name.substr(1, n - 1) == gameServer.skinshortcut[i]) {
                        premium = gameServer.skin[i];
                        break;
                    }

                }
                name = name.substr(n + 1);

            }
        } else if (name.substr(0, 1) == "[") {
            // Premium Skin
            var n = name.indexOf("]");
            if (n != -1) {

                premium = ':http://' + name.substr(1, n - 1);
                name = name.substr(n + 1);
            }
        }

        // Change name
        for (var i = 0; i < gameServer.clients.length; i++) {
            var client = gameServer.clients[i].playerTracker;

            if (client.pID == id) {
                if (premium) {
                    client.premium = premium;
                    console.log("[Console] Changing their skin to " + premium);
                }
                if (name.length > 0) {
                    console.log("[Console] Changing " + client.name + " to " + name);
                    client.name = name;
                }
                return;
            }
        }

        // Error
        console.log("[Console] Player " + id + " was not found");
    },
    playerlist: function(gameServer, split) {
        console.log("[Console] Showing " + gameServer.clients.length + " players: ");
        console.log(" ID         | IP              | " + fillChar('NICK', ' ', gameServer.config.playerMaxNickLength) + " | CELLS | SCORE  | POSITION    "); // Fill space
        console.log(fillChar(' ', '-', ' ID         | IP              |  | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength));
        for (var i = 0; i < gameServer.clients.length; i++) {
            var client = gameServer.clients[i].playerTracker;

            // ID with 3 digits length
            var id = fillChar((client.pID), ' ', 10, true);

            // Get ip (15 digits length)
            var ip = "BOT";
            if (typeof gameServer.clients[i].remoteAddress != 'undefined') {
                ip = gameServer.clients[i].remoteAddress;
            }
            ip = fillChar(ip, ' ', 15);

            // Get name and data
            var nick = '',
                cells = '',
                score = '',
                position = '',
                data = '';
            if (client.spectate) {
                try {
                    // Get spectated player
                    if (gameServer.getMode().specByLeaderboard) { // Get spec type
                        nick = gameServer.leaderboard[client.spectatedPlayer].name;
                    } else {
                        nick = gameServer.clients[client.spectatedPlayer].playerTracker.name;
                    }
                } catch (e) {
                    // Specating nobody
                    nick = "";
                }
                nick = (nick == "") ? "An unnamed cell" : nick;
                data = fillChar("SPECTATING: " + nick, '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                console.log(" " + id + " | " + ip + " | " + data);
            } else if (client.cells.length > 0) {
                nick = fillChar((!client.name || client.name == "") ? "An unnamed cell" : client.name, ' ', gameServer.config.playerMaxNickLength);
                cells = fillChar(client.cells.length, ' ', 5, true);
                score = fillChar(client.getScore(true), ' ', 6, true);
                position = fillChar(client.centerPos.x >> 0, ' ', 5, true) + ', ' + fillChar(client.centerPos.y >> 0, ' ', 5, true);
                console.log(" " + id + " | " + ip + " | " + nick + " | " + cells + " | " + score + " | " + position);
            } else {
                // No cells = dead player or in-menu
                data = fillChar('DEAD OR NOT PLAYING', '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                console.log(" " + id + " | " + ip + " | " + data);
            }
        }
    },
    pause: function(gameServer, split) {
        gameServer.run = !gameServer.run; // Switches the pause state
        if (!gameServer.run) {
            gameServer.overideauto = true;
        } else {
            gameServer.overideauto = false;
        }

        var s = gameServer.run ? "Unpaused" : "Paused";
        console.log("[Console] " + s + " the game.");
    },
    reload: function(gameServer) {
        gameServer.loadConfig();

        var loadskins = fs.readFileSync("./customskins.txt", "utf8").split(/[\r\n]+/).filter(function(x) {
            return x != ''; // filter empty names
        });

        for (var i in loadskins) {
            var custom = loadskins[i].split(" ");
            gameServer.skinshortcut[i] = custom[0];
            gameServer.skin[i] = custom[1];
        }
        console.log("[Console] Reloaded the config file successfully");
    },
    status: function(gameServer, split) {
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if ('_socket' in gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        //
        console.log("[Console] Connected players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnections);
        console.log("[Console] Players: " + humans + " Bots: " + bots);
        console.log("[Console] Server has been running for " + process.uptime() + " seconds.");
        console.log("[Console] Current memory usage: " + process.memoryUsage().heapUsed / 1000 + "/" + process.memoryUsage().heapTotal / 1000 + " kb");
        console.log("[Console] Current game mode: " + gameServer.gameMode.name);
    },
    virus: function(gameServer, split) {
        var pos = {
            x: parseInt(split[1]),
            y: parseInt(split[2])
        };
        var mass = parseInt(split[3]);

        // Make sure the input values are numbers
        if (isNaN(pos.x) || isNaN(pos.y)) {
            console.log("[Console] Invalid coordinates");
            return;
        }
        // If the virus mass was not specified, spawn it with the default mass value.
        if (isNaN(mass)) {
            mass = gameServer.config.virusStartMass;
        }

        // Spawn
        var v = new Entity.Virus(gameServer.getNextNodeId(), null, pos, mass);
        gameServer.addNode(v);
        console.log("[Console] Spawned 1 virus at coordinates (" + pos.x + " , " + pos.y + ") with a mass of " + mass + " ");
    },
};
