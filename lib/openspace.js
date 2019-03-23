// https://gist.github.com/emiax/b7a8f9058eb871bc033079e00c13e3b1
class openspace {

  constructor(setting) {

    var port = setting['port']
    this.config = setting['config']

    this.altitudeEvent;
    this.geoData=[];
    this.robot = require("robotjs");
    this.init()
    
    const net = require('net');
    const WebSocket = require('ws');

    this.ws = new WebSocket('ws://' + 'localhost' + ':' + port);

    this.ws.on('open', (connection) => {
      console.log('Connected to local OpenSpace server');
    });

  }

  init() {
    this.mouse = this.robot.getMousePos();
    this.altY = 0;
    this.latY = 0;
    this.latX = 0;
  }

  clear(type) {
    var x = this.mouse.x,
    y = this.mouse.y;

    if(type=='alt' || type=='all') {
      this.robot.mouseToggle("up","right");
      this.altY = 0;

      if(this.latY>0)
      y = this.latY + y;
      if(this.latX>0)
      x = this.latX + x;
      this.robot.moveMouse(x, y);
    }

    if(type=='lat' || type=='all') {
      this.robot.mouseToggle("up","left");

      this.latX = 0;
      this.latY = 0;
      if(this.altY>0)
      y = this.altY + y;
      this.robot.moveMouse(x, y);
    }
  }
  moveAltitude(type,value) {
    value = value*20
    if(value>200) value = 200;
    if(value<-200) value = -200;

    var x = this.mouse.x,
    y = this.mouse.y;

    this.config.OpenSpaceLog['Altitude'] && console.log(value)

    this.altY = value;
    y = y+value + this.latY;
    x = x + this.latX;

    this.robot.mouseToggle("down","right");


    var mouse = this.robot.getMousePos();

    if(mouse.y !=y)
    this.robot.dragMouse(x, y);


  }

  moveGeo(msg) {

    var speed,type,multi,type2,multi2;

    if(msg.angle>=0 && msg.angle<=90) {
      this.config.OpenSpaceLog['Geography'] && console.log('message: latitude- N:' + msg.angle/90 + '- E:' + (90-msg.angle)/90);
      speed = msg.distance;
      type = 'N';
      multi = msg.angle/90;
      type2 = 'E';
      multi2 = (90-msg.angle)/90;
    } else if (msg.angle>=270) {
      this.config.OpenSpaceLog['Geography'] && console.log('message: latitude- E:' + (msg.angle - 270)/90 + '- S:' + (360 - msg.angle)/90);
      speed = msg.distance;
      type = 'E';
      multi = (msg.angle - 270)/90;
      type2 = 'S';
      multi2 = (360 - msg.angle)/90;
    } else if (msg.angle>=180 && msg.angle<=270) {
      this.config.OpenSpaceLog['Geography'] && console.log('message: latitude- S:' + (msg.angle - 180)/90 + '- W:' + (270 - msg.angle)/90);
      speed = msg.distance;
      type = 'S';
      multi = (msg.angle - 180)/90;
      type2 = 'W';
      multi2 = (270 - msg.angle)/90;

    } else if (msg.angle>=90 && msg.angle<=180) {
      this.config.OpenSpaceLog['Geography'] && console.log('message: latitude- W:' + (msg.angle - 90)/90 + '- N:' + (180 - msg.angle)/90);
      speed = msg.distance;
      type = 'W';
      multi = (msg.angle - 90)/90;
      type2 = 'N';
      multi2 = (180 - msg.angle)/90;
    }

    this.config.OpenSpaceLog['Geography'] && console.log('message: latitude- ' + msg.distance);


    var x = this.mouse.x,
    y = this.mouse.y,
    base = 20;

    multi = multi * 10;
    multi2 = multi2 * 10;

    if(type=='N') {
      y = y + base*multi
    } else if(type=='S')  {
      y = y - base*multi
    } else if(type=='E') {
      x = x - base*multi
    } else if(type=='W')  {
      x = x + base*multi
    }

    if(type2=='N') {
      y = y + base*multi2
    } else if(type2=='S')  {
      y = y - base*multi2
    } else if(type2=='E') {
      x = x - base*multi2
    } else if(type2=='W')  {
      x = x + base*multi2
    }


    this.latY = y - this.mouse.y
    this.latX = x - this.mouse.x

    y = y+this.altY;


    this.robot.mouseToggle("down","left");

    var mouse = this.robot.getMousePos();

    if(mouse.x !=x  || mouse.y !=y)
    this.robot.dragMouse(x, y);

  }

  screenshot(setting) {

    var path = setting['OpenSpacePath']
    var socket = setting['socketObj']


    this.trigger('RenderEngine.TakeScreenshot')

    const fs = require('fs');

    var screenshotPath = path,
    dir,
    imgName,
    imgTime = 500;
    let latestStats = false,
    latestIndex;

    // Finding the latest folder
    fs.readdir(screenshotPath,function(err, list){
      list.forEach(function(file,index){
        var stats = new Date(fs.statSync(screenshotPath+"/"+file).mtime);
        this.config.OpenSpaceLog['Screenshot'] && console.log(index);

        if(!latestStats) {
          latestStats = stats;
          latestIndex = index;
        } else if(latestStats < stats) {
          latestStats = stats;
          latestIndex = index;
        }
      })
    })

    // Generating the image
    setTimeout(
      function() {

        fs.readdir(screenshotPath,function(err, list){
          // console.log(latestIndex)
          // dir = list[list.length-1]
          dir = list[latestIndex]

          this.config.OpenSpaceLog['Screenshot'] && console.log(screenshotPath+"/"+dir);

          fs.readdir(screenshotPath+"/"+dir,function(err, list){
            imgName = list[list.length-1]
            this.config.OpenSpaceLog['Screenshot'] && console.log(list[list.length-1]);


            // https://stackoverflow.com/questions/26331787/socket-io-node-js-simple-example-to-send-image-files-from-server-to-client
            fs.readFile(screenshotPath+"/"+dir+"/"+imgName , function(err, buf){
              // it's possible to embed binary data
              // within arbitrarily-complex objects
              socket.emit('image', { image: true, buffer: buf.toString('base64') });
            });

          })

        })

      },imgTime)

    }

    changePlanet(planet) {

      this.set('NavigationHandler.OrbitalNavigator.Anchor',planet)
      this.trigger('NavigationHandler.OrbitalNavigator.RetargetAnchor')
    }

    trigger(event) {
      this.ws.send(JSON.stringify(
        {
          topic: 0,
          type: 'trigger',
          payload: {
            property: event
          }
        }
      ));
    }

    set(event,result) {
      this.ws.send(JSON.stringify(
        {
          topic: 0,
          type: 'set',
          payload: {
            property: event, value: result
          }
        }
      ));
    }
  }

  module.exports = function(setting) {
    return new openspace(setting);
  }
