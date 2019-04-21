var config = require('../config');
var openspace = require('../lib/openspace.js')({port: 4682,config:config});
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Hosting the html file
app.get('/', function(req, res){
  res.sendFile(__dirname + '/FrontEnd.html');
});

// io related events
io.on('connection', function(socket){

  // openspace set planet is the event called from FrontEnd.html
  socket.on('set planet', function(msg){
    console.log(msg)
    openspace.set('NavigationHandler.OrbitalNavigator.Anchor',msg)
    openspace.trigger('NavigationHandler.OrbitalNavigator.RetargetAnchor')
  });

});

http.listen(3000, function(){
  console.log('listening on localhost:3000');
});
