var Commands = require('./modules/CommandList');
var GameServer = require('./GameServer');

var gameServer = new GameServer();

setTimeout(function () {
  process.exit(0);
}, 60000);

process.exit(0);
