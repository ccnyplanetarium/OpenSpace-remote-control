

// index.html
function createUser() {
  if(!document.querySelector('#username')) return

  var username = document.querySelector('#username').value
  sessionStorage.setItem('username', username);
  socket.emit('create user', username);
}


//

// General
socket.on('redirect', function(destination) {
  window.location.href = destination;
});

socket.on('alert', function(msg) {
  alert(msg)
});

function logout() {
  socket.emit('logout user', sessionStorage.getItem('username'));
  sessionStorage.clear();
  socket.emit('redirect', '/index.html');
}

function access(evt) {
  console.log(evt.textContent)
  if(evt.classList.contains('gamepad'))
  var type = (evt.classList.contains('active')) ? 'remove gamepad' : 'add gamepad'
  if(evt.classList.contains('plane'))
  var type = (evt.classList.contains('active')) ? 'remove plane' : 'add plane'

  if(evt.classList.contains('active')) {
    evt.classList.remove('active')
  } else {
    evt.classList.add('active')
  }

  id = evt.id
  id = id.replace('+_+_+','').replace('_+_+_','').replace('+-+_+','').replace('_+-+_','')

  console.log(id)
  socket.emit('access user', {type: type, id: id});
}

// For content
socket.on('content setup', function(msg) {
  if(!document.querySelector(msg.target)) return
  if(document.querySelectorAll(msg.id).length > 0) return


  document.querySelector(msg.target).innerHTML += msg.content;
});

socket.on('content remove', function(msg) {
  console.log(msg.target)
  var target = document.querySelector(msg.target);
  if(!target)
  return;
  target.parentNode.removeChild(target)
});

socket.on('content replace', function(msg) {
  if(!document.querySelector(msg.target)) return

  document.querySelector(msg.target).innerHTML = msg.content;
});


socket.on('content refresh', function(msg) {
  var target = document.querySelectorAll(msg.target);
  if(!target)
  return;

  for(let i =0;i<target.length;i++) {
    if(target[i].textContent == msg.username)
    document.querySelectorAll(msg.target2)[i].textContent = msg.id
  }

});


socket.on('wiki', function(msg) {
  // https://stackoverflow.com/questions/8555320/is-there-a-clean-wikipedia-api-just-for-retrieve-content-summary
  // https://stackoverflow.com/questions/51575656/how-to-properly-cors-fetch-from-the-wikipedia-api
  fetch(
    "https://en.wikipedia.org/w/api.php?action=query&titles="+msg+"&origin=%2A&format=json&prop=extracts&exintro=&explaintext=&formatversion=2",
    {
      method: "GET"
    }
  )
  .then(response => response.json())
  .then(json => {
    console.log('json');
    console.log(json);
    var text = json.query.pages[0].extract

    // https://stackoverflow.com/questions/39950775/regex-replace-only-a-part-of-the-match
    text = text.replace(/[.]+([A-Z])/g,".<br><br> $1"); //create link break
    //
    document.querySelector('#wiki').innerHTML = text;
  })
  .catch(error => {
    console.log(error.message);
  });
});
