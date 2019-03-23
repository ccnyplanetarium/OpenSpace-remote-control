// var speaker = document.getElementById("speaker");
// speaker.addEventListener('touchstart', function(e) {
//   speaker.classList.add('active')
//   if (annyang)
// annyang.start();
// }, false);
//
// speaker.addEventListener('touchend', function(e) {
//   speaker.classList.remove('active')
//   if (annyang)
// annyang.end();
// }, false);



var speaker = document.getElementById("speaker");
speaker.onclick = function() {
  if(!speaker.classList.contains('active')) {
  speaker.classList.add('active')
  if (annyang)
annyang.start();
} else {
speaker.classList.remove('active')
if (annyang)
annyang.abort();
}
  }

if (annyang) {
  // Let's define our first command. First the text we expect, and then the function it should call
  var commands = {
    'go to *planet': function(planet) {

      var planet = voiceAdjustion(planet)
      if(planetList.includes(planet))
          socket.emit('change planet', planet); //the trigger is incorrect.. so need -1
    }
  };

  // Add our commands to annyang
  annyang.addCommands(commands);

  // Start listening. You can call this here, or attach this call to an event, button, etc.
  // annyang.start();
}

function voiceAdjustion(planet) {

  var result = planet;
  for(let i = 0;i<Object.keys(config.voice).length;i++) {
    if(Object.values(config.voice)[i].includes(planet)) {
      result = Object.keys(config.voice)[i]
    }
  }

    socket.emit('console log', 'Receiving '+planet+'    --- Adjust to '+result); //the trigger is incorrect.. so need -1

  return result
}
