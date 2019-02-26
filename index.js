var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ip = require('ip');
var path = require('path');
const fs = require('fs');

// General Library\
let openspaceLib = require('./lib/openspace.js');
const openspace = new openspaceLib();

// Sending all the files to client
var Path = path.join(__dirname, 'Front_End');
app.use(require('express').static(Path));

// Hosting Server
var server = http.listen(3000, function(){
  var port = server.address().port;
  console.log('listening on http://'+ip.address()+':'+port+'/');
});

var time = new Date();

setTimeout(
  function(){
    openspace.readGeoData()}
    ,2000);

    var altitudeEvent;
    var frame = 50

    io.on('connection', function(socket){

      socket.on('altitude start', function(msg){
        var pressTime = new Date();
        console.log('message: altitude start - ' + msg);
        console.log('message: moving altitude... - ' + msg);

        var power = Math.log(openspace.geoData[2]) / Math.log(10);
        if(power<5) power=5
        var type = (msg=='up') ? true:false
        var value = (msg=='up') ? -1*Math.pow(10,power-2):Math.pow(10,power-2)
        openspace.moveAltitude(type,value)

        altitudeEvent = setInterval(function(){
          var passingTime = new Date();
          var power = Math.log(openspace.geoData[2]) / Math.log(10);
          if(power<5) power=5
          var type = (msg=='up') ? true:false
          var value = (msg=='up') ? -1*Math.pow(10,power-2):Math.pow(10,power-2)

          openspace.moveAltitude(type,value+value*(passingTime-pressTime)/500)
          console.log('message: moving altitude... - ' + msg + '   since last time' + (passingTime-pressTime));
        }, frame);

      });

      socket.on('altitude end', function(msg){
        console.log('message: altitude end - ' + msg);
        clearInterval(altitudeEvent);
      });

      socket.on('latitude', function(msg){

        var curTime = new Date();

        //          if((curTime-time)>frame/2) {
        time = curTime
        //90N 0E 270S 180W
        if(msg.angle>=0 && msg.angle<=90) {
          console.log('message: latitude- N:' + msg.angle/90 + '- E:' + (90-msg.angle)/90);
          openspace.moveGeo(msg.distance,'N',msg.angle/90,'E',(90-msg.angle)/90)
        } else if (msg.angle>=270) {
          console.log('message: latitude- E:' + (msg.angle - 270)/90 + '- S:' + (360 - msg.angle)/90);
          openspace.moveGeo(msg.distance,'E',(msg.angle - 270)/90,'S',(360 - msg.angle)/90)
        } else if (msg.angle>=180 && msg.angle<=270) {
          console.log('message: latitude- S:' + (msg.angle - 180)/90 + '- W:' + (270 - msg.angle)/90);
          openspace.moveGeo(msg.distance,'S',(msg.angle - 180)/90,'W',(270 - msg.angle)/90)
        } else if (msg.angle>=90 && msg.angle<=180) {
          console.log('message: latitude- W:' + (msg.angle - 90)/90 + '- N:' + (180 - msg.angle)/90);
          openspace.moveGeo(msg.distance,'W',(msg.angle - 90)/90,'N',(180 - msg.angle)/90)
        }
        console.log('message: latitude- ' + msg.distance);
        //          }

      });

      socket.on('chat message', function(msg){
        console.log('message: ' + msg);

        openspace.connection.connect(() => {
          // First, make Earth bigger
          openspace.readGeoData();
          openspace.connection.startTopic('set', {property: 'NavigationHandler.Origin', value: msg});

        });

      });

      socket.on('get img', function(){

        // https://stackoverflow.com/questions/26331787/socket-io-node-js-simple-example-to-send-image-files-from-server-to-client
        fs.readFile(__dirname + imgTest[Math.round(Math.random())], function(err, buf){
          // it's possible to embed binary data
          // within arbitrarily-complex objects
          socket.emit('image', { image: true, buffer: buf.toString('base64') });
        });
        ;
      });

    });


    //Img from the internet can be access, but not download
    // var imgTest = ['https://wallpapercave.com/wp/sKWDIq4.jpg','https://www.gstatic.com/earth/social/00_generic_facebook-001.jpg']
    var imgTest = ['/img/1.jpg','/img/2.jpg']
