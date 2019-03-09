const fs = require('fs');
var app = require('express')();

var method = 'https'
if(fs.readFileSync('./https/key.pem') && fs.readFileSync('./https/cert.pem')) {

  var options = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
  };

  try {
    var http = require('https').Server(options,app);
  } catch (err) {
    // console.log(err)
    var http = require('http').Server(app);
    var method = 'http'
    console.log('SSH file is not working!! Switch to http')
  }


} else {
  var http = require('http').Server(app);
  var method = 'http'
}

var io = require('socket.io')(http);
var ip = require('ip');
var path = require('path');

// General Library\
let openspaceLib = require('./lib/openspace.js');
const openspace = new openspaceLib({port: 4682});

// Sending all the files to client
var Path = path.join(__dirname, 'Front_End');
app.use(require('express').static(Path));

// Hosting Server
var server = http.listen(3000, function(){
  var port = server.address().port;
  console.log('listening on '+method+'://'+ip.address()+':'+port+'/');
  if(method=='http')
  console.log('WARNING: Server current is running in http mode, so the speech control will not work in chrome')

  var QRCode = require('qrcode')
  QRCode.toString(method+'://'+ip.address()+':'+port+'/', function (err, string) {
    if (err) throw err
    console.log(string)
  })

});

server.on('close', function() {
  console.log(' Stopping ...');
  openspace.clear('all');
  // https://github.com/socketio/socket.io/issues/1602
  io.close();
  // // This will show error.. but without this line there is a bug...
  server.destroy();

});

process.on('SIGINT', function() {
  server.close();
  // https://stackoverflow.com/questions/44788982/node-js-ctrl-c-doesnt-stop-server-after-starting-server-with-npm-start
  process.exit(1)
});


var time = new Date();

var altitudeEvent;
var frame = 100

io.on('connection', function(socket){

  var address = socket.id;
  // var address = socket.client.conn.remoteAddress;
  // var address= socket.request.socket.remoteAddress;
  // var address= socket.handshake.address;
  console.log('New connection from ' + address);

  socket.on('altitude start', function(msg){
    var pressTime = new Date();
    console.log('message: altitude start - ' + msg);
    console.log('message: moving altitude... - ' + msg);

    var type = (msg=='up') ? true:false
    var value = (msg=='up') ? -1: 1;
    openspace.moveAltitude(type,value)

    altitudeEvent = setInterval(function(){
      var passingTime = new Date();
      var type = (msg=='up') ? true:false

      var value = (msg=='up') ? -1: 1;
      value = value+value*(passingTime-pressTime)/500;

      openspace.moveAltitude(type,value)
      console.log('message: moving altitude... - ' + msg + '   since last time' + (passingTime-pressTime));
    }, frame);

  });

  socket.on('altitude end', function(msg){
    console.log('message: altitude end - ' + msg);
    clearInterval(altitudeEvent);
    openspace.clear('alt');
  });


  socket.on('latitude start', function(msg){

    console.log('latitude start')

  });

  socket.on('latitude end', function(msg){

    console.log('latitude end')
    openspace.clear('lat');

  });

  socket.on('latitude move', function(msg){
    let curTime = new Date();

    if((curTime-time)>frame/2) {
      time = curTime
      openspace.moveGeo(msg)
    }

  });

  socket.on('change planet', function(msg){
    console.log('message: ' + msg);

    openspace.changePlanet(msg)

  });

  socket.on('get img', function(){

    // var address = this.id
    console.log(address+' request snapshot');

    var setting = {
      OpenSpacePath: "C:/Users/planetarium/Desktop/OpenSpaceWebSocketNavigation/screenshots",
      socketObj: socket
    }

    openspace.screenshot(setting)

  });

  console.log(Object.keys(io.sockets.sockets))

  socket.on('disconnect', function () {
    // var address = this.id
    console.log(address+' disconnected');
  });
});
