var config = {};

config.superUser = 'admin';
config.OpenSpaceScreenshotPath = "YOUR PATH to /OpenSpace/screenshots";
config.OpenSpaceLog = {
  Altitude: false,
  Geography: false,
  Screenshot: false,
  MovePlanet: false
}

config.SocketLog = {
  connection: false,
  reconnect: true,
  disconnect: true,
  account: true,
  access: true,
  log: true
}

module.exports = config;
