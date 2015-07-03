# -*- coding: UTF-8 -*-
import time

from flask import Flask, render_template
from flask.ext.uwsgi_websocket import WebSocket

from ext import Platform

# Make it possible to run it on non Pi computers
if Platform.pi_version() is None:
    import sys
    module = __import__('picar.ext.pigpio_dummy')
    sys.modules['pigpio'] = module.ext.pigpio_dummy

from picar import car
from picar import fpv


app = Flask(__name__)
ws = WebSocket(app)


CAR = car.Car(left_pin=24,
            right_pin=23,
            forward_pin=15,
            backward_pin=14,
            enable_moving=18,
            enable_turning=25)
FPV = fpv.FPV(horizontal_pin=8,
            vertical_pin=7)



def car_module(msg):
    if msg == 'forward':
        CAR.move_forward()
    elif msg == 'backward':
        CAR.move_backward()
    elif msg == 'left':
        CAR.turn_left()
    elif msg == 'right':
        CAR.turn_right()
    elif msg == 'straight':
        CAR.straight()
    elif msg == 'faster':
        CAR.faster()
    elif msg == 'slower':
        CAR.slower()
    elif msg == 'stop_moving':
        CAR.stop_moving()
    elif msg == 'stop':
        CAR.stop()
    else:
        raise Exception('Unknown message {0}'.format(msg))

def fpv_module(msg):
    split_message = msg.split()
    msg = split_message[0]
    if msg == 'horizontal_angle':
        angle = int(split_message[1])
        FPV.set_horizontal_angle(angle)
    elif msg == 'vertical_angle':
        angle = int(split_message[1])
        FPV.set_vertical_angle(angle)
    elif msg == 'stop':
        FPV.stop()
    else:
        raise Exception('Unknown message {0}'.format(msg))

MODULES = {'car' : car_module,
           'fpv' : fpv_module,
          }


@app.route('/')
def index():
    return render_template('index.html')

@ws.route('/control-panel')
def control_panel(ws):
    while True:
        msg = ws.receive()
        split_message = msg.split(' ')
        module = MODULES.get(split_message[0], None)
        if module:
            module_msg = ' '.join(split_message[1:])
            try:
                module(module_msg)
            except Exception as e:
                ws.send("[%s] Error: %s" % (time.time(), e.message))
        else:
            if msg == 'stop':
                for module in MODULES.values():
                    module('stop')
            else:
                ws.send("[%s] Unknown message: %s" % (time.time(), msg))
