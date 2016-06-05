function UpdatePlayerlist(leaderboard) {
    this.leaderboard = leaderboard;
}

module.exports = UpdatePlayerlist;

UpdatePlayerlist.prototype.build = function() {
    // Calculate nodes sub packet size before making the data view
    var nodesLength = 0;
	var dataToSend = [];
    for (var i = 0; i < this.leaderboard.length; i++) 
	{
        var player = this.leaderboard[i];

        if (typeof player == "undefined") {
            continue;
        }

		var preparePlayerData = player.pID+"()"+(player.getName() ? player.getName() : "An Unnamed Cell")+"()"+Math.floor(player.score)+"()"+player.centerPos.x+"x"+player.centerPos.y+"()"+player.country+"()~"+Math.floor(player.avgPing)+" ms";
		dataToSend.push(preparePlayerData);
        nodesLength = nodesLength + preparePlayerData.length*2 + 2;
    }

    var buf = new ArrayBuffer(nodesLength + dataToSend.length*2 + 2);
    var view = new DataView(buf);

    view.setUint8(0, 115, true); // Packet ID

    var offset = 1;
    
	for (var i = 0; i < dataToSend.length; i++) 
	{
		for (var j = 0; j < dataToSend[i].length; j++) 
		{
			view.setUint16(offset, dataToSend[i].charCodeAt(j), true);
			offset += 2;
		}
		view.setUint16(offset, 0, true);
		offset += 2;
	}
	view.setUint16(offset, 1, true);
	offset += 2;
    return buf;
};

