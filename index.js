const fs = require('fs');
var app = require('express')();
var config = require('./config');

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
var path = require('path');
// Sending all the files to client
var Path = path.join(__dirname, 'Front_End');
app.use(require('express').static(Path));
// app.enable('trust proxy')


// Hosting Server
var ip = require('./lib/ip.js');

var server = http.listen(3000, function(){
  if(method=='http')
  console.log('WARNING: Server current is running in http mode, so the speech control will not work in chrome')

  for (let i = 0;i<ip.addresses.length;i++) {

    var port = server.address().port;
    console.log('Interface ---------- '+ip.interfaces[i])
    console.log('listening on '+method+'://'+ip.addresses[i]+':'+port+'/');

    var QRCode = require('qrcode')
    QRCode.toString(method+'://'+ip.addresses[i]+':'+port+'/', function (err, string) {
      if (err) throw err
      console.log(string)
    })
}

  if(ip.addresses.length>1)
  console.log('------------------------------------------------------------')
  console.log('Seems like you have more than one ip address, if one ip address is not working, try the other one.')
  console.log('------------------------------------------------------------')

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


// General Library\
var openspace = require('./lib/openspace.js')({port: 4682,config:config});
const socket_server = require('./lib/socket_server.js')(io,config,openspace);
