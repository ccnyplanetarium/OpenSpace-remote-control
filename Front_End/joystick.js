var s = function(sel) {
  return document.querySelector(sel);
};
var sId = function(sel) {
  return document.getElementById(sel);
};
var removeClass = function(el, clss) {
  el.className = el.className.replace(new RegExp('\\b' + clss + ' ?\\b', 'g'), '');
}
var joysticks = {
  static: {
    zone: s('.zone.static'),
    mode: 'static',
    position: {
      left: '50%',
      top: '50%'
    },
    color: '#0984e3'
  }
};
var joystick;

// Get debug elements and map them
var elDebug = sId('debug');
var elDump = elDebug.querySelector('.dump');
var els = {
  position: {
    x: elDebug.querySelector('.position .x .data'),
    y: elDebug.querySelector('.position .y .data')
  },
  force: elDebug.querySelector('.force .data'),
  pressure: elDebug.querySelector('.pressure .data'),
  distance: elDebug.querySelector('.distance .data'),
  angle: {
    radian: elDebug.querySelector('.angle .radian .data'),
    degree: elDebug.querySelector('.angle .degree .data')
  },
  direction: {
    x: elDebug.querySelector('.direction .x .data'),
    y: elDebug.querySelector('.direction .y .data'),
    angle: elDebug.querySelector('.direction .angle .data')
  }
};


var timeoutCreate;

createNipple('static');

function bindNipple() {
  joystick.on('start', function(evt, data) {
    socket.emit('latitude start' );
    dump(evt.type);
    debug(data);
  }).on('move', function(evt, data) {
    socket.emit('latitude move', { angle: data.angle.degree, distance: data.distance } );
    debug(data);
  }).on('end', function(evt, data) {
    socket.emit('latitude end' );
    dump(evt.type);
    debug(data);

  }).on('dir:up plain:up dir:left plain:left dir:down ' +
  'plain:down dir:right plain:right',
  function(evt, data) {
    dump(evt.type);
  }
).on('pressure', function(evt, data) {
  debug({
    pressure: data
  });
});
}

function createNipple(evt) {
  var type = typeof evt === 'string' ?
  evt : evt.target.getAttribute('data-type');
  if (joystick) {
    joystick.destroy();
  }
  removeClass(s('.zone.active'), 'active');
  s('.zone.' + type).className += ' active';
  joystick = nipplejs.create(joysticks[type]);
  bindNipple();
}

// Print data into elements
function debug(obj) {
  function parseObj(sub, el) {
    for (var i in sub) {
      if (typeof sub[i] === 'object' && el) {
        parseObj(sub[i], el[i]);
      } else if (el && el[i]) {
        if(typeof sub[i] == "number") sub[i]=sub[i].toFixed(3)
        el[i].innerHTML = sub[i];
      }
    }
  }
  setTimeout(function() {
    parseObj(obj, els);
  }, 0);
}

var nbEvents = 0;

// Dump data
function dump(evt) {
  setTimeout(function() {
    if (elDump.children.length > 4) {
      elDump.removeChild(elDump.firstChild);
    }
    var newEvent = document.createElement('div');
    newEvent.innerHTML = '#' + nbEvents + ' : <span class="data">' +
    evt + '</span>';
    elDump.appendChild(newEvent);
    nbEvents += 1;
  }, 0);
}


// for (let i = 0;i<document.querySelectorAll("#speedBar i").length;i++) {
//   let arrow = document.querySelectorAll("#speedBar i")[i];
//   let target = (i==0) ? "up" : "down"
//
//   arrow.addEventListener('touchstart', function(e) {
//           arrow.classList.add('active')
//                     socket.emit('altitude start',target);
//   }, false);
//
//   arrow.addEventListener('touchend', function(e) {
//                 arrow.classList.remove('active')
//                     socket.emit('altitude end',target);
//   }, false);
// }

var src1 = document.querySelectorAll("#speedBar i")[0];
var src2 = document.querySelectorAll("#speedBar i")[1];

src1.addEventListener('touchstart', function(e) {
  // controlSpeed(e,'touch',true)
  src1.classList.add('active')
  socket.emit('altitude start','up');
}, false);

src1.addEventListener('touchend', function(e) {
  // controlSpeed(e,'touch',false)
  src1.classList.remove('active')
  socket.emit('altitude end','up');
}, false);

src2.addEventListener('touchstart', function(e) {
  src2.classList.add('active')
  socket.emit('altitude start','down');
}, false);

src2.addEventListener('touchend', function(e) {
  src2.classList.remove('active')
  socket.emit('altitude end','down');
}, false);
