/**
* OpenSpace WebSocket related communication method
* @constructor socket_server

* @param {library} io socket.io library
* @param {object} setting The configuration object
* @param {library} openspace lib/openspace library

* @property {library} io socket.io library
* @property {object} config The configuration object stored from the parameter
* @property {array} userList The list of connected clients
* @property {array} cameraAccess The list of clients who can access camera
* @property {array} planetAccess The list of clients who can access planet change
* @property {array} adminID The socket id of admin
*/
class socket_server {

  constructor(io,config,openspace) {
    this.io = io;
    this.config = config;

    this.userList = ['undefined'];
    this.cameraAccess = [config.superUser];
    this.planetAccess = [config.superUser];

    var socketServer = this;

    var time = new Date();

    var altitudeEvent;
    var frame = 100

    io.on('connection', function(socket){

      var address = socket.id;

      socket.emit('reconnect user')
      socketServer.config.SocketLog['connection'] && console.log('New connection from ' + address);

      /**
      * Function to create user

      * @param {string} msg The user name

      */
      socket.on('create user', function(msg){

        if(socketServer.userList.includes(msg)) {
          socket.emit('alert', "Sorry, this username is already registered!!");
        } else {

          socketServer.userList.push(msg)
          socket.username = msg;
          if(msg==config.superUser) {
            socketServer.adminID = socket.id
            socketServer.config.SocketLog['account'] && console.log('new admin is created!! - ' + msg);
          } else {
            socketServer.config.SocketLog['account'] && console.log('new user is created!! - ' + msg);
          }

          // https://stackoverflow.com/questions/37690419/not-allowed-to-load-local-resources
          socket.emit('redirect', "/user.html");
        }


        // socketServer.initAdmin('refresh',socket)
        socketServer.initAdmin('add',socket)

      });

      /**
      * Function to change a user's ability to access OpenSpace control

      * @param {array} msg
      * @param {array} msg.type The event type (add gamepad/remove gamepad)
      * @param {array} msg.id The user socket id

      */
      socket.on('access user', function(msg){

        if (!socketServer.checkAccess(socket,' change access')) return

        var username = io.sockets.sockets[msg.id].username

        socketServer.config.SocketLog['account'] && console.log('access user '+username+', msg: ')
        socketServer.config.SocketLog['account'] && console.log(msg)


        if(msg.type=='add gamepad') {
          socketServer.cameraAccess.push(username)
          // console.log(socketServer.cameraAccess)
          socketServer.initUser(socket,io,msg.id,'#mainContent','<a href="control.html" class="ui green label">You can access the control</a>')
        } else if(msg.type=='remove gamepad') {
          socketServer.cameraAccess = socketServer.cameraAccess.filter(v => v !== username);
          socketServer.initUser(socket,io,msg.id,'#mainContent','<a class="ui red label">You CANNOT access the control</a>')
          io.to(msg.id).emit('redirect', '/user.html');
        }
        // if(msg.type=='add plane') {
        //   socketServer.planetAccess.push(username)
        //   console.log(socketServer.planetAccess)
        //   socketServer.initUser(socket,io,msg.id,'#secContent','<a class="ui green label">You can access planet navigation</a>')
        // } else if(msg.type=='remove plane') {
        //   console.log('removing...')
        //   socketServer.planetAccess = socketServer.planetAccess.filter(v => v !== username);
        //   socketServer.initUser(socket,io,msg.id,'#secContent','<a class="ui red label">You CANNOT access planet navigation</a>')
        // }

        // socketServer.initAdmin('remove',io.sockets.sockets[msg.id])
        // socketServer.initAdmin('add',io.sockets.sockets[msg.id])
      });

      /**
      * Function to logout a user

      * @param {string} msg The user name

      */
      socket.on('logout user', function(msg){
        // https://stackoverflow.com/questions/9792927/javascript-array-search-and-remove-string
        if(socketServer.userList.includes(msg)) {
          socketServer.userList = socketServer.userList.filter(v => v !== msg);

          if(socket.username==config.superUser) {
            socketServer.adminID = false;
          }

          socket.username = '';
        }
      });

      /**
      * Function to check if a user can access OpenSpace control frontend

      * @param {string} msg The user name

      */
      socket.on('check user', function(msg){
        if(!socketServer.cameraAccess.includes(msg))
        socket.emit('redirect', "/user.html");
      });

      /**
      * Function to reconnect a user

      * @param {string} msg The user name

      */
      socket.on('reconnect user', function(msg){

        if(!socketServer.userList.includes(msg)) {
          socketServer.userList.push(msg)
          socket.username = msg;
          socketServer.config.SocketLog['reconnect'] && console.log(socket.username + " is reconnected!")
        }

        if(socket.username==config.superUser) {
          socketServer.adminID = socket.id
        }

        if(socketServer.cameraAccess.includes(msg) && socket.username!=config.superUser) {
          socket.emit('content setup', {target:'#mainContent',content:'<a href="control.html" class="ui green label">You can access the control</a>'})
        } else if (!socketServer.cameraAccess.includes(msg) && socket.username!=config.superUser) {
          socket.emit('content setup', {target:'#mainContent',content:'<a class="ui red label">You CANNOT access the control</a>'})
        }

        // if(socketServer.planetAccess.includes(msg) && socket.username!=config.superUser) {
        //   socket.emit('admin setup', {target:'#secContent',content:'<a class="ui green label">You can access planet naviation</a>'})
        // } else if (!socketServer.planetAccess.includes(msg) && socket.username!=config.superUser) {
        //   socket.emit('admin setup', {target:'#secContent',content:'<a class="ui red label">You CANNOT access planet naviation</a>'})
        // }
        if(socket.username==config.superUser)
        socketServer.initAdmin('init')

        socketServer.initAdmin('add',socket)
      });

      /**
      * Function to redirect a user

      * @param {string} msg The user name

      */
      socket.on('redirect', function(msg){
        socket.emit('redirect', msg);
      });

      /**
      * Function to handle OpenSpace alitude start event

      * @param {string} msg 'up' or 'down'

      */
      socket.on('altitude start', function(msg){

        if (!socketServer.checkAccess(socket,'altitude')) return

        var pressTime = new Date();
        socketServer.config.OpenSpaceLog['Altitude'] && console.log('message: altitude start - ' + msg);
        socketServer.config.OpenSpaceLog['Altitude'] && console.log('message: moving altitude... - ' + msg);

        var type = (msg=='up') ? true:false
        var value = (msg=='up') ? -1: 1;
        openspace.moveAltitude(type,value)

        altitudeEvent = setInterval(function(){
          var passingTime = new Date();
          var type = (msg=='up') ? true:false

          var value = (msg=='up') ? -1: 1;
          value = value+value*(passingTime-pressTime)/500;

          openspace.moveAltitude(type,value)
          socketServer.config.OpenSpaceLog['Altitude'] && console.log('message: moving altitude... - ' + msg + '   since last time' + (passingTime-pressTime));
        }, frame);

      });

      /**
      * Function to handle OpenSpace alitude end event

      * @param {string} msg 'up' or 'down'

      */
      socket.on('altitude end', function(msg){
        socketServer.config.OpenSpaceLog['Altitude'] && console.log('message: altitude end - ' + msg);
        clearInterval(altitudeEvent);
        openspace.clear('alt');
      });

      /**
      * Function to handle OpenSpace latitude start event

      */
      socket.on('latitude start', function(msg){

        socketServer.config.OpenSpaceLog['Geography'] && console.log('latitude start')

      });

      /**
      * Function to handle OpenSpace latitude end event

      */
      socket.on('latitude end', function(msg){

        socketServer.config.OpenSpaceLog['Geography'] && console.log('latitude end')
        openspace.clear('lat');

      });

      /**
      * Function to handle OpenSpace latitude move event
      @function
      * @param {array-number} msg A array includes {angle,distance}

      * @property {object} msg.angle What is angle triggered on joystick.
      * @property {library} msg.distance What is distance triggered on joystick.

      */
      socket.on('latitude move', function(msg){
        if (!socketServer.checkAccess(socket,'latitude')) return

        let curTime = new Date();

        if((curTime-time)>frame/2) {
          time = curTime
          openspace.moveGeo(msg)
        }

      });

      /**
      * Function to handle OpenSpace OpenSpace change planet event

      * @param {string} msg The number of planet

      */
      socket.on('change planet', function(msg){

        if (!socketServer.checkAccess(socket,'change planet')) return

        socketServer.config.OpenSpaceLog['MovePlanet'] && console.log('Move to: ' + msg);

        openspace.changePlanet(msg)

        for (var socketId in io.sockets.sockets) {
          var username = io.sockets.sockets[socketId].username;
          if(username != config.superUser) {
            io.to(socketId).emit('wiki',
            msg
          );
        }
      }

    });

    /**
    * Function to handle OpenSpace screenshot event

    */
    socket.on('get img', function(){

      // var address = this.id
      socketServer.config.SocketLog['account'] && console.log(address+' request snapshot');

      var setting = {
        OpenSpacePath: config.OpenSpaceScreenshotPath,
        socketObj: socket
      }

      openspace.screenshot(setting)

    });

    /**
    * Function to receive log from frontend

    */
    socket.on('console log', function(msg){

      socketServer.config.SocketLog['log'] && console.log(msg);

    });


    // console.log(Object.keys(io.sockets.sockets))

    socket.on('disconnect', function () {

      socketServer.initAdmin('remove',socket)

      // var address = this.id
      if (socket.username) {
        socketServer.userList = socketServer.userList.filter(v => v !== socket.username);
        socketServer.config.SocketLog['disconnect'] && console.log( socket.username + " disconnected");
      } else {
        socketServer.config.SocketLog['disconnect'] && console.log('socket disconnected before username set');
      }
    });
  });
}

/**
* Function to initialize admin frontend content

* @param {string} type 'add' / 'remove' / 'init' / 'refresh'
* @param {object} socket The socket object

*/
initAdmin(type,socket) {
  var config = this.config;

  // var idList = [];

  // for (var socketId in io.sockets.sockets) {
  //   var username = io.sockets.sockets[socketId].username;
  //   if(username == config.superUser) {
  //
  //     var admin = socketId;
  //
  //   } else {
  // idList.push(socketId)
  //   }
  // }


  if(type=='add') {
    var content = '';
    if(!this.adminID || socket.id==this.adminID || socket.username == undefined)
    return

    // this.userList = this.userList.filter(v => v !== config.superUser);
    // for(let i =0; i<idList.length;i++) {

    var event = (this.cameraAccess.includes(socket.username)) ? "active" : ''
    // var event1 = (this.planetAccess.includes(this.userList[i])) ? "active" : ''

    content+= `<div id="-----`+socket.id+`" class="ui card">
    <div class="content">`+
    // <i id="+-+_+`+idList[i]+`" onclick="access(this)" class="right floated paper plane outline icon `+event1+`"></i>+
    // <i id="+_+_+`+socket.id+`" onclick="access(this)" class="right floated gamepad icon `+event+`"></i>+
    `<div class="header">`+socket.username+`</div>
    <div class="description">
    `+socket.id+`
    </div>
    </div>
    <div class="extra content">
    <span class="left floated gamepad">
    <i id="_+_+_`+socket.id+`" onclick="access(this)" class="gamepad icon `+event+`"></i>
    Joystick
    </span>`+
    // <span class="right floated paper plane outline">
    // <i id="_+-+_`+idList[i]+`" onclick="access(this)" class="paper plane outline icon `+event1+`"></i>
    // Navigation
    // </span>
    `</div>
    </div>
    `
    // }
    this.io.to(this.adminID).emit('content setup',{target:'#cardDeck',content:
    content,id:'#-----'+socket.id}
  );
} else if (type=='remove') {
  this.io.to(this.adminID).emit('content remove',{target:'#-----'+socket.id});

} else if (type=='init') {

  this.io.to(this.adminID).emit('content replace',{target:'#cardDeck',content:''});

  for (var socketId in this.io.sockets.sockets) {
    var username =  this.io.sockets.sockets[socketId].username;
    if(username != config.superUser) {

      this.initAdmin('add',this.io.sockets.sockets[socketId])
    }
  }

} else if (type=='refresh') {

  this.io.to(this.adminID).emit('content refresh',{target:'.content .header',target2:'.content .description',username:socket.username,id:socket.id});
}
}

/**
* Function to initialize user frontend content

* @param {object} socket The socket object
* @param {library} io socket.io library
* @param {int} id The user id
* @param {string} target The frontend DOM id
* @param {string} content The frontend content

*/
initUser(socket,io,id,target,content) {
  var config = this.config

  if(socket.username!=config.superUser)
  return;

  this.io.to(id).emit('content replace',
  {target:target,content:content}
);
}

/**
* Function to check if a user can access certain control

* @param {object} socket The socket object
* @param {string} type The type of control

*/
checkAccess(socket,type) {

  if(!this.cameraAccess.includes(socket.username)) {
    socket.emit('alert', "Sorry, you are not admin!!");
    this.config.SocketLog['access'] && console.log(socket.username+ " is try to "+type)
    return false;
  } else {return true}
}

}


module.exports = function(io,config,openspace) {
  return new socket_server(io,config,openspace);
}
