// https://gist.github.com/emiax/b7a8f9058eb871bc033079e00c13e3b1
class openspace {

  constructor() {

    this.altitudeEvent;
    this.geoData=[];

    const net = require('net');
    
    this.connection = {
      connect: (onConnected) => {
        this._client = net.createConnection({ port: 8000 }, () => {
          console.log('Connected to OpenSpace backend');
          onConnected();
        });

        this._client.on('data', (data) => {
          const messageObject = JSON.parse(data.toString());
          if (messageObject.topic !== undefined) {
            this._callbacks[messageObject.topic](messageObject.payload);
          }
        });

        this._client.on('end', () => {
          console.log('Disconnected from OpenSpace');
        });

        this._callbacks = {};
        this._nextTopicId = 0;
      },

      disconnect: () => {
        this._client.end();
      },

      startTopic: (type, payload, callback) => {
        const topic = this._nextTopicId++;
        const messageObject = {
          topic: topic,
          type: type,
          payload: payload
        };
        this._callbacks[topic] = callback || function() {};
        this._client.write(JSON.stringify(messageObject) + "\n");
        return topic;
      },

      talk: (topic, payload) => {
        const messageObject = {
          topic: topic,
          payload: payload
        };
        this._client.write(JSON.stringify(messageObject) + "\n");
      }
    }

  }

  readGeoData() {
    var current = this;

    //io.open("E:\\\\OpenSpace\\\\test.txt", "w")
    //"w" is write
    //"a" is append
    // \\ = \
    //, "\\n"
    //https://www.tutorialspoint.com/lua/lua_file_io.htm
    const fs = require('fs');
    var target = __dirname.replace(/\\/g, "\\\\")+'/../api/';

    this.connection.connect(() => {
      this.connection.startTopic('luascript', {script: `file =
        io.open("`+target+`\\\\setting.txt", "w")
        file:write(openspace.globebrowsing.getGeoPositionForCamera())
        file:close()
        file = io.open("`+target+`\\\\setting1.txt", "w")
        file:write(openspace.globebrowsing.getGeoPositionForCamera(),'%')
        file:close()
        print(openspace.globebrowsing.getGeoPositionForCamera())`});
      });

      console.log(__dirname+'/../api/')

      setTimeout(
        function() {

          fs.readFile(__dirname+'/../api/setting1.txt', 'utf8', function read(err, data) {
            if (err) {
              throw err;
            }
            current.geoData[0] = data.replace('%','');

            fs.readFile(__dirname+'/../api/setting.txt', 'utf8', function read(err, data) {
              if (err) {
                throw err;
              }

              data = data.replace(current.geoData[0],'')

              var index = 0;
              // The pattern is 14SF

              var cont = true
              for(let i =0;i<data.length;i++) {

                if(data.charAt(i)=='-') {
                  index=index+1

                } else if(data.charAt(i)=='0') {
                  index=index+1
                } else {
                  break;
                }
              }

              current.geoData[1]=data.substring(0,15+index)
              current.geoData[2] = data.replace(current.geoData[1],'')

              console.log(current.geoData[0]);
              console.log(current.geoData[1]);
              console.log(current.geoData[2]);

              current.geoData[0] = parseFloat(current.geoData[0])
              current.geoData[1] = parseFloat(current.geoData[1])
              current.geoData[2] = parseFloat(current.geoData[2])
            });
          });

        }, 2000);

      }

      moveAltitude(type,value) {


        var lat = this.geoData[0];
        var log = this.geoData[1];
        var alti = this.geoData[2];

        alti=alti+value
        if(alti<100000) alti=100000

        this.geoData[2] = alti

        // console.log(alti);

        this.connection.connect(() => {
          this.connection.startTopic('luascript', {script: `openspace.globebrowsing.goToGeo(`+lat+`, `+log+`, `+alti+`)`});
        });

      }

      moveGeo(speed,type,multi,type2,multi2) {

        //-50.5877 = S, -16.1924 = E
        //Range from 0 to 180

        var lat = this.geoData[0];
        var log = this.geoData[1];
        var alti = this.geoData[2];

        if(type=='N') {
          lat=lat+speed*multi/25;
        } else if(type=='S')  {
          lat=lat-speed*multi/25;
        } else if(type=='E') {
          log=log+speed*multi/25;
        } else if(type=='W')  {
          log=log-speed*multi/25;
        }

        if(type2=='N') {
          lat=lat+speed*multi2/25;
        } else if(type2=='S')  {
          lat=lat-speed*multi2/25;
        } else if(type2=='E') {
          log=log+speed*multi2/25;
        } else if(type2=='W')  {
          log=log-speed*multi2/25;
        }

        this.geoData[0] = lat;
        this.geoData[1] = log;


        this.connection.connect(() => {
          this.connection.startTopic('luascript', {script: `openspace.globebrowsing.goToGeo(`+lat+`, `+log+`, `+alti+`)`});
        });

      }

    }

    module.exports = openspace;
