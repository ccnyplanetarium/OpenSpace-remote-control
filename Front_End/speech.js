var speaker = document.getElementById("speaker");
speaker.addEventListener('touchstart', function(e) {
  speaker.classList.add('active')
  if (annyang)
annyang.start();
}, false);

speaker.addEventListener('touchend', function(e) {
  speaker.classList.remove('active')
  if (annyang)
annyang.end();
}, false);

if (annyang) {
  // Let's define our first command. First the text we expect, and then the function it should call
  var commands = {
    'go to *planet': function(planet) {
      if(planetList.includes(planet))
          socket.emit('chat message', planet); //the trigger is incorrect.. so need -1
    }
  };

  // Add our commands to annyang
  annyang.addCommands(commands);

  // Start listening. You can call this here, or attach this call to an event, button, etc.
  // annyang.start();
}
