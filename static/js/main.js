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
    self.state = {
      // LX - Left X.
      // LY - Left Y.
      // RX - Right X.
      // RY - Right Y.
      LX: AXIS_DEFAULT,
      LY: AXIS_DEFAULT,
      RX: AXIS_DEFAULT,
      RY: AXIS_DEFAULT,
      LBumper: {
        pushed: false,
        value: 0
      },
      RBumper: {
        pushed: false,
        value: 0
      },
      LTrigger: {
        pushed: false,
        value: 0
      },
      RTrigger: {
        pushed: false,
        value: 0
      }
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

  // Left/right movement
  Car.prototype.controlLXAxis = function(axis) {
    var LXAxis = Math.floor(axis);
    if (LXAxis > AXIS_DEADZONE && this.state.LX !== 1) {
      this.state.LX = 1;
      this.right();
    } else if (LXAxis < -AXIS_DEADZONE && this.state.LX !== -1) {
      this.state.LX = -1;
      this.left();
    } else if (LXAxis === 0 && this.state.LX !== 0) {
      this.state.LX = 0;
      this.straight();
    }
  };

  // Forward/backward movement
  Car.prototype.controlLYAxis = function(axis) {
    var LYAxis = Math.floor(axis);
    if (LYAxis > AXIS_DEADZONE && this.state.LY !== 1) {
      this.state.LY = 1;
      this.backward();
    } else if (LYAxis < -AXIS_DEADZONE && this.state.LY !== -1) {
      this.state.LY = -1;
      this.forward();
    } else if (LYAxis === 0 && this.state.LY !== 0) {
      this.state.LY = 0;
      this.stop();
    }
  };

  // Camera horizontal
  Car.prototype.controlRXAxis = function(axis) {
    var horizontalAngle = Math.floor(90 + (axis * 90));
    if (this.state.RS !== horizontalAngle) {
      this.state.RS = horizontalAngle;
      this.cameraHorizontal(horizontalAngle);
    }
  };

  // Camera vertical
  Car.prototype.controlRYAxis = function(axis) {
    var verticalAngle = Math.floor(90 + (axis * 90));
    if (this.state.RY !== verticalAngle) {
      this.state.RY = verticalAngle;
      this.cameraVertical(verticalAngle);
    }
  };

  // Full stop!
  Car.prototype.controlRightBumper = function(button) {
    if (button.pressed) {
        if (!this.state.RBumper.pressed) {
          this.state.RBumper.pressed = button.pressed;
          this.halt();
        }
    } else {
      this.state.RBumper.pressed = false;
    }
  };

  // GOTTA GO FAST
  Car.prototype.controlLeftBumper = function(button) {
    if (button.pressed) {
        if (!this.state.LBumper.pressed) {
          this.state.LBumper.pressed = button.pressed;
          this.slower();
        }
    } else {
      this.state.LBumper.pressed = false;
    }
  };

  // STAPH SONIC GOTTA GO SLOW
  Car.prototype.controlLeftTrigger = function(button) {
    if (button.pressed) {
        if (!this.state.LTrigger.pressed) {
          this.state.LTrigger.pressed = button.pressed;
          this.faster();
        }
    } else {
      this.state.LTrigger.pressed = false;
    }
  };

  Car.prototype.controls = function(gamepad) {
    // axes[0] - left/right left axis
    // axes[1] - top/bottom left axis
    // axes[2] - left/right right axis
    // axes[3] - top/bottom right/axis
    // buttons[4] - Left '1'/bumper
    // buttons[5] - Right '1'/bumper
    // buttons[6] - Left '2'/trigger
    // buttons[7] - Right '2'/trigger
    this.controlLXAxis(gamepad.axes[0]);
    this.controlLYAxis(gamepad.axes[1]);
    this.controlRXAxis(gamepad.axes[2]);
    this.controlRYAxis(gamepad.axes[3]);
    this.controlRightBumper(gamepad.buttons[5]);
    this.controlLeftBumper(gamepad.buttons[4]);
    this.controlLeftTrigger(gamepad.buttons[6]);
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
