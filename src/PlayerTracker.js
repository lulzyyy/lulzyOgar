var Packet = require('./packet');
var GameServer = require('./GameServer.js');
var fs = require("fs");
var geoip = require('geoip-lite');

function PlayerTracker(gameServer, socket, owner) {
    this.pID = -1;
    this.disconnect = -1; // Disconnection
    this.name = "";
    this.gameServer = gameServer;
    this.socket = socket;
    this.blind = false;
    this.rainbowon = false;
    this.mergeOverrideDuration = 0;
    this.scoreh = [];

	this.skinName = "";
	this.lastMsgSent = 0;
	this.pingPacketSendTime = 0;
	this.pingPacketReceiveTime = 0;
	this.pingTime = 0;
	this.avgPing = 0;
	this.country = "Unknown";
	this.connected = true;
	this.lbHighscore = 0;
	this.hscore = 0;
	this.pingpacketSent = false;
	this.pingpacketReceived = false;
	this.lastMassEjectedDate = 0;
	this.lastVirusMassEjectedDate = 0;
	
    this.shouldMoveCells = true; // False if the mouse packet wasn't triggered
    this.movePacketTriggered = false;
    this.frozen = false;
    this.recombineinstant = false;
    this.mi = 0;
    this.spect;
    this.vskin = "";
    this.customspeed = 0;
    this.vname = "";
    this.vr = 0;
    this.nospawn = false;
    this.vt = 0;
    this.tverify = false;
    this.verify = false;
    this.vpass = Math.floor(Math.random() * 1000);
    this.spawnmass = 0;
    this.owner = owner;
    this.oldname = "";
    this.norecombine = false;
    this.nodeAdditionQueue = [];
    this.minioncontrol = false;
    this.premium = '';
    this.nodeDestroyQueue = [];
    this.visibleNodes = [];
    this.vfail = 0;
    this.cells = [];
    this.score = 0; // Needed for leaderboard

    this.mouse = {
        x: 0,
        y: 0
    };
    this.mouseCells = []; // For individual cell movement
    this.tickLeaderboard = 0;
    this.tickViewBox = 0;

	this.spectatedPlayer = -1; // Current player that this player is watching
	this.specPlayer = null;
    this.team = 0;
    this.spectate = false;
    this.freeRoam = false; // Free-roam mode enables player to move in spectate mode
    this.massDecayMult = 1; // Anti-teaming multiplier
    this.actionMult = 0; // If reaches over 1, it'll account as anti-teaming
    this.actionDecayMult = 1; // Players not teaming will lose their anti-teaming multiplier far more quickly

    // Viewing box
    this.sightRangeX = 0;
    this.sightRangeY = 0;
    this.centerPos = { // Center of map
        x: 3000,
        y: 3000
    };
    this.viewBox = {
        topY: 0,
        bottomY: 0,
        leftX: 0,
        rightX: 0,
        width: 0, // Half-width
        height: 0 // Half-height
    };

    // Scramble the coordinate system for anti-raga
    this.scrambleX = 0;
    this.scrambleY = 0;

    // Gamemode function
    if (gameServer) 
	{
        // Find center
        this.centerPos.x = (gameServer.config.borderLeft - gameServer.config.borderRight) / 2;
        this.centerPos.y = (gameServer.config.borderTop - gameServer.config.borderBottom) / 2;
        // Player id
        this.pID = gameServer.getNewPlayerID();
        // Gamemode function
        gameServer.gameMode.onPlayerInit(this);


    }
}

module.exports = PlayerTracker;

// Setters/Getters
PlayerTracker.prototype.getBiggestc = function() {
    var biggest = {
        mass: 0
    };
    for (var i in this.cells) {
        if (this.cells[i].mass > biggest.mass) biggest = this.cells[i];

    }
    return biggest;
};

PlayerTracker.prototype.setCountry = function(address) 
{
	if (address == "localhost" || address == "127.0.0.1")
		this.country = "Localhost";
	else
	{
		if (geoip.lookup(address))
			this.country = this.gameServer.getCountryName(geoip.lookup(address).country);
		else
			this.country = "Unknown";
	}
}

PlayerTracker.prototype.setName = function(name) 
{
		if (name.toLowerCase().indexOf("lulzy") == -1 || name.toLowerCase().indexOf("luizy") == -1 || name.toLowerCase().indexOf("iulzy") != -1  || name.toLowerCase().indexOf("iuizy") == -1)
		{
			this.name = name.trim();
		}
		else
			this.name = "";
};
PlayerTracker.prototype.newV = function() {
    this.vpass = Math.floor(Math.random() * 1000);

};

PlayerTracker.prototype.getName = function() {
    return this.name;
};

PlayerTracker.prototype.getSkinName = function() {
    return this.skinName;
};

PlayerTracker.prototype.setSkinName = function(skinName) {
    this.skinName = skinName;
};
/**
 * Returns the players score and updates the highscore if needed
 * @param reCalcScore
 * @returns {number}
 */
PlayerTracker.prototype.getScore = function(reCalcScore) {
    if (reCalcScore) 
	{
        var s = 0;
        for (var i = 0; i < this.cells.length; i++) {
            s += this.cells[i].mass;
            this.score = s;
            if ( s > this.hscore ) this.hscore = s;
        }	
    }
    if ( this.cells.length > this.cscore ) this.cscore = this.cells.length;
    return this.score >> 0;
};

PlayerTracker.prototype.setColor = function(color) {
    this.color.r = color.r;
    this.color.b = color.b;
    this.color.g = color.g;
};

PlayerTracker.prototype.getTeam = function() {
    return this.team;
};
PlayerTracker.prototype.getPremium = function() {
    return this.premium;
};
// Functions

PlayerTracker.prototype.update = function() {
    if (this.movePacketTriggered) {
        this.movePacketTriggered = false;
        this.shouldMoveCells = true;
    } else {
        this.shouldMoveCells = false;
    }
    // Actions buffer (So that people cant spam packets)
    if (this.socket.packetHandler.pressSpace) { // Split cell
        this.gameServer.gameMode.pressSpace(this.gameServer,this);
        this.socket.packetHandler.pressSpace = false;
    }

    if (this.socket.packetHandler.pressW) 
	{ // Eject mass
		if (this.gameServer.config.preventUsingMacro)
		{
			if ((Date.now() - this.lastMassEjectedDate) > this.gameServer.config.ejectMassDelay)
			{
				this.lastMassEjectedDate = Date.now();
				this.gameServer.gameMode.pressW(this.gameServer,this);
			}
		}
		else
			this.gameServer.gameMode.pressW(this.gameServer,this);
		if (this.gameServer.config.automaticMassEject == 0)
			this.socket.packetHandler.pressW = false;
    }

    if (this.socket.packetHandler.pressQ && this.gameServer.config.allowVirusBattle == 1) 
	{ // Q Press
		if (this.gameServer.config.preventUsingMacro)
		{
			if ((Date.now() - this.lastVirusMassEjectedDate) > this.gameServer.config.ejectVirusBattleMassDelay)
			{
				this.lastVirusMassEjectedDate = Date.now();
				this.gameServer.gameMode.pressQ(this.gameServer,this);
			}
		}
		else
			this.gameServer.gameMode.pressQ(this.gameServer,this);
		if (this.gameServer.config.automaticVirusBattleMassEject == 0)
			this.socket.packetHandler.pressQ = false;
    }
	
	if (this.socket.packetHandler.pressZ) { // Z Press
        this.gameServer.gameMode.pressZ(this.gameServer,this);
        this.socket.packetHandler.pressZ = false;
    }

    var updateNodes = []; // Nodes that need to be updated via packet

    if (this.mergeOverrideDuration < 150 && this.recombineinstant) {
        this.mergeOverrideDuration++;
    } else if (this.recombineinstant) {
        this.recombineinstant = false;
        this.mergeOverrideDuration = 0;
    } else {
        this.mergeOverrideDuration = 0;
    }
    // Remove nodes from visible nodes if possible
    var d = 0;
    while (d < this.nodeDestroyQueue.length) {
        var index = this.visibleNodes.indexOf(this.nodeDestroyQueue[d]);
        if (index > -1) {
            this.visibleNodes.splice(index, 1);
            d++; // Increment
        } else {
            // Node was never visible anyways
            this.nodeDestroyQueue.splice(d, 1);
        }
    }

	if (!this.pingpacketSent)
	{
		this.pingpacketSent = true;
		this.socket.sendPacket(new Packet.PingPacket());
		this.pingPacketSendTime = Date.now();
	}
	
    // Get visible nodes every 400 ms
    var nonVisibleNodes = []; // Nodes that are not visible
    if (this.tickViewBox <= 0) 
	{
        var newVisible = this.calcViewBox();
        if (newVisible && newVisible.length) {
            try { // Add a try block in any case

                // Compare and destroy nodes that are not seen
                for (var i = 0; i < this.visibleNodes.length; i++) {
                    var index = newVisible.indexOf(this.visibleNodes[i]);
                    if (index == -1) {
                        // Not seen by the client anymore
                        nonVisibleNodes.push(this.visibleNodes[i]);
                    }
                }

                // Add nodes to client's screen if client has not seen it already
                for (var i = 0; i < newVisible.length; i++) {
                    var index = this.visibleNodes.indexOf(newVisible[i]);
                    if (index == -1 && (!this.blind || (newVisible[i].owner == this || newVisible[i].cellType != 0))) {

                        updateNodes.push(newVisible[i]);
                    }
                }
            } finally {} // Catch doesn't work for some reason

            this.visibleNodes = newVisible;
            // Reset Ticks
            this.tickViewBox = 2;
        }
    } else {
        this.tickViewBox--;
        // Add nodes to screen
        for (var i = 0; i < this.nodeAdditionQueue.length; i++) {
            var node = this.nodeAdditionQueue[i];
            if (!this.blind || (node.owner == this || node.cellType != 0)) {
                this.visibleNodes.push(node);
                updateNodes.push(node);
            }
        }
    }

    // Update moving nodes
    for (var i = 0; i < this.visibleNodes.length; i++) {
        var node = this.visibleNodes[i];
        if (node.sendUpdate() && (!this.blind || (node.owner == this || node.cellType != 0))) {
            // Sends an update if cell is moving
            updateNodes.push(node);
        }
    }

    // Send packet
    this.socket.sendPacket(new Packet.UpdateNodes(
        this.nodeDestroyQueue,
        updateNodes,
        nonVisibleNodes,
        this.scrambleX,
        this.scrambleY
    ));

    this.nodeDestroyQueue = []; // Reset destroy queue
    this.nodeAdditionQueue = []; // Reset addition queue

	/*
    // Update leaderboard
    if (this.tickLeaderboard <= 0) {
        this.socket.sendPacket(this.gameServer.lb_packet);
        this.tickLeaderboard = 10; // 20 ticks = 1 second
    } else {
        this.tickLeaderboard--;
    }
	*/

    // Map obfuscation
    var width = this.viewBox.width;
    var height = this.viewBox.height;



    // Handles disconnections
    if ( this.disconnect > 0 ) 
	{
        // Player has disconnected... remove it when the timer hits -1
        this.disconnect--;
        
		this.name = ""+this.disconnect;
        if ( this.disconnect == 0 ) 
		{
			if ( this.cells.length ) 
			{
				// Remove all client cells
				var len = this.cells.length;
				for (var i = 0; i < len; i++) {
					var cell = this.socket.playerTracker.cells[0];
					if (!cell) {
						continue;
					}
					this.gameServer.removeNode(cell);
				}
			}
			
            // Remove from client list
            var index = this.gameServer.clients.indexOf(this.socket);
            if (index != -1) {
                this.gameServer.clients.splice(index,1);
            }
        }
    }
};

// Viewing box
PlayerTracker.prototype.antiTeamTick = function() {
    // ANTI-TEAMING DECAY
    // Calculated even if anti-teaming is disabled.
    this.actionMult *= (0.999 * this.actionDecayMult);
    this.actionDecayMult *= 0.999;

    if (this.actionDecayMult > 1.002004) this.actionDecayMult = 1.002004; // Very small differences. Don't change this.
    if (this.actionDecayMult < 1) this.actionDecayMult = 1;

    // Limit/reset anti-teaming effect
    if (this.actionMult < 1 && this.massDecayMult > 1) this.actionMult = 0.299; // Speed up cooldown
    if (this.actionMult > 1.4) this.actionMult = 1.4;
    if (this.actionMult < 0.15) this.actionMult = 0;

    // Apply anti-teaming if required
    if (this.actionMult > 1) this.massDecayMult = this.actionMult;
    else this.massDecayMult = 1;

};

PlayerTracker.prototype.updateSightRange = function() { // For view distance

var totalSize = 1.0;
var len = this.cells.length;

	if (len > 1)
	{
		for (var i = 0; i < len; i++) {
			if (!this.cells[i]) {
				continue;
			}

			totalSize += this.cells[i].getSize();
		}

		var factor = Math.pow(Math.min(64.0 / totalSize, 1), 0.4);
		this.sightRangeX = this.gameServer.config.serverViewBaseX / factor;
		this.sightRangeY = this.gameServer.config.serverViewBaseY / factor;
	}
	else
	{
		var factor = Math.pow(Math.min(64.0 / (Math.ceil(Math.sqrt(100 * (this.score)))), 1), 0.4);
		//console.log("Masa: "+this.score+", factor: "+factor);
		this.sightRangeX = this.gameServer.config.serverViewBaseX / factor;
		this.sightRangeY = this.gameServer.config.serverViewBaseX / factor;
	}
};

PlayerTracker.prototype.updateCenter = function() { // Get center of cells
    var len = this.cells.length;

    if (len <= 0) {
        return; // End the function if no cells exist
    }

    var X = 0;
    var Y = 0;
    for (var i = 0; i < len; i++) {
        if (!this.cells[i]) {
            continue;
        }

        X += this.cells[i].position.x;
        Y += this.cells[i].position.y;
    }

    this.centerPos.x = X / len >> 0;
    this.centerPos.y = Y / len >> 0;
};

PlayerTracker.prototype.calcViewBox = function() {
    if (this.spectate) {
        // Spectate mode
        return this.getSpectateNodes();
    }

    // Main function
    this.updateSightRange();
    this.updateCenter();

    // Box
    this.viewBox.topY = this.centerPos.y - this.sightRangeY;
    this.viewBox.bottomY = this.centerPos.y + this.sightRangeY;
    this.viewBox.leftX = this.centerPos.x - this.sightRangeX;
    this.viewBox.rightX = this.centerPos.x + this.sightRangeX;
    this.viewBox.width = this.sightRangeX;
    this.viewBox.height = this.sightRangeY;

    var newVisible = [];
    for (var i = 0; i < this.gameServer.nodes.length; i++) {
        node = this.gameServer.nodes[i];

        if (!node) {
            continue;
        }

        if (node.visibleCheck(this.viewBox, this.centerPos)) {
            // Cell is in range of viewBox
            newVisible.push(node);
        }
    }
    return newVisible;
};

PlayerTracker.prototype.getSpectateNodes = function() {
    if (this.specPlayer) 
	{
         //If selected player has died/disconnected, switch spectator and try again next tick
        if (this.specPlayer.cells.length == 0) {
            this.gameServer.switchSpectator(this);
            return [];
        }

        //var specZoom = Math.sqrt(100 * this.specPlayer.score);
        //specZoom = Math.pow(Math.min(40.5 / specZoom, 1.0), 0.4) * 0.6;
        //this.socket.sendPacket(new Packet.UpdatePosition(this.specPlayer.centerPos.x, this.specPlayer.centerPos.y, specZoom));
		//this.socket.sendPacket(new Packet.ClearNodes());
		for (var i=0; i<this.specPlayer.cells.length; i++)
		{
			
			cell = this.specPlayer.cells[i];
			if (!cell)
				continue;
			 this.socket.sendPacket(new Packet.AddNode(cell));
		}
		
		
        // TODO: Recalculate visible nodes for spectator to match specZoom
        return this.specPlayer.visibleNodes.slice(0,this.specPlayer.visibleNodes.length);
    } 
	else 
	{
        return []; // Nothing
    }
};

PlayerTracker.prototype.checkBorderPass = function() {
    // A check while in free-roam mode to avoid player going into nothingness
    if (this.centerPos.x < this.gameServer.config.borderLeft) {
        this.centerPos.x = this.gameServer.config.borderLeft;
    }
    if (this.centerPos.x > this.gameServer.config.borderRight) {
        this.centerPos.x = this.gameServer.config.borderRight;
    }
    if (this.centerPos.y < this.gameServer.config.borderTop) {
        this.centerPos.y = this.gameServer.config.borderTop;
    }
    if (this.centerPos.y > this.gameServer.config.borderBottom) {
        this.centerPos.y = this.gameServer.config.borderBottom;
    }
};

PlayerTracker.prototype.sendPosPacket = function(specZoom) {
    // TODO: Send packet elsewhere so it is sent more often
    this.socket.sendPacket(new Packet.UpdatePosition(
        this.centerPos.x + this.scrambleX,
        this.centerPos.y + this.scrambleY,
        specZoom
    ));
};

PlayerTracker.prototype.sendCustomPosPacket = function(x, y, specZoom) {
    // TODO: Send packet elsewhere so it is sent more often
    this.socket.sendPacket(new Packet.UpdatePosition(
        x + this.scrambleX,
        y + this.scrambleY,
        specZoom
    ));
};

PlayerTracker.prototype.getAngle = function(x1, y1, x2, y2) {
    var deltaY = y1 - y2;
    var deltaX = x1 - x2;
    return Math.atan2(deltaX, deltaY);
};
