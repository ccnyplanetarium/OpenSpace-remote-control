
var socket = io();

var mySwiper = new Swiper ('.swiper-container', {
  // Optional parameters
  direction: 'horizontal',
  loop: true,

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // And if we need scrollbar
  // scrollbar: {
  //   el: '.swiper-scrollbar',
  // },
})

mySwiper.on('slideChange', function () {
  document.querySelector('#subtitle').textContent = planetList[mySwiper.realIndex]
});

var planet = document.querySelectorAll('.swiper-slide img')

var planetList = [
  'Sun',
  'Mercury',
  'Venus',
  'Earth',
  'Moon',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto'
]

for(let i = 0; i<planet.length; i++) {
  planet[i].onclick = function(){

    socket.emit('chat message', planetList[i-1]); //the trigger is incorrect.. so need -1

  };
}

// Get the image and insert it inside the modal - use its "alt" text as a caption

var modalImg = document.getElementById('modal-img');
var camera = document.getElementsByClassName('fa-camera')[0];
var modal = document.getElementById('myModal');
camera.onclick = function(){

  socket.emit('get img');
  modal.style.display = "block";

  // https://stackoverflow.com/questions/26331787/socket-io-node-js-simple-example-to-send-image-files-from-server-to-client
  socket.on("image", function(info) {

    modalImg.src = 'data:image/jpeg;base64,' + info.buffer;
  });
}

var keyboard = document.getElementsByClassName('fa-keyboard')[0];
var main = document.getElementById('main');
var root = document.getElementById('root');
setTimeout(
  function(){
    root.style.display = 'none';
    root.style.visibility = 'visible';
  },1000
)


keyboard.onclick = function(){
  main.style.display = 'none';
  root.style.display = '';
};

var back = document.getElementById('platform');
back.onclick = function(){
  main.style.display = '';
  root.style.display = 'none';
};

// https://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
function toDataURL(src, callback, outputFormat) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
  };
  img.src = src;
  if (img.complete || img.complete === undefined) {
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    img.src = src;
  }
}

function toDataURL(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.send();
}

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var del = document.getElementById("delete");

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}
del.onclick = function() {
  modal.style.display = "none";
}


var speaker = document.getElementById("speaker");
speaker.onclick = function() {
  speaker.classList.add('active')
  setTimeout(
    function() {
      speaker.classList.remove('active')
    }
    ,3000);
  }

  var dnload = document.getElementById("download");

  dnload.onclick = function() {

    toDataURL(modalImg.src, function(dataUrl) {
      var a  = document.createElement('a');
      a.href = dataUrl;
      a.download = 'image.png';

      a.click()
      console.log('RESULT:', dataUrl)
    })
  }
