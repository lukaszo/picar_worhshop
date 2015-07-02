(function(window, document) {
  "use strict";

  // CAN'T TOUCH THIS
  // No, seriously. Don't touch it.
  var end = false;
  var AXIS_DEFAULT = 0.003921627998352051;
  var AXIS_MAX = 1;
  var AXIS_MIN = -1;

  var DEBUG = true;

  function Car() {
    var self = this;
    self.blackboard = document.getElementById('blackboard');
    self.ws = new WebSocket("ws://" + document.location.host + "/control-panel");
    self.ws.addEventListener('message', function(e) {
      var html = self.blackboard.innerHTML;
      self.blackboard.innerHTML = html + '<br/>' + e.data;
    });
    self.axis = {
      LX: AXIS_DEFAULT,
      LY: AXIS_DEFAULT,
      RX: AXIS_DEFAULT,
      RY: AXIS_DEFAULT
    };
  }

  Car.prototype.commands = {
    forward: function() {
      this.send('car forward');
    }.bind(this),
    backward: function() {
      this.send('car backward');
    }.bind(this),
    stop: function() {
    // after you drop movement forward/backward
      this.send('car stop_moving');
    }.bind(this),
    left: function(){
      this.send('car left');
    }.bind(this),
    right: function(){
      this.send('car right');
    }.bind(this),
    straight: function() {
    // after you drop movement left/right
      this.send('car straight');
    }.bind(this),
    halt: function() {
    // full stop
      this.send('stop');
    }.bind(this),
    faster: function() {
      this.send('car faster');
    }.bind(this),
    slower: function() {
      this.send('car slower');
    }.bind(this),
    cameraVertical: function(horizontalAngle) {
      this.send('fpv horizontal_angle ' + horizontalAngle);
    }.bind(this),
    cameraHorizontal: function(verticalAngle) {
      this.send('fpv vertical_angle ' + verticalAngle);
    }.bind(this)
  };

  Car.prototype.log = function(command) {
    var html = this.blackboard.innerHTML;
    this.blackboard.innerHTML = command + '<br/>' + html;
  };

  Car.prototype.send = function(command) {
    this.ws.send(command);
    this.log(command);
  };

  Car.prototype.controls = function(gamepad) {
    if (!gamepad) {
      alert("Push any button on the gamepad. If the problem still exist, reconnect the gamepad and restart the browser.")
    }

    // 0 - left/right left axis
    // 1 - top/bottom left axis
    // 2 - left/right right axis
    // 3 - top/bottom right/axis
    var LXAxis = gamepad.axes[0];
    var LXAxisValue;
    if (LXAxis < AXIS_DEFAULT && this.axes.LX !== LXAxis) {
      this.send(this.commands.forward);
    } else if (LXAxis > AXIS_DEFAULT) {

    } else {

    }
  };

  function onDOMReady() {
    var car = new Car();

    var canvas = document.getElementById('car-control');
    var ctx = canvas.getContext('2d');
    var img = new Image();

    img.addEventListener('load', function() {
      ctx.drawImage(img, 0, 0);
    });

    setInterval(function() {
      if (DEBUG) {
        img.src = 'http://lorempixel.com/400/200/?' + new Date().getTime();
      } else {
        img.src = 'http://' + window.location.hostname + "/cam_pic.php?time=" + new Date().getTime();
      }
    }, 1000);

    window.onbeforeunload = function() {
      end = true;
      car.ws.onclose = function() {}; // disable onclose handler first
      car.ws.close();
    };

    function raf(timestamp) {
      if (!end) {
        car.controls(navigator.getGamepads()[0]);
        window.requestAnimationFrame(raf);
      } else {
        window.cancelAnimationFrame();
      }
    }
    car.controls();
  }

  document.addEventListener('DOMContentLoaded', function() {
    onDOMReady();
  });

})(window, document);
