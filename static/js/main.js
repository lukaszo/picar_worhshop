"use strict";

var DEBUG = true;

function log(msg) {
  var bb = document.getElementById('blackboard')
  var html = bb.innerHTML;
  bb.innerHTML = msg + '<br/>' + html;
}

function bindEvents(socket) {
  socket.addEventListener('open', function() {

  });

  socket.addEventListener('message', function(e) {
    var bb = document.getElementById('blackboard')
    var html = bb.innerHTML;
    bb.innerHTML = html + '<br/>' + e.data;
  });

  socket.addEventListener('error', function(e) {
    alert(e);
  });

  socket.addEventListener('close', function(e) {

  });
}

function invia(socket) {
  var value = document.getElementById('testo').value;
  socket.send(value);
}

function onDOMReady() {
  var ws = new WebSocket("ws://" + document.location.host + "/control-panel");

  bindEvents(ws);

  function doRequest(msg) {
    ws.send(msg);
    log(msg);
  }

  var listener = new window.keypress.Listener();
  var self = this;
  var myCombos = listener.register_many([{
    "keys": "up",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "car forward";
      doRequest(msg);
    },
    "on_keyup": function(e) {
      var msg = "car stop_moving";
      doRequest(msg);
    },
    "this": self
  }, {
    "keys": "down",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "car backward";
      doRequest(msg);
    },
    "on_keyup": function(e) {
      var msg = "car stop_moving";
      doRequest(msg);
    },
    "this": self
  }, {
    "keys": "left",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "car left";
      doRequest(msg);
    },
    "on_keyup": function(e) {
      var msg = "car straight";
      doRequest(msg);
    },
    "this": self
  }, {
    "keys": "right",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "car right";
      doRequest(msg);
    },
    "on_keyup": function(e) {
      var msg = "car straight";
      doRequest(msg);
    },
    "this": self
  }, {
    "keys": "space",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "stop";
      doRequest(msg);
    },
    "this": self
  }, {
    "keys": "x",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "car slower";
      doRequest(msg);
    },
    "this": self
  }, {
    "keys": "z",
    "is_exclusive": true,
    "prevent_repeat": "true",
    "on_keydown": function() {
      var msg = "car faster";
      doRequest(msg);
    },
    "this": self
  }]);

  // var verticalSlider = new Slider("#vertical");
  // var hortizontalSlider = new Slider("#horizontal");

  // verticalSlider.on("change", function(values) {
  //   var msg = "fpv vertical_angle " + values.newValue;
  //   doRequest(msg);
  // });

  // hortizontalSlider.on("change", function(values) {
  //   var msg = "fpv horizontal_angle " + values.newValue;
  //   doRequest(msg);
  // });

  var canvas = document.getElementById('car-control');
  //   GameController.init({
  //     // canvas: canvas,
  //     forcePerformanceFriendly: true,

  //     left: {
  //         type: 'joystick'
  //     },
  //     right: {
  //         position: {
  //             right: '5%'
  //         },
  //         type: 'buttons',
  //         buttons: [
  //         {
  //             label: 'jump', fontSize: 13, touchStart: function() {
  //                 // do something
  //             }
  //         },
  //         false, false, false
  //         ]
  //     }
  // } );
  GameController.init({
    forcePerformanceFriendly: true,
    right: {
      type: 'joystick',
      position: {
        // left: '15%',
        // bottom: '15%'
      },
      joystick: {
        touchStart: function() {
          console.log('touch starts');
        },
        touchEnd: function() {
          console.log('touch ends');
        },
        touchMove: function(details) {
          console.log(details);
          var verticalCamera = "fpv vertical_angle " + Math.round(details.dy + 82.5);
          var horizontalCamera = "fpv horizontal_angle " + Math.round(details.dx + 82.5);
          doRequest(verticalCamera);
          doRequest(horizontalCamera);
        }
      }
    },
    left: {
      type: 'joystick'
    }
  });
  var ctx = canvas.getContext('2d');
  var img = new Image();
  img.addEventListener('load', function() {
    ctx.drawImage(img, 0, 0);
  });
  // if (DEBUG) {
  setInterval(function() {
    // console.log('wat');
    // img.src = 'http://' + window.location.hostname + "/cam_pic.php?time=" + new Date().getTime();
    img.src = 'http://lorempixel.com/400/200/?' + new Date().getTime();
    // img.src = 'http://' + window.location.hostname + "/cam_pic.php?time=" + new Date().getTime();
  }, 1000);
  // }

  window.onbeforeunload = function() {
    ws.onclose = function() {}; // disable onclose handler first
    ws.close();
  };
}

document.addEventListener('DOMContentLoaded', function() {
  onDOMReady();
});
