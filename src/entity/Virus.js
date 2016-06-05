var Cell = require('./Cell');
var EjectedMass = require('../entity/EjectedMass');

function Virus() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 2;
    this.spiked = 1;
    this.fed = 0;
    this.wobbly = 0; // wobbly effect
    this.isMotherCell = false; // Not to confuse bots
    this.par;
	
	this.virusType = 0;
}

module.exports = Virus;

Virus.prototype = new Cell();



Virus.prototype.calcMove = null; // Only for player controlled movement

Virus.prototype.feed = function(feeder, gameServer) {
    this.setAngle(feeder.getAngle()); // Set direction if the virus explodes
    this.mass += feeder.mass;
    this.fed++; // Increase feed count
    gameServer.removeNode(feeder);

    // Check if the virus is going to explode
    if (this.fed >= gameServer.config.virusFeedAmount) {
        this.mass = gameServer.config.virusStartMass; // Reset mass
        this.fed = 0;
        gameServer.shootVirus(this);
    }

};


Virus.prototype.setVirusType = function(type)
{
	this.virusType = type;
	switch (type)
	{
		case 1: this.color = {'r':255, 'g':0, 'b':0}; break;
		case 2: this.color = {'r':255, 'g':255, 'b':0}; break;
		case 3: this.color = {'r':0, 'g':255, 'b':0}; break;
	}
}

Virus.prototype.setRandomVirusType = function(virusTypes)
{
	if (virusTypes == 1)
	{
		this.virusType = 3;
		this.color = {'r':0, 'g':255, 'b':0};
	}
	else if (virusTypes == 2)
	{
		var type = Math.floor(Math.random() * 2) + 2;
		switch (type)
		{
			case 2: this.color = {'r':255, 'g':255, 'b':0};break;
			case 3: this.color = {'r':0, 'g':255, 'b':0};break;
		}
		this.virusType = type;
	}
	else if (virusTypes == 3)
	{
		var type = Math.floor(Math.random() * 3) + 1;
		switch (type)
		{
			case 1: this.color = {'r':255, 'g':0, 'b':0};break;
			case 2: this.color = {'r':255, 'g':255, 'b':0};break;
			case 3: this.color = {'r':0, 'g':255, 'b':0};break;
		}
		this.virusType = type;
	}
}

// Main Functions

Virus.prototype.getEatingRange = function() {
    return this.getSize() * .4; // 0 for ejected cells
};
Virus.prototype.setpar = function(par) {
    this.par = par;

};
Virus.prototype.onConsume = function(consumer, gameServer) {
    switch (this.virusType)
	{
		case 1: this.onRedVirusConsume(consumer,gameServer); break;
		case 2: this.onYellowVirusConsume(consumer,gameServer); break;
		case 3: this.onGreenVirusConsume(consumer,gameServer); break;
	}
    // Prevent consumer cell from merging with other cells
    consumer.calcMergeTime(gameServer.config.playerRecombineTime);
};

Virus.prototype.onGreenVirusConsume = function(consumer, gameServer)
{
	var client = consumer.owner;
    
    var maxSplits = Math.floor(consumer.mass/16) - 1; // Maximum amount of splits
    var numSplits = gameServer.config.playerMaxCells - client.cells.length; // Get number of splits
    numSplits = Math.min(numSplits,maxSplits);
    var splitMass = Math.min(consumer.mass/(numSplits + 1), 36); // Maximum size of new splits

    // Cell consumes mass before splitting
    consumer.addMass(this.mass);

    // Cell cannot split any further
    if (numSplits <= 0) {
        return;
    }

    // Big cells will split into cells larger than 36 mass (1/4 of their mass)
    var bigSplits = 0;
    var endMass = consumer.mass - (numSplits * splitMass);
    if ((endMass > 300) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    if ((endMass > 1200) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    if ((endMass > 3000) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }

    // Splitting
    var angle = 0; // Starting angle
    for (var k = 0; k < numSplits; k++) {
        angle += 6/numSplits; // Get directions of splitting cells
        gameServer.newCellVirused(client, consumer, angle, splitMass,150, this.virusType);
        consumer.mass -= splitMass;
    }

    for (var k = 0; k < bigSplits; k++) {
        angle = Math.random() * 6.28; // Random directions
        splitMass = consumer.mass / 4;
        gameServer.newCellVirused(client, consumer, angle, splitMass,20, this.virusType);
        consumer.mass -= splitMass;
    }

}

Virus.prototype.onYellowVirusConsume = function(consumer, gameServer)
{
	if (consumer.mass < 500)
	{
		consumer.addMass(this.mass);
		return [];
	}
	var client = consumer.owner;
    
    //var maxSplits = 16;//Math.floor(consumer.mass/16) - 1; // Maximum amount of splits
    var numSplits = 10; //gameServer.config.playerMaxCells - client.cells.length; // Get number of splits
   // numSplits = 16; //Math.min(numSplits,maxSplits);
    var splitMass = Math.floor(consumer.mass/10);//Math.min(consumer.mass/(numSplits + 1), 36); // Maximum size of new splits

    // Cell consumes mass before splitting
    consumer.addMass(this.mass);

    // Splitting
    var angle = 0; // Starting angle
    for (var k = 0; k < numSplits; k++) {
        angle += 6/numSplits; // Get directions of splitting cells
        gameServer.newCellVirused(client, consumer, angle, splitMass,250, this.virusType);
        consumer.mass -= splitMass;;
    }
}

Virus.prototype.onRedVirusConsume = function(consumer, gameServer)
{
	if (consumer.mass < 500)
	{
		consumer.addMass(this.mass);
		return [];
	}
	var client = consumer.owner;
    
    //var maxSplits = 16;//Math.floor(consumer.mass/16) - 1; // Maximum amount of splits
    var numSplits = 10; //gameServer.config.playerMaxCells - client.cells.length; // Get number of splits
   // numSplits = 16; //Math.min(numSplits,maxSplits);
    var splitMass = Math.floor(consumer.mass/10);//Math.min(consumer.mass/(numSplits + 1), 36); // Maximum size of new splits

    // Cell consumes mass before splitting
    consumer.addMass(this.mass);

    // Splitting
    var angle = 0; // Starting angle
    for (var k = 0; k < numSplits; k++) {
        angle += 6/numSplits; // Get directions of splitting cells
        gameServer.newCellVirused(client, consumer, angle, splitMass,400, this.virusType);
        consumer.mass -= splitMass;
    }
}

Virus.prototype.onAdd = function(gameServer) {
    gameServer.nodesVirus.push(this);
};

Virus.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index != -1) {
        gameServer.nodesVirus.splice(index, 1);
    } else {
        console.log("[Warning] Tried to remove a non existing virus!");
    }
};
Virus.prototype.onAutoMove = function(gameServer) {
    var r = 100; // Checking radius

    var len = gameServer.nodesEjected.length;
    for (var i = 0; i < len; i++) {
        var check = gameServer.nodesEjected[i];

        var topY = check.position.y - r;
        var bottomY = check.position.y + r;
        var leftX = check.position.x - r;
        var rightX = check.position.x + r;

        if (this.collisionCheck(bottomY, topY, rightX, leftX)) {
            check.angle = this.angle; //make sure new virus shoots in same direction as this virus
            this.feed(check, gameServer);
            i--;
            len--;
        }
    }
};
