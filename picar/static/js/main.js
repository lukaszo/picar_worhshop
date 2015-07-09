(function(window, document) {
  "use strict";

  // CAN'T TOUCH THIS
  // No, seriously. Don't touch it.
  var AXIS_DEFAULT = 0.003921627998352051;
  var AXIS_DEADZONE = 0.2;
  var AXIS_MAX = 1;
  var AXIS_MIN = -1;

  var DEBUG = true;
  var NO_CAMERA = false;

  function Car() {
    this.blackboard = document.getElementById('blackboard');
    this.ws = new WebSocket("ws://" + document.location.host + "/control-panel");
    if (DEBUG) {
      this.ws.addEventListener('message', function(e) {
        var html = this.blackboard.innerHTML;
        this.blackboard.innerHTML = html + '<br/>' + e.data;
      });
    }
  }

  Car.prototype.forward = function() {
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


  function Pad(car) {
    this.car = car;
    this.state = {
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

  // Left/right movement
  Pad.prototype.controlLXAxis = function(axis) {
    var LXAxis = Math.floor(axis);
    if (LXAxis > AXIS_DEADZONE && this.state.LX !== 1) {
      this.state.LX = 1;
      this.car.right();
    } else if (LXAxis < -AXIS_DEADZONE && this.state.LX !== -1) {
      this.state.LX = -1;
      this.car.left();
    } else if (LXAxis === 0 && this.state.LX !== 0) {
      this.state.LX = 0;
      this.car.straight();
    }
  };


  // Forward/backward movement
  Pad.prototype.controlLYAxis = function(axis) {
    var LYAxis = Math.floor(axis);
    if (LYAxis > AXIS_DEADZONE && this.state.LY !== 1) {
      this.state.LY = 1;
      this.car.backward();
    } else if (LYAxis < -AXIS_DEADZONE && this.state.LY !== -1) {
      this.state.LY = -1;
      this.car.forward();
    } else if (LYAxis === 0 && this.state.LY !== 0) {
      this.state.LY = 0;
      this.car.stop();
    }
  };

  // Camera horizontal
  Pad.prototype.controlRXAxis = function(axis) {
    var horizontalAngle = Math.floor(90 + (axis * 90));
    if (this.state.RS !== horizontalAngle) {
      this.state.RS = horizontalAngle;
      this.car.cameraHorizontal(horizontalAngle);
    }
  };

  // Camera vertical
  Pad.prototype.controlRYAxis = function(axis) {
    var verticalAngle = Math.floor(90 + (axis * 90));
    if (this.state.RY !== verticalAngle) {
      this.state.RY = verticalAngle;
      this.car.cameraVertical(verticalAngle);
    }
  };

  // Full stop!
  Pad.prototype.controlRightBumper = function(button) {
    if (button.pressed) {
        if (!this.state.RBumper.pressed) {
          this.state.RBumper.pressed = button.pressed;
          this.car.halt();
        }
    } else {
      this.state.RBumper.pressed = false;
    }
  };

  // GOTTA GO FAST
  Pad.prototype.controlLeftBumper = function(button) {
    if (button.pressed) {
        if (!this.state.LBumper.pressed) {
          this.state.LBumper.pressed = button.pressed;
          this.car.slower();
        }
    } else {
      this.state.LBumper.pressed = false;
    }
  };

  // STAPH SONIC GOTTA GO SLOW
  Pad.prototype.controlLeftTrigger = function(button) {
    if (button.pressed) {
        if (!this.state.LTrigger.pressed) {
          this.state.LTrigger.pressed = button.pressed;
          this.car.faster();
        }
    } else {
      this.state.LTrigger.pressed = false;
    }
  };

  Pad.prototype.controls = function(gamepad) {
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


  function Keyboard(car) {
    this.car = car;
    var listener = new window.keypress.Listener();
    var my_scope = this;
    var my_combos = listener.register_many([
      {
        "keys"           : "up",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.forward();
        },
        "on_keyup"       : function(e) {
            this.car.stop();
        },
        "this"           : my_scope
      },
      {
        "keys"           : "down",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.backward();
        },
        "on_keyup"       : function(e) {
            this.car.stop();
        },
        "this"           : my_scope
      },
      {
        "keys"           : "left",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.left();
        },
        "on_keyup"       : function(e) {
            this.car.straight();
        },
        "this"           : my_scope
      },
      {
        "keys"           : "right",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.right();
        },
        "on_keyup"       : function(e) {
            this.car.straight();
        },
        "this"           : my_scope
      },
      {
        "keys"           : "space",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.halt();
        },
        "this"           : my_scope
      },
      {
        "keys"           : "x",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.faster();
        },
        "this"           : my_scope
      },
      {
        "keys"           : "z",
        "is_exclusive"   : true,
        "prevent_repeat" : "true",
        "on_keydown"     : function() {
            this.car.slower();
        },
        "this"           : my_scope
      }
    ]);
  }


  function onDOMReady() {
    // CANT TOUCH THIS.
    // It's a retardedVariableTM for cleaning up sockets and RAF on page refresh
    var end = false;

    var car = new Car();
    var pad = new Pad(car);

    var canvas = document.getElementById('car-control');
    var ctx = canvas.getContext('2d');
    var img = new Image();

    img.addEventListener('load', function() {
      ctx.drawImage(img, 0, 0);
    });

    setInterval(function() {
      if (NO_CAMERA) {
        img.src = 'http://lorempixel.com/400/200/?' + new Date().getTime();
      } else {
        img.src = 'http://' + window.location.hostname + "/cam_pic.php?time=" + new Date().getTime();
      }
    }, 100);

    window.onbeforeunload = function() {
      end = true;
      car.ws.onclose = function() {}; // disable onclose handler first
      car.ws.close();
    };

    function raf(timestamp) {
      if (!end) {
        var gamepad = navigator.getGamepads()[0];
        pad.controls(gamepad);
        window.requestAnimationFrame(raf);
      } else {
        window.cancelAnimationFrame();
      }
    }

    function chooseControl(retries) {
      if (retries > 0 ) {
        setTimeout(function() {
          var gamepad = navigator.getGamepads()[0];
          if (gamepad) {
            raf()
          }
          else {
            chooseControl(retries-1);
          }
        }, 100);
      } else {
        console.log('Failing back to keyboard control.');
        var keyboard = new Keyboard(car);
      }
    }
    chooseControl(3);
  }

  document.addEventListener('DOMContentLoaded', function() {
    onDOMReady();
  });

})(window, document);
