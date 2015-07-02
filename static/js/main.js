(function(window, document) {
  "use strict";

  // CAN'T TOUCH THIS
  // No, seriously. Don't touch it.
  var AXIS_DEFAULT = 0.003921627998352051;
  var AXIS_DEADZONE = 0.2;
  var AXIS_MAX = 1;
  var AXIS_MIN = -1;

  var DEBUG = true;

  function Car() {
    var self = this;
    self.blackboard = document.getElementById('blackboard');
    self.ws = new WebSocket("ws://" + document.location.host + "/control-panel");
    if (DEBUG) {
      self.ws.addEventListener('message', function(e) {
        var html = self.blackboard.innerHTML;
        self.blackboard.innerHTML = html + '<br/>' + e.data;
      });
    }
    self.axis = {
      // LX - Left X.
      // LY - Left Y.
      // RX - Right X.
      // RY - Right Y.
      LX: AXIS_DEFAULT,
      LY: AXIS_DEFAULT,
      RX: AXIS_DEFAULT,
      RY: AXIS_DEFAULT
    };
  }

  Car.prototype.forward = function() {
    console.log(this);
    this.send('car forward');
  };
  Car.prototype.backward = function() {
    this.send('car backward');
  };
  Car.prototype.stop = function() {
    // after you drop movement forward/backward
    this.send('car stop_moving');
  };
  Car.prototype.left = function() {
    this.send('car left');
  };
  Car.prototype.right = function() {
    this.send('car right');
  };
  Car.prototype.straight = function() {
    // after you drop movement left/right
    this.send('car straight');
  };
  Car.prototype.halt = function() {
    // full stop
    this.send('stop');
  };
  Car.prototype.faster = function() {
    this.send('car faster');
  };
  Car.prototype.slower = function() {
    this.send('car slower');
  };
  Car.prototype.cameraVertical = function(horizontalAngle) {
    this.send('fpv horizontal_angle ' + horizontalAngle);
  };
  Car.prototype.cameraHorizontal = function(verticalAngle) {
    this.send('fpv vertical_angle ' + verticalAngle);
  };

  Car.prototype.log = function(command) {
    var html = this.blackboard.innerHTML;
    this.blackboard.innerHTML = command + '<br/>' + html;
  };

  Car.prototype.send = function(command) {
    this.ws.send(command);
    if (DEBUG) {
      this.log(command);
    }
  };

  Car.prototype.controlLXAxis = function(axis) {
    var LXAxis = Math.floor(axis);
    if (LXAxis > AXIS_DEADZONE && this.axis.LX !== 1) {
      this.axis.LX = 1;
      this.right();
    } else if (LXAxis < -AXIS_DEADZONE && this.axis.LX !== -1) {
      this.axis.LX = -1;
      this.left();
    } else if (LXAxis === 0 && this.axis.LX !== 0) {
      this.axis.LX = 0;
      this.straight();
    }
  };
  Car.prototype.controlLYAxis = function(axis) {
    var LYAxis = Math.floor(axis);
    if (LYAxis > AXIS_DEADZONE && this.axis.LY !== 1) {
      this.axis.LY = 1;
      this.backward();
    } else if (LYAxis < -AXIS_DEADZONE && this.axis.LY !== -1) {
      this.axis.LY = -1;
      this.forward();
    } else if (LYAxis === 0 && this.axis.LY !== 0) {
      this.axis.LY = 0;
      this.stop();
    }
  };
  Car.prototype.controlRXAxis = function(axis) {
    var horizontalAngle = Math.floor(90 + (axis * 90));
    if (this.axis.RS !== horizontalAngle) {
      this.axis.RS = horizontalAngle;
      this.cameraHorizontal(horizontalAngle);
    }
  };

  Car.prototype.controlRYAxis = function(axis) {
    var verticalAngle = Math.floor(90 + (axis * 90));
    if (this.axis.RY !== verticalAngle) {
      this.axis.RY = verticalAngle;
      this.cameraVertical(verticalAngle);
    }
  };

  // FIXME
  Car.prototype.totalStop = function(button) {
    if (button.pressed || button.value === 1) {
      this.halt();
    }
  };

  Car.prototype.controls = function(gamepad) {
    // axes[0] - left/right left axis
    // axes[1] - top/bottom left axis
    // axes[2] - left/right right axis
    // axes[3] - top/bottom right/axis
    // buttons[4] - Left '1'/bumper
    // buttons[5] -Right '1'/bumper
    this.controlLXAxis(gamepad.axes[0]);
    this.controlLYAxis(gamepad.axes[1]);
    this.controlRXAxis(gamepad.axes[2]);
    this.controlRYAxis(gamepad.axes[3]);
    this.totalStop(gamepad.buttons[4]);
    this.totalStop(gamepad.buttons[5]);
  };

  function onDOMReady() {
    // CANT TOUCH THIS.
    // It's a retardedVariableTM for cleaning up sockets and RAF on page refresh
    var end = false;

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
        var gamepad = navigator.getGamepads()[0];
        car.controls(gamepad);
        window.requestAnimationFrame(raf);
      } else {
        window.cancelAnimationFrame();
      }
    }

    function getPad() {
      setTimeout(function() {
        var gamepad = navigator.getGamepads()[0];
        console.log(gamepad);
        if (!gamepad) {
          alert("Push any button on the gamepad. If the problem still exist, reconnect the gamepad and restart the browser.");
          getPad();
        } else {
          raf();
        }
      }, 10);
    }
    getPad();
  }

  document.addEventListener('DOMContentLoaded', function() {
    onDOMReady();
  });

})(window, document);
