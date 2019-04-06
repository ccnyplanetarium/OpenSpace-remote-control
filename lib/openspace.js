/**
* OpenSpace WebSocket related communication method
* @constructor openspace

* @param {object} setting The configuration object

* @property {object} config The configuration object stored from the parameter
* @property {library} robot The robotjs library
* @property {library} ws The WebSocket use to connect OpenSpace backend
*/

class openspace {

  constructor(setting) {

    var port = setting['port']
    this.config = setting['config']

    this.robot = require("robotjs");
    this.init()

    const net = require('net');
    const WebSocket = require('ws');

    this.ws = new WebSocket('ws://' + 'localhost' + ':' + port);

    this.ws.on('open', (connection) => {
      console.log('Connected to local OpenSpace server');
    });

  }

  /**
  * Function to initial mouse control related (robotjs) variable

  * @property {array-number} mouse The user's mouse x and y position
  * @property {array-number} altY How many y pixels should mouse increase/decrease while holding right key (zoom in/zoom out)
  * @property {array-number} latY How many y pixels should mouse increase/decrease while holding left key (rotate up/rotate down)
  * @property {array-number} latX How many x pixels should mouse increase/decrease while holding left key (rotate left/rotate right)
  */
  init() {
    this.mouse = this.robot.getMousePos();
    this.altY = 0;
    this.latY = 0;
    this.latX = 0;
  }

  /**
  * Function to clear mouse control

  * @param {string} type 'alt' / 'lat' / 'all'

  */
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

  /**
  * Function to move altitude (zoom in or zoom out)

  * @param {string} type -1 (zoom out) / 1 (zoom in)
  * @param {string} value How many pixels should be moved

  */
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

  /**
  * Function to move latitude and longitude (rotation)

  * @param {array-number} msg A array includes {angle,distance}

  * @property {object} msg.angle What is angle triggered on joystick.
  * @property {library} msg.distance What is distance triggered on joystick.

  */
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

  /**
  * Function to screenshot OpenSpace, then send the screenshot to client's device

  * @param {object} setting The configuration object

  */
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

    /**
    * Function to change OpenSpace current focus planet

    * @param {string} planet The number of planet

    */
    changePlanet(planet) {

      this.set('NavigationHandler.OrbitalNavigator.Anchor',planet)
      this.trigger('NavigationHandler.OrbitalNavigator.RetargetAnchor')
    }

    /**
    * Function to trigger the api script

    * @param {object} event The api event

    */
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

    /**
    * Function to set the api value

    * @param {object} event The api event

    */
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

    /**
    * Function to run lua script

    * @param {object} script The lua script

    */
    lua(script) {
      this.ws.send(JSON.stringify(
        {
          topic: 0,
          type: 'luascript',
          payload: {
            script
          }
        }
      ));
    }

  }

  module.exports = function(setting) {
    return new openspace(setting);
  }
