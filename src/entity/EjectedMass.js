var Cell = require('./Cell');

function EjectedMass() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

	this.isSpamMass = false;
    this.cellType = 3;
    this.size = Math.ceil(Math.sqrt(100 * this.mass));
    this.squareSize = (100 * this.mass) >> 0; // not being decayed -> calculate one time
}

module.exports = EjectedMass;
EjectedMass.prototype = new Cell();

EjectedMass.prototype.getSize = function() {
    return this.size;
};

EjectedMass.prototype.getSquareSize = function() {
    return this.squareSize;
};

EjectedMass.prototype.calcMove = null; // Only for player controlled movement

// Main Functions

EjectedMass.prototype.sendUpdate = function() {
    // Whether or not to include this cell in the update packet
    return this.moveEngineTicks != 0;
};

EjectedMass.prototype.onRemove = function(gameServer) {
    // Remove from list of ejected mass
   // var index = gameServer.nodesEjected.indexOf(this);
   // if (index != -1) {
   //     gameServer.nodesEjected.splice(index, 1);
   // }
};

EjectedMass.prototype.onConsume = function(consumer, gameServer) {
    // Adds mass to consumer
    if (!this.isSpamMass)
		consumer.addMass(this.mass);
};

EjectedMass.prototype.onAutoMove = function(gameServer) {
    var v = gameServer.getNearestVirus(this);
        if (v) { // Feeds the virus if it exists
            v.feed(this,gameServer);
            return true;
        }
};

EjectedMass.prototype.moveDone = function(gameServer) {
    if (!this.onAutoMove(gameServer)) 
	{
		if (this.isSpamMass)
			gameServer.removeNode(this);
		//else
		//	gameServer.nodesEjected.push(this);
    }
};

EjectedMass.prototype.onAdd = function(gameServer) {
	//gameServer.nodesEjected.push(this);
};
