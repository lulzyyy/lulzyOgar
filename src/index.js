// Imports
var Commands = require('./modules/CommandList');
var GameServer = require('./GameServer');

var Version = '11.8.5';

// Init variables
var showConsole = true;

// Start msg
console.log("\u001B[33m                                        _ _       _              _ ");
console.log("                                       | (_)     (_)_           | |");
console.log("  ___   ____  ____  ____    _   _ ____ | |_ ____  _| |_  ____ _ | |");
console.log(" / _ \\ / _  |/ _  |/ ___)  | | | |  _ \\| | |    \\| |  _)/ _  ) || |");
console.log("| |_| ( ( | ( ( | | |      | |_| | | | | | | | | | | |_( (/ ( (_| |");
console.log(" \\___/ \\_|| |\\_||_|_|       \\____|_| |_|_|_|_|_|_|_|\\___)____)____|");
console.log("      (_____|                                                      \u001B[0m");

console.log("\x1b[32m[Game] Ogar Unlimited - An open source Agar.io server implementation");
console.log("[Game] By The AJS development team\x1b[0m");
console.log("[Game] Server version is " + Version);
var request = require('request');

// Handle arguments
process.argv.forEach(function (val) {
  if (val == "--noconsole") {
    showConsole = false;
  } else if (val == "--help") {
    console.log("Proper Usage: node index.js");
    console.log("    --noconsole         Disables the console");
    console.log("    --help              Help menu.");
    console.log("");
  }
});

// Run Ogar
var gameServer = new GameServer();
gameServer.start();
// Add command handler
gameServer.commands = Commands.list;
// Initialize the server console
if (showConsole) {
  var readline = require('readline');
  var in_ = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  setTimeout(prompt, 100);
}

// Console functions

function prompt() {
  in_.question(">", function (str) {
    parseCommands(str);
    return prompt(); // Too lazy to learn async
  });
}

function parseCommands(str) {
  // Log the string
  gameServer.log.onCommand(str);

  // Don't process ENTER
  if (str === '')
    return;

  // Splits the string
  var split = str.split(" ");

  // Process the first string value
  var first = split[0].toLowerCase();

  // Get command function
  var execute = gameServer.commands[first];
  if (typeof execute != 'undefined') {
    execute(gameServer, split);
  } else {
    console.log("[Console] Invalid Command, try \u001B[33mhelp\u001B[0m for a list of commands.");
  }
}
