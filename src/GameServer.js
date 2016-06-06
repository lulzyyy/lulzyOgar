// Library imports
var WebSocket = require('ws');
var http = require('http');
// The fs sync functions are only called during server startup
var fs = require("fs");
var ini = require('./modules/ini.js');
var EOL = require('os').EOL;
var os = require('os');
// Project imports
var Packet = require('./packet');
var PlayerTracker = require('./PlayerTracker');
var PacketHandler = require('./PacketHandler');
var Entity = require('./entity');
var Cell = require('./entity/Cell.js');
var Gamemode = require('./gamemodes');
var BotLoader = require('./ai/BotLoader');
var minionLoader = require('./ai/minionLoader');
var Logger = require('./modules/log');
var sys = require('util');

// GameServer implementation
function GameServer() {
    this.skinshortcut = [];
    this.gtick = 0;
    this.randomNames = [];
    this.uv = "";
    this.highscores;
    this.skin = [];
    this.opbyip = [];
    this.sbo = 1;
    this.ipCounts = [];
    this.minionleader;
    this.version = "11.8.5";
    this.rnodes = [];
    this.destroym = false;
    this.lleaderboard = false;
    this.topscore = 50;
    this.topusername = "None";
    this.red = false;
    this.nospawn = [];
    this.green = false;
    this.rrticks = 0;
    this.minion = false;
    this.miniontarget = {
        x: 0,
        y: 0
    };
    this.blue = false;
    this.bold = false;
    this.white = false;
    this.dltick = 0;
    this.mfre = false; // If true, mouse filter is initialised
    this.dim = false;
    this.yellow = false;
    this.resticks = 0;
    this.spawnv = 1;
    this.lctick = 0;
    this.overideauto = false;
    this.livestage = 0;
    this.pop = [];
    this.troll = [];
    this.firstl = true;
    this.liveticks = 0;
    this.run = true;
    this.op = [];
    this.whlist = [];
    this.pmsg = 0;
    this.pfmsg = 0;
    this.opc = [];
    this.oppname = [];
    this.opname = [];
    this.lastNodeId = 2;
    this.lastPlayerId = 1;
    this.clients = [];
    this.oldtopscores = {
        score: 100,
        name: "none"
    };
    this.nodes = [];
    this.nodesVirus = []; // Virus nodes
    this.nodesEjected = []; // Ejected mass nodes
    this.nodesPlayer = []; // Nodes controlled by players
    this.banned = [];
    this.currentFood = 0;
    this.movingNodes = []; // For move engine
    this.leaderboard = []; // leaderboard
    this.lb_packet = new ArrayBuffer(0); // Leaderboard packet
    this.largestClient;
	this.memoryLeft = 0;
	this.memoryUsageTick = 0;

    this.bots = new BotLoader(this);
    this.log = new Logger();
    this.minions = new minionLoader(this);
    this.commands; // Command handler

    // Main loop tick
    this.time = +new Date;
    this.startTime = this.time;
    this.tick = 0; // 1 second ticks of mainLoop
    this.tickMain = 0; // 50 ms ticks, 20 of these = 1 leaderboard update
    this.tickSpawn = 0; // Used with spawning food
    this.mainLoopBind = this.mainLoop.bind(this);
	this.actualPlayersUpdateTick = 0;
	this.updatelbtick = 0;
	//this.resetBanned = 0;
	this.uptime = 0;

	this.isoCountries = {
    'AF' : 'Afghanistan',
    'AX' : 'Aland Islands',
    'AL' : 'Albania',
    'DZ' : 'Algeria',
    'AS' : 'American Samoa',
    'AD' : 'Andorra',
    'AO' : 'Angola',
    'AI' : 'Anguilla',
    'AQ' : 'Antarctica',
    'AG' : 'Antigua And Barbuda',
    'AR' : 'Argentina',
    'AM' : 'Armenia',
    'AW' : 'Aruba',
    'AU' : 'Australia',
    'AT' : 'Austria',
    'AZ' : 'Azerbaijan',
    'BS' : 'Bahamas',
    'BH' : 'Bahrain',
    'BD' : 'Bangladesh',
    'BB' : 'Barbados',
    'BY' : 'Belarus',
    'BE' : 'Belgium',
    'BZ' : 'Belize',
    'BJ' : 'Benin',
    'BM' : 'Bermuda',
    'BT' : 'Bhutan',
    'BO' : 'Bolivia',
    'BA' : 'Bosnia And Herzegovina',
    'BW' : 'Botswana',
    'BV' : 'Bouvet Island',
    'BR' : 'Brazil',
    'IO' : 'British Indian Ocean Territory',
    'BN' : 'Brunei Darussalam',
    'BG' : 'Bulgaria',
    'BF' : 'Burkina Faso',
    'BI' : 'Burundi',
    'KH' : 'Cambodia',
    'CM' : 'Cameroon',
    'CA' : 'Canada',
    'CV' : 'Cape Verde',
    'KY' : 'Cayman Islands',
    'CF' : 'Central African Republic',
    'TD' : 'Chad',
    'CL' : 'Chile',
    'CN' : 'China',
    'CX' : 'Christmas Island',
    'CC' : 'Cocos (Keeling) Islands',
    'CO' : 'Colombia',
    'KM' : 'Comoros',
    'CG' : 'Congo',
    'CD' : 'Congo, Democratic Republic',
    'CK' : 'Cook Islands',
    'CR' : 'Costa Rica',
    'CI' : 'Cote D\'Ivoire',
    'HR' : 'Croatia',
    'CU' : 'Cuba',
    'CY' : 'Cyprus',
    'CZ' : 'Czech Republic',
    'DK' : 'Denmark',
    'DJ' : 'Djibouti',
    'DM' : 'Dominica',
    'DO' : 'Dominican Republic',
    'EC' : 'Ecuador',
    'EG' : 'Egypt',
    'SV' : 'El Salvador',
    'GQ' : 'Equatorial Guinea',
    'ER' : 'Eritrea',
    'EE' : 'Estonia',
    'ET' : 'Ethiopia',
    'FK' : 'Falkland Islands (Malvinas)',
    'FO' : 'Faroe Islands',
    'FJ' : 'Fiji',
    'FI' : 'Finland',
    'FR' : 'France',
    'GF' : 'French Guiana',
    'PF' : 'French Polynesia',
    'TF' : 'French Southern Territories',
    'GA' : 'Gabon',
    'GM' : 'Gambia',
    'GE' : 'Georgia',
    'DE' : 'Germany',
    'GH' : 'Ghana',
    'GI' : 'Gibraltar',
    'GR' : 'Greece',
    'GL' : 'Greenland',
    'GD' : 'Grenada',
    'GP' : 'Guadeloupe',
    'GU' : 'Guam',
    'GT' : 'Guatemala',
    'GG' : 'Guernsey',
    'GN' : 'Guinea',
    'GW' : 'Guinea-Bissau',
    'GY' : 'Guyana',
    'HT' : 'Haiti',
    'HM' : 'Heard Island & Mcdonald Islands',
    'VA' : 'Holy See (Vatican City State)',
    'HN' : 'Honduras',
    'HK' : 'Hong Kong',
    'HU' : 'Hungary',
    'IS' : 'Iceland',
    'IN' : 'India',
    'ID' : 'Indonesia',
    'IR' : 'Iran, Islamic Republic Of',
    'IQ' : 'Iraq',
    'IE' : 'Ireland',
    'IM' : 'Isle Of Man',
    'IL' : 'Israel',
    'IT' : 'Italy',
    'JM' : 'Jamaica',
    'JP' : 'Japan',
    'JE' : 'Jersey',
    'JO' : 'Jordan',
    'KZ' : 'Kazakhstan',
    'KE' : 'Kenya',
    'KI' : 'Kiribati',
    'KR' : 'Korea',
    'KW' : 'Kuwait',
    'KG' : 'Kyrgyzstan',
    'LA' : 'Lao People\'s Democratic Republic',
    'LV' : 'Latvia',
    'LB' : 'Lebanon',
    'LS' : 'Lesotho',
    'LR' : 'Liberia',
    'LY' : 'Libyan Arab Jamahiriya',
    'LI' : 'Liechtenstein',
    'LT' : 'Lithuania',
    'LU' : 'Luxembourg',
    'MO' : 'Macao',
    'MK' : 'Macedonia',
    'MG' : 'Madagascar',
    'MW' : 'Malawi',
    'MY' : 'Malaysia',
    'MV' : 'Maldives',
    'ML' : 'Mali',
    'MT' : 'Malta',
    'MH' : 'Marshall Islands',
    'MQ' : 'Martinique',
    'MR' : 'Mauritania',
    'MU' : 'Mauritius',
    'YT' : 'Mayotte',
    'MX' : 'Mexico',
    'FM' : 'Micronesia, Federated States Of',
    'MD' : 'Moldova',
    'MC' : 'Monaco',
    'MN' : 'Mongolia',
    'ME' : 'Montenegro',
    'MS' : 'Montserrat',
    'MA' : 'Morocco',
    'MZ' : 'Mozambique',
    'MM' : 'Myanmar',
    'NA' : 'Namibia',
    'NR' : 'Nauru',
    'NP' : 'Nepal',
    'NL' : 'Netherlands',
    'AN' : 'Netherlands Antilles',
    'NC' : 'New Caledonia',
    'NZ' : 'New Zealand',
    'NI' : 'Nicaragua',
    'NE' : 'Niger',
    'NG' : 'Nigeria',
    'NU' : 'Niue',
    'NF' : 'Norfolk Island',
    'MP' : 'Northern Mariana Islands',
    'NO' : 'Norway',
    'OM' : 'Oman',
    'PK' : 'Pakistan',
    'PW' : 'Palau',
    'PS' : 'Palestinian Territory, Occupied',
    'PA' : 'Panama',
    'PG' : 'Papua New Guinea',
    'PY' : 'Paraguay',
    'PE' : 'Peru',
    'PH' : 'Philippines',
    'PN' : 'Pitcairn',
    'PL' : 'Poland',
    'PT' : 'Portugal',
    'PR' : 'Puerto Rico',
    'QA' : 'Qatar',
    'RE' : 'Reunion',
    'RO' : 'Romania',
    'RU' : 'Russian Federation',
    'RW' : 'Rwanda',
    'BL' : 'Saint Barthelemy',
    'SH' : 'Saint Helena',
    'KN' : 'Saint Kitts And Nevis',
    'LC' : 'Saint Lucia',
    'MF' : 'Saint Martin',
    'PM' : 'Saint Pierre And Miquelon',
    'VC' : 'Saint Vincent And Grenadines',
    'WS' : 'Samoa',
    'SM' : 'San Marino',
    'ST' : 'Sao Tome And Principe',
    'SA' : 'Saudi Arabia',
    'SN' : 'Senegal',
    'RS' : 'Serbia',
    'SC' : 'Seychelles',
    'SL' : 'Sierra Leone',
    'SG' : 'Singapore',
    'SK' : 'Slovakia',
    'SI' : 'Slovenia',
    'SB' : 'Solomon Islands',
    'SO' : 'Somalia',
    'ZA' : 'South Africa',
    'GS' : 'South Georgia And Sandwich Isl.',
    'ES' : 'Spain',
    'LK' : 'Sri Lanka',
    'SD' : 'Sudan',
    'SR' : 'Suriname',
    'SJ' : 'Svalbard And Jan Mayen',
    'SZ' : 'Swaziland',
    'SE' : 'Sweden',
    'CH' : 'Switzerland',
    'SY' : 'Syrian Arab Republic',
    'TW' : 'Taiwan',
    'TJ' : 'Tajikistan',
    'TZ' : 'Tanzania',
    'TH' : 'Thailand',
    'TL' : 'Timor-Leste',
    'TG' : 'Togo',
    'TK' : 'Tokelau',
    'TO' : 'Tonga',
    'TT' : 'Trinidad And Tobago',
    'TN' : 'Tunisia',
    'TR' : 'Turkey',
    'TM' : 'Turkmenistan',
    'TC' : 'Turks And Caicos Islands',
    'TV' : 'Tuvalu',
    'UG' : 'Uganda',
    'UA' : 'Ukraine',
    'AE' : 'United Arab Emirates',
    'GB' : 'United Kingdom',
    'US' : 'United States',
    'UM' : 'United States Outlying Islands',
    'UY' : 'Uruguay',
    'UZ' : 'Uzbekistan',
    'VU' : 'Vanuatu',
    'VE' : 'Venezuela',
    'VN' : 'Viet Nam',
    'VG' : 'Virgin Islands, British',
    'VI' : 'Virgin Islands, U.S.',
    'WF' : 'Wallis And Futuna',
    'EH' : 'Western Sahara',
    'YE' : 'Yemen',
    'ZM' : 'Zambia',
    'ZW' : 'Zimbabwe'
};
	
    // Config
    this.config = { // Border - Right: X increases, Down: Y increases (as of 2015-05-20)
		showServerperfomance: 1,
		showUptime: 1,
		showPlayersCount: 1,
		showLag: 1,
		allowBots: 1,
		virusBattleMass: 8,
		virusBattleEjectSpeed: 300,
		splittedCellRestoreTicks: 10,
		turboSplitSpeed: 260,
		preventUsingMacro: 0,
		automaticMassEject: 0,
		automaticVirusBattleMassEject: 1,
		allowVirusBattle: 1,
		ejectMassDelay: 150,
		ejectVirusBattleMassDelay: 150,
		virusTypes: 1,
		virusBattleMinimumCellMass: 1000,
		allowSpawnCollision: 0,
		chatAntiSpam: 0,
		chatAntiSpamDelay: 1000,
		rememberBannedPlayers: 1,
        autoban: 0, // Auto bans a player if they are cheating
        randomEjectMassColor: 0, // 0 = off 1 = on
        ffaTimeLimit: 60, // TFFA time
        ffaMaxLB: 10, // Max leaderboard slots
        showtopscore: 0, // Shows top score (1 to enable)
        anounceDelay: 70, // Announce delay
        anounceDuration: 8, // How long the announce lasts
        vps: 0,
        ejectantispeed: 120, // Speed of ejected anti matter
        maxopvirus: 60, // Maximum amount of OP viruses
        skins: 1,
        virusmass: 15,
        virusmassloss: 18,
        ejectvirus: 0,
        playerminviruseject: 34,
        minionupdate: 10,
        splitversion: 1,
        verify: 0,
        autobanrecord: 0,
        serverScrambleMinimaps: 1,
        vchance: 5,
        viruscolorintense: 255,
        SpikedCells: 0, // Amount of spiked cells
        autopause: 1, // Auto pauses the game when there are no players (0 to turn off)
        smartbthome: 1, // Automatically sends you back to normal mode after pressing Q proceding an action (default) 2 = off (you need to press Q a lot)
        restartmin: 0, // minutes to restart
        showopactions: 0, // Notifys you of an OP using his power, (0 = Off [default]) 1 = on
        cRestoreTicks: 10, // Amount of time until the collision retores
        showbmessage: 0, // Notifys you if a banned player tried to join (0 = off [default]) 1 = on
        splitSpeed: 130, // Splitting speed
        showjlinfo: 0, // Notifys you if a player has left or joined (0 = off [default]) 1 = on
        ejectvspeed: 120, // How far an ejected virus (from w) shoots
        serverMaxConnectionsPerIp: 5, // Maximum amount of IPs per player connection
        serverMaxConnections: 64, // Maximum amount of connections to the server.
        serverPort: 443, // Server port
        botrespawn: 1,
        rainbow: 1,
        fps: 20,
        highscore: 1,
        rainbowspeed: 1,
        botupdate: 10,
        notifyupdate: 1,
        botrealnames: 0,
        smartbotspawn: 0,
        smartbspawnbase: 20,
        autoupdate: 0,
        minionavoid: 1,
        mousefilter: 1,
        borderDec: 200,
        kickspectate: 0,
        ejectbiggest: 0,
        porportional: 0,
        customskins: 1,
        botmaxsplit: 4,
        serverGamemode: 0, // Gamemode, 0 = FFA, 1 = Teams
        serverBots: 0, // Amount of player bots to spawn
        serverViewBaseX: 1024, // Base view distance of players. Warning: high values may cause lag
        serverViewBaseY: 592, // Same thing as line 77
        serverStatsPort: 88, // Port for stats server. Having a negative number will disable the stats server.
        serverStatsUpdate: 60, // Amount of seconds per update for the server stats
        serverLogLevel: 1, // Logging level of the server. 0 = No logs, 1 = Logs the console, 2 = Logs console and ip connections
        serverScrambleCoords: 1, // Toggles scrambling of coordinates. 0 = No scrambling, 1 = scrambling. Default is 1.
        borderLeft: 0, // Left border of map (Vanilla value: 0)
        borderRight: 6000, // Right border of map (Vanilla value: 11180.3398875)
        borderTop: 0, // Top border of map (Vanilla value: 0)
        borderBottom: 6000, // Bottom border of map (Vanilla value: 11180.3398875)
        liveConsole: 0, // Easiest way to get stats (1 to enable)
        anounceHighScore: 0, // Announces highscore (1 to enable)
        spawnInterval: 20, // The interval between each food cell spawn in ticks (1 tick = 50 ms)
        foodSpawnAmount: 10, // The amount of food to spawn per interval
        foodStartAmount: 100, // The starting amount of food in the map
        foodMaxAmount: 500, // Maximum food cells on the map
        foodMass: 1, // Starting food size (In mass)
        teaming: 1, // teaming or anti teaming
        foodMassGrow: 0, // Enable food mass grow ?
        playerFastDecay: 0,
        fastdecayrequire: 5000,
        FDmultiplyer: 5,
        antimatter: 1,
        merge: 1,
        mbchance: 5,
        virus: 1,
        vtime: 20,
        clientclone: 0,
        mass: 1,
        killvirus: 1,
        kickvirus: 1,
        randomnames: 0,
        trollvirus: 1,
        explodevirus: 1,
        foodMassGrowPossiblity: 50, // Chance for a food to has the ability to be self growing
        foodMassLimit: 5, // Maximum mass for a food can grow
        foodMassTimeout: 120, // The amount of interval for a food to grow its mass (in seconds)
        virusMinAmount: 10, // Minimum amount of viruses on the map.
        virusMaxAmount: 50, // Maximum amount of viruses on the map. If this amount is reached, then ejected cells will pass through viruses.
        virusStartMass: 100, // Starting virus size (In mass)
        virusFeedAmount: 7, // Amount of times you need to feed a virus to shoot it
        motherCellMassProtection: 1, // Stopping mothercells from being too big (0 to disable)
        motherCellMaxMass: 10000, // Max mass of a mothercell
        ejectMass: 12, // Mass of ejected cells
        ejectMassCooldown: 200, // Time until a player can eject mass again
        ejectMassLoss: 16, // Mass lost when ejecting cells
        ejectSpeed: 160, // Base speed of ejected cells
        massAbsorbedPercent: 100, // Fraction of player cell's mass gained upon eating
        ejectSpawnPlayer: 50, // Chance for a player to spawn from ejected mass
        playerStartMass: 10, // Starting mass of the player cell.
        playerMaxMass: 22500, // Maximum mass a player can have
        playerMinMassEject: 32, // Mass required to eject a cell
        playerMinMassSplit: 36, // Mass required to split
        playerMaxCells: 16, // Max cells the player is allowed to have
        playerRecombineTime: 30, // Base amount of seconds before a cell is allowed to recombine
        playerMassDecayRate: .002, // Amount of mass lost per second
        playerMinMassDecay: 9, // Minimum mass for decay to occur
        playerMaxNickLength: 15, // Maximum nick length
        playerSpeed: 30, // Player base speed
        playerDisconnectTime: 60, // The amount of seconds it takes for a player cell to be removed after disconnection (If set to -1, cells are never removed)
        tourneyMaxPlayers: 12, // Maximum amount of participants for tournament style game modes
        tourneyPrepTime: 10, // Amount of ticks to wait after all players are ready (1 tick = 1000 ms)
        tourneyEndTime: 30, // Amount of ticks to wait after a player wins (1 tick = 1000 ms)
        tourneyTimeLimit: 20, // Time limit of the game, in minutes.
        tourneyAutoFill: 0, // If set to a value higher than 0, the tournament match will automatically fill up with bots after this amount of seconds
        tourneyAutoFillPlayers: 1, // The timer for filling the server with bots will not count down unless there is this amount of real players
        playerBotGrowEnabled: 1, // If 0, eating a cell with less than 17 mass while cell has over 625 wont gain any mass
		chatMaxMessageLength: 200, // Maximum message length
	};
    // Parse config
    this.loadConfig();

    // Gamemodes
    this.gameMode = Gamemode.get(this.config.serverGamemode);
}

module.exports = GameServer;

GameServer.prototype.getCountryName = function (countryCode) 
{
    if (this.isoCountries.hasOwnProperty(countryCode)) 
	{
        return this.isoCountries[countryCode];
    } 
	else 
	{
        return "Unknown";
    }
}

// get random value from low to high
GameServer.prototype.randomIntInc =  function(low, high) 
{
    return Math.floor(Math.random() * (high - low + 1) + low);
}

// get random color from whole rgb
GameServer.prototype.getRandomColorFromRGB = function()
{
	return {'r':this.randomIntInc(0,255), 'g':this.randomIntInc(0,255), 'b':this.randomIntInc(0,255)};
}

// exit server and send message to all clients (as popup window with message)
GameServer.prototype.exitserver = function(message) {
	for (var i=0; i<this.clients.length; i++)
	{
		var player = this.clients[i].playerTracker;

		if (player)
			player.socket.sendPacket(new Packet.SendAlert(message));
	}
	this.socketServer.close();
	process.exit(1);
	window.close();		
}

// Convert seconds to readalble format
GameServer.prototype.toHHMMSS = function (secs) {
    var sec_num = secs; // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

GameServer.prototype.start = function() {	
	this.memoryLeft = 95 - Math.round(process.memoryUsage().rss/1024/1024/Math.round(os.totalmem()/1024/1024)*100); // free ram memory left as percentage

    // Gamemode configurations
    this.gameMode.onServerInit(this);
    //this.masterServer();
	
    // Start the server
    if (this.config.vps == 1) {
        var port = process.env.PORT;
    } else {
        var port = this.config.serverPort;
    }
    this.socketServer = new WebSocket.Server({
        port: port,
        perMessageDeflate: false
    }, function() {
        // Spawn starting food
        this.startingFood();

        // Start Main Loop
        //setInterval(this.mainLoop.bind(this), 1);
        setImmediate(this.mainLoopBind);

        // Done
        // todo remove: var fs = require("fs"); // Import the util library

        console.log("[Game] Listening on port " + this.config.serverPort);
        //console.log("[Game] Current game mode is " + this.gameMode.name);
        Cell.spi = this.config.SpikedCells;
        Cell.virusi = this.config.viruscolorintense;
        Cell.recom = this.config.playerRecombineTime;
        if (this.config.anounceHighScore == 1) {
            var execute = this.commands["announce"];
            execute(this, "");
        }

        // Player bots (Experimental)
        if (this.config.serverBots > 0) {
            for (var i = 0; i < this.config.serverBots; i++) {
                this.bots.addBot();
            }
            console.log("[Game] Loaded " + this.config.serverBots + " player bots");
        }
        var game = this;
    }.bind(this));

    this.socketServer.on('connection', connectionEstablished.bind(this));

    // Properly handle errors because some people are too lazy to read the readme
    this.socketServer.on('error', function err(e) {
        switch (e.code) {
            case "EADDRINUSE": 
                console.log("[Error] Server could not bind to port! Please close out of Skype or change 'serverPort' in gameserver.ini to a different number.");
                process.exit(1);
				break;
            case "EACCES": 
                console.log("[Error] Please make sure you are running Ogar with root privileges.");
				process.exit(1);
                break;
            default:
                console.log("[Error] Unhandled error code: "+e.code);
				this.exitserver("SERVER CRASHED. RESTART.");
                break;
        }
       // process.exit(1);
    });

    function connectionEstablished(ws) 
	{
        function close(error) {
            var client = this.socket.playerTracker;
			
            console.log("--- Client Disconnect: " + this.socket.remoteAddress + ":" + this.socket.remotePort +" Error " + error+" ---");
            var len = this.socket.playerTracker.cells.length;
            for (var i = 0; i < len; i++) {
                var cell = this.socket.playerTracker.cells[i];

                if (!cell) {
                    continue;
                }
                cell.calcMove = function() {}; // Clear function so that the cell cant move
            }
            client.disconnect = this.server.config.playerDisconnectTime * 20;
            this.socket.sendPacket = function() {}; // Clear function so no packets are sent
        }

	   // do not disconnect banned player because he will be trying to connect causing flooding
       if (this.banned.indexOf(ws._socket.remoteAddress) != -1) // Banned
		{
			console.log("\u001B[33mClient " + ws._socket.remoteAddress + ", tried to connect but is banned!");
			ws.sendPacket(new Packet.SendAlert("You're banned."));
		}
		else if (this.clients.length >= this.config.serverMaxConnections)
		{
			console.log("\u001B[33mClient " + ws._socket.remoteAddress + ", tried to connect but server is full!");
			ws.sendPacket(new Packet.SendAlert("Server is full."));
		}
		else // player isn't banned and server isn't full so create a new client
		{
			ws.remoteAddress = ws._socket.remoteAddress;
			ws.remotePort = ws._socket.remotePort;
			console.log( "--- (" + this.clients.length + "/" + this.config.serverMaxConnections  + ") Client connect: "+ws.remoteAddress+":"+ws.remotePort+" ---");

			ws.playerTracker = new PlayerTracker(this, ws);
			ws.playerTracker.setCountry(ws._socket.remoteAddress); // set country of new player
			ws.packetHandler = new PacketHandler(this, ws);
			ws.on('message', ws.packetHandler.handleMessage.bind(ws.packetHandler));

			var bindObject = { server: this, socket: ws };
			ws.on('error', close.bind(bindObject));
			ws.on('close', close.bind(bindObject));
			this.clients.push(ws);
		}
    }
};

GameServer.prototype.getMode = function() {
    return this.gameMode;
};

GameServer.prototype.getNextNodeId = function() {
    // Resets integer
    if (this.lastNodeId > 2147483647) {
        this.lastNodeId = 1;
    }
    return this.lastNodeId++;
};
GameServer.prototype.dfr = function(path) {
    var dfr = function(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    dfr(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                dfr(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }


};
GameServer.prototype.execommand = function(command, split) {
    try {
        var execute = this.commands[command];
        execute(this, split);
    } catch (e) {

    }

};
GameServer.prototype.getNewPlayerID = function() {
    // Resets integer
    if (this.lastPlayerId > 2147483647) {
        this.lastPlayerId = 1;
    }
    return this.lastPlayerId++;
};

// get random position +- 200 to prevent spawning viruses and food at border
GameServer.prototype.getRandomPosition = function() {
    return {
        x: Math.floor(Math.random() * ((this.config.borderRight-200) - (this.config.borderLeft+200))) + (this.config.borderLeft+200),
        y: Math.floor(Math.random() * ((this.config.borderBottom-200) - (this.config.borderTop+200))) + (this.config.borderTop+200)
    };
};

GameServer.prototype.getRandomColor = function() {
    var colorRGB = [0xFF, 0x07, ((Math.random() * (256 - 7)) >> 0) + 7];
    colorRGB.sort(function () { return 0.5 - Math.random() });

    return {
        r: colorRGB[0],
        b: colorRGB[1],
        g: colorRGB[2]
    };
};

GameServer.prototype.getRandomSpawn = function() {
    // Random spawns for players
    var pos;

    if (this.currentFood > 0) {
        // Spawn from food
        var node;
        for (var i = (this.nodes.length - 1); i > -1; i--) {
            // Find random food
            node = this.nodes[i];

            if (!node || node.inRange) {
                // Skip if food is about to be eaten/undefined
                continue;
            }

            if (node.getType() == 1) {
                pos = {
                    x: node.position.x,
                    y: node.position.y
                };
                this.removeNode(node);
                break;
            }
        }
    }

    if (!pos) {
        // Get random spawn if no food cell is found
        pos = this.getRandomPosition();
    }

    return pos;
};

GameServer.prototype.addNode = function(node) {
    this.nodes.push(node);

    // Adds to the owning player's screen
    if (node.owner) {
        node.setColor(node.owner.color);
        node.owner.cells.push(node);
        node.owner.socket.sendPacket(new Packet.AddNode(node));
    }

    // Special on-add actions
    node.onAdd(this);

    // Add to visible nodes
    for (var i = 0; i < this.clients.length; i++) {
        var client = this.clients[i].playerTracker;
        if (!client) {
            continue;
        }

        // client.nodeAdditionQueue is only used by human players, not bots
        // for bots it just gets collected forever, using ever-increasing amounts of memory
        if ('_socket' in client.socket && node.visibleCheck(client.viewBox, client.centerPos)) {
            client.nodeAdditionQueue.push(node);
        }
    }
};

GameServer.prototype.removeNode = function(node) {
    // Remove from main nodes list
    var index = this.nodes.indexOf(node);
    if (index != -1) {
        this.nodes.splice(index, 1);
    }

    // Remove from moving cells list
    index = this.movingNodes.indexOf(node);
    if (index != -1) {
        this.movingNodes.splice(index, 1);
    }

    // Special on-remove actions
    node.onRemove(this);

    // Animation when eating
    for (var i = 0; i < this.clients.length; i++) {
        var client = this.clients[i].playerTracker;
        if (!client) {
            continue;
        }

        // Remove from client
        client.nodeDestroyQueue.push(node);
    }
};

GameServer.prototype.cellTick = function() {
    // Move cells
    this.updateMoveEngine();
};

GameServer.prototype.spawnTick = function() {
    // Spawn food
    this.tickSpawn++;
    if (this.tickSpawn >= this.config.spawnInterval) {
        this.updateFood(); // Spawn food
        this.virusCheck(); // Spawn viruses

        this.tickSpawn = 0; // Reset
    }
};

GameServer.prototype.gamemodeTick = function() {
    // Gamemode tick
    var t = this.config.fps / 20;
    if (this.gtick >= Math.round(t) - 1) {
        this.gameMode.onTick(this);
        this.gtick = 0;
    } else {
        this.gtick++;
    }

};

GameServer.prototype.cellUpdateTick = function() {
    // Update cells
    this.updateCells();
};

GameServer.prototype.mainLoop = function() {
    // Timer
    var local = new Date();
    this.tick += (local - this.time);
    this.time = local;
	
    if (this.tick >= 1000 / this.config.fps) {
        // Loop main functions
        if (this.run) {
            (this.cellTick(), 0);
            (this.spawnTick(), 0);
            (this.gamemodeTick(), 0);
        }

        // Update the client's maps
        setTimeout(this.cellUpdateTick(), 0);
		this.updateClients();
        // Update cells/leaderboard loop
        this.tickMain++;
        var count = 0;

        if (this.tickMain >= this.config.fps) 
		{ // 1 Second	
			this.uptime++;
			
            if (this.memoryUsageTick == 10)
			{
				this.memoryLeft = 95 - Math.round(process.memoryUsage().rss/1024/1024/Math.round(os.totalmem()/1024/1024)*100);
				if (this.memoryLeft > 0 && this.memoryLeft < 5)
					this.exitserver("SERVER IS OUT OF MEMORY. SHUT DOWN.");
				
				this.memoryUsageTick = 0;
			}
			else
				this.memoryUsageTick++;
			
			
			var players = 0;
			this.clients.forEach(function(client) 
			{
				if (client.playerTracker && client.playerTracker.cells.length > 0)
					players++
			});
			var playersCount = "PLAYERS: "+players;
			this.leaderboard = [];
			this.gameMode.updateLB(this);
			
			if (this.actualPlayersUpdateTick == 3 && this.gameMode.packetLB == 49)
			{				
				//console.log(process.memoryUsage().rss/1024/1024);
				//console.log(Math.round(os.totalmem()/1024/1024));
				//console.log(Math.round(process.memoryUsage().rss/1024/1024/Math.round(os.totalmem()/1024/1024)*100));
				for (var i=0; i<this.clients.length; i++)
				{
					var player = this.clients[i].playerTracker;
					if (player && this.leaderboard.length > 0)
						this.clients[i].playerTracker.socket.sendPacket(new Packet.UpdatePlayerlist(this.leaderboard));		
				}
				this.actualPlayersUpdateTick = 0;
			}
			else
				this.actualPlayersUpdateTick++;
			
			////////////////////////////////////////////////////////
			for (var i=0; i<this.clients.length; i++)
			{
				var player = this.clients[i].playerTracker;
				if (player)
					this.clients[i].playerTracker.socket.sendPacket(new Packet.UpdateLeaderboard(this, this.leaderboard.slice(0,this.config.ffaMaxLB),this.gameMode.packetLB, playersCount, this.clients[i].playerTracker.pingTime, this.memoryLeft ? this.memoryLeft : "", this.toHHMMSS(this.uptime)));						
			}
					
            this.tickMain = 0; // Reset
        }

        // Debug
        //console.log(this.tick - 50);

        // Reset
        this.tick = 0;

        // Restart main loop immediately after current event loop (setImmediate does not amplify any lag delay unlike setInterval or setTimeout)
        setImmediate(this.mainLoopBind);
    } else {
        // Restart main loop 1 ms after current event loop (setTimeout uses less cpu resources than setImmediate)
        setTimeout(this.mainLoopBind, 1);
    }
};

GameServer.prototype.resetlb = function() {
    // Replace functions
    var gm = Gamemode.get(this.gameMode.ID);
    this.gameMode.packetLB = gm.packetLB;
    this.gameMode.updateLB = gm.updateLB;
};

GameServer.prototype.updateClients = function() {
    for (var i = 0; i < this.clients.length; i++) 
	{
        if (typeof this.clients[i] == "undefined") {
            continue;
        }
        if (typeof this.clients[i].playerTracker == "undefined") continue;
        this.clients[i].playerTracker.antiTeamTick();
        this.clients[i].playerTracker.update();
    }
};

GameServer.prototype.startingFood = function() {
    // Spawns the starting amount of food cells
    for (var i = 0; i < this.config.foodStartAmount; i++) {
        this.spawnFood();
    }
};

GameServer.prototype.updateFood = function() {
    var toSpawn = Math.min(this.config.foodSpawnAmount, (this.config.foodMaxAmount - this.currentFood));
    for (var i = 0; i < toSpawn; i++) {
        this.spawnFood();
    }
};

GameServer.prototype.spawnFood = function() {
    var f = new Entity.Food(this.getNextNodeId(), null, this.getRandomPosition(), this.config.foodMass, this);
    f.setColor(this.getRandomColor());

    this.addNode(f);
    this.currentFood++;
};

GameServer.prototype.spawnPlayer = function(player, pos, mass) 
{ 
  if (this.config.allowBots == 0)
  {
    var thisPlayerAddress = "";
	if (typeof player.socket.remoteAddress != 'undefined' )
		thisPlayerAddress = player.socket.remoteAddress;
	for (var i=0; i<this.clients.length; i++)
	{
		var checkedPlayer = this.clients[i].playerTracker;
		if (checkedPlayer && (checkedPlayer.cells.length > 0))
		{
			if ((typeof this.clients[i].remoteAddress != 'undefined') && (this.clients[i].remoteAddress == thisPlayerAddress))
			{
				if (checkedPlayer.disconnect == -1)
				{
					if (this.banned.indexOf(thisPlayerAddress) == -1)
					{
						this.banned.push(thisPlayerAddress);
						if (this.config.rememberBannedPlayers)
						{
							fs.writeFileSync('banned.txt', "\n"+thisPlayerAddress);
							console.log("[Console] Successfully recorded banlist, IP: "+thisPlayerAddress+", player was using bots or multiboxing.");
						}
					}
					for (var j=0; j<this.clients.length; j++)
					{
						if ((typeof this.clients[j].remoteAddress != 'undefined') && (this.clients[j].remoteAddress == thisPlayerAddress))
						{
							//console.log("Zbanowano bota: "+thisPlayerAddress);
							this.clients[j].playerTracker.socket.sendPacket(new Packet.SendAlert("You've been banned for a few minutes using bots or multiboxing."));
							this.clients[j].close();
						}
					}
				}
				else
					player.socket.sendPacket(new Packet.SendAlert("Your cells are still in the game. Please wait until they will dissapear."));
				return;
			}
		}
	}
  }
	
    if (pos == null) { // Get random pos
        pos = this.getRandomPosition();//pos = this.getRandomPosition();
    }
    if (mass == null) { // Get starting mass
        mass = this.config.playerStartMass;
    }
	
	
	/////////////////// do not spawn in cells with more mass than your start mass /////////////////////
  if (this.config.allowSpawnCollision == 0)
  {	  
	var isColliding = true;
	var antiLoop = 10;
	var playercellSquareSize = (( mass*5 ) * 110) >> 0;
	var areThereLargerCells = false;
	while (isColliding && antiLoop > 0)
	{
		antiLoop--;
		
		if (this.nodesPlayer.length == 0)
			break;
		
		// Check for players
        for (var i = 0; i < this.nodesPlayer.length; i++) 
		{
            var check = this.nodesPlayer[i];
			if (check.mass < mass)
				continue;
			else
				!areThereLargerCells ? areThereLargerCells = true : null;
            // New way
            var squareR = check.getSquareSize(); // squared Radius of checking player cell
            var dx = check.position.x - pos.x;
            var dy = check.position.y - pos.y;
            if (dx * dx + dy * dy + playercellSquareSize <= squareR) // collided
				pos = this.getRandomPosition();
			else
				isColliding = false;
        }
		if (!areThereLargerCells)
			break;
	}
  }
	///////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
    // Spawn player and add to world
    var cell = new Entity.PlayerCell(this.getNextNodeId(), player, pos, mass);
	this.addNode(cell);

    // Set initial mouse coords
    player.mouse = {x: pos.x, y: pos.y};
};

GameServer.prototype.willCollide = function(mass, pos, isVirus) {
    // Look if there will be any collision with the current nodes
    var size = (mass * 100) >> 0;
    
    for (var i = 0; i < this.nodesPlayer.length; i++) {
        var check = this.nodesPlayer[i];
        if (!check) continue;

		if (isVirus && check.mass > 500)
		{
			if (check.collisionCheck2(size, pos))
				return true;
		}
		else if (!isVirus)
		{
			// Eating range
			var xs = check.position.x - pos.x,
				ys = check.position.y - pos.y,
				sqDist = xs * xs + ys * ys,
				dist = Math.sqrt(sqDist);
			
			if (check.getSize() > size) { // Check only if the player cell is larger than imaginary cell
				if (dist + size <= check.getSize()) return true; // Collided

			}
		}
    }
    
    if (isVirus) return false; // Don't check for viruses if the new cell will be virus
    
    for (var i = 0; i < this.nodesVirus.length; i++) {
        var check = this.nodesVirus[i];
        if (!check) continue;
        
        // Eating range
        var xs = check.position.x - pos.x,
            ys = check.position.y - pos.y,
            sqDist = xs * xs + ys * ys,
            dist = Math.sqrt(sqDist);

        if (check.getSize() > size) { // Check only if the virus cell is larger than imaginary cell
            if (dist + size <= check.getSize()) return true; // Collided
        }
    }
    return false;
};

GameServer.prototype.virusCheck = function() 
{
	if (this.nodesVirus.length < this.config.virusMinAmount) 
	{
		var pos = this.getRandomPosition();
		if (this.willCollide(30000, pos, true)) // simulate virus with 30000 mass to prevent spawning them close to players
			return;
		// Spawn if no cells are colliding
		var v = new Entity.Virus(this.getNextNodeId(), null, pos, this.config.virusStartMass);
		v.setRandomVirusType(this.config.virusTypes);
		this.addNode(v);
	}
};

GameServer.prototype.getDist = function(x1, y1, x2, y2) { // Use Pythagoras theorem
    var deltaX = Math.abs(x1 - x2);
    var deltaY = Math.abs(y1 - y2);
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

GameServer.prototype.updateMoveEngine = function() {
    // Move player cells
    var len = this.nodesPlayer.length;

    // Sort cells to move the cells close to the mouse first
    var srt = [];
    for (var i = 0; i < len; i++)
        srt[i] = i;

    for (var i = 0; i < len; i++) {
        for (var j = i + 1; j < len; j++) {
            var clientI = this.nodesPlayer[srt[i]].owner;
            var clientJ = this.nodesPlayer[srt[j]].owner;
            if (this.getDist(this.nodesPlayer[srt[i]].position.x, this.nodesPlayer[srt[i]].position.y, clientI.mouse.x, clientI.mouse.y) >
                this.getDist(this.nodesPlayer[srt[j]].position.x, this.nodesPlayer[srt[j]].position.y, clientJ.mouse.x, clientJ.mouse.y)) {
                var aux = srt[i];
                srt[i] = srt[j];
                srt[j] = aux;
            }
        }
    }

    for (var i = 0; i < len; i++) {
        var cell = this.nodesPlayer[srt[i]];

        // Do not move cells that have already been eaten or have collision turned off
        if (!cell) {
            continue;
        }

        var client = cell.owner;

        cell.calcMove(client.mouse.x, client.mouse.y, this);

        // Check if cells nearby
        var list = this.getCellsInRange(cell);
        for (var j = 0; j < list.length; j++) {
            var check = list[j];

            if (check.cellType == 0) {
                if ((client != check.owner) && (cell.mass < check.mass * 1.25) && this.config.playerRecombineTime != 0) { //extra check to make sure popsplit works by retslac
                    check.inRange = false;
                    continue;
                }
                len--;
                if (check.nodeId < cell.nodeId) {
                    i--;
                }
            }

            // Consume effect
            check.onConsume(cell, this);

            // Remove cell
            check.setKiller(cell);
            this.removeNode(check);
        }
    }

    // A system to move cells not controlled by players (ex. viruses, ejected mass)
    len = this.movingNodes.length;
    for (var i = 0; i < len; i++) {
        var check = this.movingNodes[i];

        // Recycle unused nodes
        while ((typeof check == "undefined") && (i < this.movingNodes.length)) {
            // Remove moving cells that are undefined
            this.movingNodes.splice(i, 1);
            check = this.movingNodes[i];
        }

        if (i >= this.movingNodes.length) {
            continue;
        }

        if (check.moveEngineTicks > 0) {
            check.onAutoMove(this);
            // If the cell has enough move ticks, then move it
            check.calcMovePhys(this.config);
        } else {
            // Auto move is done
            check.moveDone(this);
            // Remove cell from list
            var index = this.movingNodes.indexOf(check);
            if (index != -1) {
                this.movingNodes.splice(index, 1);
            }
        }
    }
};

GameServer.prototype.setAsMovingNode = function(node) {
    this.movingNodes.push(node);
};

GameServer.prototype.splitCells = function(client, isCannonSplit) {
    if (client.frozen || (!client.verify && this.config.verify == 1)) {
        return;
    }
    var len = client.cells.length;
    var splitCells = 0; // How many cells have been split
    for (var i = 0; i < len; i++) {
        if (client.cells.length >= this.config.playerMaxCells) {
            // Player cell limit
            continue;
        }

        var cell = client.cells[i];
        if (!cell) {
            continue;
        }

        if (cell.mass < this.config.playerMinMassSplit) {
            continue;
        }

        // Get angle
        var deltaY = client.mouse.y - cell.position.y;
        var deltaX = client.mouse.x - cell.position.x;
        var angle = Math.atan2(deltaX, deltaY);
       // if (angle == 0) angle = Math.PI / 2;

        // Get starting position
        var size = cell.getSize()/2;
        var startPos = {
            x: cell.position.x + ( size * Math.sin(angle) ),
            y: cell.position.y + ( size * Math.cos(angle) )
        };
        // Calculate mass and speed of splitting cell
        var newMass = cell.mass / 2;
        cell.mass = newMass;

        // Create cell
        var split = new Entity.PlayerCell(this.getNextNodeId(), client, startPos, newMass, this);
        split.setAngle(angle);
        // Polyfill for log10
		
        //Math.log10 = Math.log10 || function(x) {
        //    return Math.log(x) / Math.LN10;
       // };
       // var splitSpeed = (isCannonSplit ? this.config.splitSpeed*2 : this.config.splitSpeed) * Math.max(Math.log10(newMass) - 2.2, 1); //for smaller cells use splitspeed 150, for bigger cells add some speed
        
		var t = Math.PI * Math.PI;
		var modifier = 3 + Math.log(1 + newMass) / (10 + Math.log(1 + newMass));
		var splitSpeed = this.config.playerSpeed*1.5 * Math.min(Math.pow(newMass, -Math.PI / t / 10) * modifier, 150);
		splitSpeed = isCannonSplit ? this.config.turboSplitSpeed : splitSpeed;
		split.setMoveEngineData(splitSpeed, 32, 0.85); //vanilla agar.io = 130, 32, 0.85
        split.calcMergeTime(this.config.playerRecombineTime);
        split.ignoreCollision = true;
		//cell.restoreCollisionTicks = this.config.parentCellRestoreTicks; //vanilla agar.io = 10
        split.restoreCollisionTicks = this.config.splittedCellRestoreTicks; //vanilla agar.io = 10

        // Add to moving cells list
        this.setAsMovingNode(split);
        this.addNode(split);
        splitCells++;
    }
    if (splitCells > 0) client.actionMult += 0.5; // Account anti-teaming
};


GameServer.prototype.canEjectMass = function(client) {
    if (typeof client.lastEject == 'undefined' || this.config.ejectMassCooldown == 0 || this.time - client.lastEject >= this.config.ejectMassCooldown && !client.frozen) {
        client.lastEject = this.time;
        return true;
    } else
        return false;
};

GameServer.prototype.customLB = function(newLB, gameServer) {
    gameServer.gameMode.packetLB = 48;
    gameServer.gameMode.specByLeaderboard = false;
    gameServer.gameMode.updateLB = function(gameServer) {
        gameServer.leaderboard = newLB
    };
};

GameServer.prototype.anounce = function() {
    var newLB = [];
    newLB[0] = "Highscore:";
    newLB[1] = this.topscore;
    newLB[2] = "  By  ";
    newLB[3] = this.topusername;

    this.customLB(this.config.anounceDuration * 1000, newLB, this);
};

GameServer.prototype.ejectMass = function(client, isSpamMass) {
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];

        if (!cell) {
            continue;
        }

		if (isSpamMass && cell.mass < this.config.virusBattleMinimumCellMass) // cells with less than 1000 mas can't eject "virus battle" mass
			continue;
		
        if (cell.mass < this.config.playerMinMassEject) {
            continue;
        }

        var deltaY = client.mouse.y - cell.position.y;
        var deltaX = client.mouse.x - cell.position.x;
        var angle = Math.atan2(deltaX,deltaY);

        // Get starting position
        var size = cell.getSize() + this.config.playerSpeed*1/3; // prevent cell from eating its own ejected mass before ejecting them
        var startPos = {
            x: cell.position.x + ( (size + this.config.ejectMass) * Math.sin(angle) ),
            y: cell.position.y + ( (size + this.config.ejectMass) * Math.cos(angle) )
        };

        // Remove mass from parent cell
		if (!isSpamMass)
			cell.mass -= this.config.ejectMassLoss; // if it's not "virus battle" mass, decrease cell mass
        // Randomize angle
        angle += (Math.random() * .4) - .2;

        // Create cell
        var ejected = new Entity.EjectedMass(this.getNextNodeId(), null, startPos, isSpamMass ? this.config.virusBattleMass : this.config.ejectMass);
		if (isSpamMass)
			ejected.isSpamMass = true;
        ejected.setAngle(angle);
        ejected.setMoveEngineData(isSpamMass ? this.config.virusBattleEjectSpeed : this.config.ejectSpeed, 20);
        ejected.setColor(cell.getColor());

        this.addNode(ejected);
        this.setAsMovingNode(ejected);
    }
};

GameServer.prototype.autoSplit = function(client, parent, angle, mass, speed) {
    // Starting position
    var startPos = {
        x: parent.position.x,
        y: parent.position.y
    };

    // Create cell
    var newCell = new Entity.PlayerCell(this.getNextNodeId(), client, startPos, mass);
    newCell.setAngle(angle);
    newCell.setMoveEngineData(speed, 15);
    newCell.restoreCollisionTicks = 25;
    newCell.calcMergeTime(this.config.playerRecombineTime);
    newCell.ignoreCollision = true; // Remove collision checks
    newCell.restoreCollisionTicks = this.config.cRestoreTicks; //vanilla agar.io = 10
    // Add to moving cells list
    this.addNode(newCell);
    this.setAsMovingNode(newCell);
};

GameServer.prototype.newCellVirused = function(client, parent, angle, mass, speed, virusType) {
    // Starting position
    var startPos = {
        x: parent.position.x,
        y: parent.position.y
    };

    // Create cell
    var newCell = new Entity.PlayerCell(this.getNextNodeId(), client, startPos, mass);
    newCell.setAngle(angle);
    newCell.setMoveEngineData(speed, 15);
    switch (virusType)
	{
		case 1: newCell.calcMergeTime(500); break;
		case 2: newCell.calcMergeTime(250); break;
		case 3: newCell.calcMergeTime(this.config.playerRecombineTime); break;
	}
    newCell.ignoreCollision = true; // Remove collision checks
    newCell.restoreCollisionTicks = this.config.cRestoreTicks; //vanilla agar.io = 10
    // Add to moving cells list
    this.addNode(newCell);
    this.setAsMovingNode(newCell);
};

GameServer.prototype.shootVirus = function(parent) {
    var parentPos = {
        x: parent.position.x,
        y: parent.position.y,
    };

    var newVirus = new Entity.Virus(this.getNextNodeId(), null, parentPos, this.config.virusStartMass, this.config.virusTypes);
    newVirus.setAngle(parent.getAngle());
	newVirus.setVirusType(parent.virusType);
    newVirus.setMoveEngineData(200, 20);

    // Add to moving cells list
    this.addNode(newVirus);
    this.setAsMovingNode(newVirus);
};

GameServer.prototype.ejectVirus = function(parent, owner, color) {
    var parentPos = {
        x: parent.position.x,
        y: parent.position.y,
    };

    var newVirus = new Entity.Virus(this.getNextNodeId(), null, parentPos, this.config.virusMass);
	newVirus.setRandomVirusType(this.config.virusTypes);
    newVirus.setAngle(parent.getAngle());
    newVirus.setpar(owner);
    newVirus.mass = 10
    newVirus.setMoveEngineData(this.config.ejectvspeed, 20);
    if (color) newVirus.color = color;
    else newVirus.color = owner.color;

    // Add to moving cells list
    this.addNode(newVirus);
    this.setAsMovingNode(newVirus);
};

GameServer.prototype.getCellsInRange = function(cell) {
    var list = [];
    var squareR = cell.getSquareSize(); // Get cell squared radius

    // Loop through all cells that are visible to the cell. There is probably a more efficient way of doing this but whatever
    var len = cell.owner.visibleNodes.length;
    for (var i = 0; i < len; i++) {
        var check = cell.owner.visibleNodes[i];

        if (typeof check === 'undefined') {
            continue;
        }

        // if something already collided with this cell, don't check for other collisions
        if (check.inRange) {
            continue;
        }

        // Can't eat itself
        if (cell.nodeId == check.nodeId) {
            continue;
        }

        // Can't eat cells that have collision turned off
        if ((cell.owner == check.owner) && (cell.ignoreCollision)) {
            continue;
        }

        // AABB Collision
        if (!check.collisionCheck2(squareR, cell.position)) {
            continue;
        }

        // Cell type check - Cell must be bigger than this number times the mass of the cell being eaten
        var multiplier = 1.25;

        switch (check.getType()) {
            case 1: // Food cell
                list.push(check);
                check.inRange = true; // skip future collision checks for this food
                continue;
            case 2: // Virus
                multiplier = 1.33;
                break;
            case 5: // Beacon
                // This cell cannot be destroyed
                continue;
            case 0: // Players
                // Can't eat self if it's not time to recombine yet
                if (check.owner == cell.owner) {
                    if (!cell.shouldRecombine || !check.shouldRecombine) {
                        if (!cell.owner.recombineinstant) continue;
                    }

                    multiplier = 1.00;
                }
                // Can't eat team members
                if (this.gameMode.haveTeams) {
                    if (!check.owner) { // Error check
                        continue;
                    }

                    if ((check.owner != cell.owner) && (check.owner.getTeam() == cell.owner.getTeam())) {
                        continue;
                    }
                }
                break;
            default:
                break;
        }

        // Make sure the cell is big enough to be eaten.
        if ((check.mass * multiplier) > cell.mass) {
            continue;
        }

        // Eating range
        var xs = Math.pow(check.position.x - cell.position.x, 2);
        var ys = Math.pow(check.position.y - cell.position.y, 2);
        var dist = Math.sqrt(xs + ys);

        var eatingRange = cell.getSize() - check.getEatingRange(); // Eating range = radius of eating cell + 40% of the radius of the cell being eaten
        if (dist > eatingRange) {
            // Not in eating range
            continue;
        }

        // Add to list of cells nearby
        list.push(check);

        // Something is about to eat this cell; no need to check for other collisions with it
        check.inRange = true;
    }
    return list;
};

GameServer.prototype.getNearestVirus = function(cell) {
    // More like getNearbyVirus
    var virus = null;
    var r = this.config.virusStartMass; // Checking radius

    var topY = cell.position.y - r;
    var bottomY = cell.position.y + r;

    var leftX = cell.position.x - r;
    var rightX = cell.position.x + r;

    // Loop through all viruses on the map. There is probably a more efficient way of doing this but whatever
    var len = this.nodesVirus.length;
    for (var i = 0; i < len; i++) {
        var check = this.nodesVirus[i];

        if (typeof check === 'undefined') {
            continue;
        }

        if (!check.collisionCheck(bottomY, topY, rightX, leftX)) {
            continue;
        }

        // Add to list of cells nearby
        virus = check;
        break; // stop checking when a virus found
    }
    return virus;
};

GameServer.prototype.updateCells = function() {
    if (!this.run) {
        // Server is paused
        return;
    }

    // Loop through all player cells

    for (var i = 0; i < this.nodesPlayer.length; i++) {
        var cell = this.nodesPlayer[i];

        if (!cell) {
            continue;
        }
        // Have fast decay over 5k mass
        if (this.config.playerFastDecay == 1) {
            if (cell.mass < this.config.fastdecayrequire) {
                var massDecay = 1 - (this.config.playerMassDecayRate * this.gameMode.decayMod * 0.05); // Normal decay
            } else {
                var massDecay = 1 - (this.config.playerMassDecayRate * this.gameMode.decayMod) * this.config.FDmultiplyer; // might need a better formula
            }
        } else {
            var massDecay = 1 - (this.config.playerMassDecayRate * this.gameMode.decayMod * 0.05);
        }

        // Recombining
        if (cell.owner.cells.length > 1 && !cell.owner.norecombine) {
            cell.recombineTicks += 0.2;
            cell.calcMergeTime(this.config.playerRecombineTime);
        } else if (cell.owner.cells.length == 1 && cell.recombineTicks > 0) {
            cell.recombineTicks = 0;
            cell.shouldRecombine = false;
            cell.owner.recombineinstant = false;
        }

        // Mass decay
        if (cell.mass >= this.config.playerMinMassDecay) {
            var client = cell.owner;
            if (this.config.teaming == 0) {
                var teamMult = (client.massDecayMult - 1) / 160 + 1; // Calculate anti-teaming multiplier for decay
                var thisDecay = 1 - massDecay * (1 / teamMult); // Reverse mass decay and apply anti-teaming multiplier
                cell.mass *= (1 - thisDecay);
            } else {
                // No anti-team
                cell.mass *= massDecay;
            }
        }
    }
};

GameServer.prototype.loadConfig = function() {
    try {
        // Load the contents of the config file
        var load = ini.parse(fs.readFileSync('./gameserver.ini', 'utf-8'));
        // Replace all the default config's values with the loaded config's values
        for (var obj in load) {
            this.config[obj] = load[obj];
        }
    } catch (err) {
        // No config
        console.log("[Game] Config not found... Generating new config");

        // Create a new config
        fs.writeFileSync('./gameserver.ini', ini.stringify(this.config));
    }

    try {
        var load = ini.parse(fs.readFileSync('./banned.txt', 'utf-8'));
        this.banned = fs.readFileSync("./banned.txt", "utf8").split(/[\r\n]+/).filter(function(x) {
            return x != ''; // filter empty names
        });

    } catch (err) {
        console.log("[Game] Banned.txt not found... Generating new banned.txt");
        fs.writeFileSync('./banned.txt', '');
    }
    try {

        // Read and parse the names - filter out whitespace-only names
        this.randomNames = fs.readFileSync("./botnames.txt", "utf8").split(/[\r\n]+/).filter(function(x) {
            return x != ''; // filter empty names
        });
    } catch (e) {
        // Nothing, use the default names
    }
    gameServern = this;
};

GameServer.prototype.switchSpectator = function(player) {
    // Find next non-spectator with cells in the client list
        var oldPlayer = player.spectatedPlayer + 1;
        var count = 0;
        while (player.spectatedPlayer != oldPlayer && count != this.clients.length) {
            if (oldPlayer == this.clients.length) {
                oldPlayer = 0;
                continue;
            }
            if (!this.clients[oldPlayer]) {
                // Break out of loop in case client tries to spectate an undefined player
                player.spectatedPlayer = -1;
				player.specPlayer = null;
                break;
            }
            if (this.clients[oldPlayer].playerTracker.cells.length > 0) {
                break;
            }
            oldPlayer++;
            count++;
        }
        if (count == this.clients.length) {
            player.spectatedPlayer = -1;
			player.specPlayer = null;
        } else {
            player.spectatedPlayer = Math.min(this.clients.length - 1, oldPlayer);
			if (this.clients[player.spectatedPlayer])
				player.specPlayer = player.spectatedPlayer == -1 ? null : this.clients[player.spectatedPlayer].playerTracker;
        }
    //}
};

// Custom prototype functions
WebSocket.prototype.sendPacket = function(packet) {
    function getBuf(data) {
        var array = new Uint8Array(data.buffer || data);
        var l = data.byteLength || data.length;
        var o = data.byteOffset || 0;
        var buffer = new Buffer(l);

        for (var i = 0; i < l; i++) {
            buffer[i] = array[o + i];
        }

        return buffer;
    }

    //if (this.readyState == WebSocket.OPEN && (this._socket.bufferSize == 0) && packet.build) {
    if (this.readyState == WebSocket.OPEN && packet.build) {
        var buf = packet.build();
        this.send(getBuf(buf), {
            binary: true
        });
    } else if (!packet.build) {
        // Do nothing
    } else {
        this.readyState = WebSocket.CLOSED;
        this.emit('close');
        this.removeAllListeners();
    }
};
