var config = require('../config');
var openspace = require('../lib/openspace.js')({port: 4682,config:config});

setTimeout( //Need to wait ws connection
  function() {

//get event
openspace.get('NavigationHandler.OrbitalNavigator.Anchor',(response) => {
    console.log(response);
    console.log(response['payload']['Value']);
  })

//set event
openspace.set('NavigationHandler.OrbitalNavigator.Anchor','Moon')
openspace.trigger('NavigationHandler.OrbitalNavigator.RetargetAnchor')

//trigger event
openspace.trigger('RenderEngine.TakeScreenshot')

//lua script
var lat = 12
var lon = 34
var alti = 10000*1000
openspace.lua('openspace.globebrowsing.goToGeo('+lat+', '+lon+', '+alti+')')

},1000);
