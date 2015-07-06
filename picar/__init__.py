# -*- coding: UTF-8 -*-
import time

from flask import Flask, render_template, redirect, url_for, request
from flask.ext.uwsgi_websocket import WebSocket

from ext import Platform

# Make it possible to run it on non Pi computers
if Platform.pi_version() is None:
    import sys
    module = __import__('picar.ext.pigpio_dummy')
    sys.modules['pigpio'] = module.ext.pigpio_dummy

from picar import car
from picar import fpv
from picar import db as picar_db


app = Flask(__name__)
ws = WebSocket(app)
db = picar_db.DB()

CAR = None
FPV = None
CURRENT = None


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
    controls = db.get('profiles', {})
    return render_template('index.html', controls=controls)

@app.route('/create', methods=['POST'])
def create():
    global CAR, FPV, CURRENT
    form = dict(request.form)
    name = form['name'][0]
    del form['name']
    for key in form:
        form[key] = int(form[key][0])
    CAR = car.Car(**get_pins_for_module(car.Car, form))
    FPV = fpv.FPV(**get_pins_for_module(fpv.FPV, form))
    CURRENT = name
    print('Using configuration: {0}'.format(form))
    profiles = db.get('profiles', {})
    profiles[name] = form
    db.set('profiles', profiles)
    return redirect(url_for('control'))

@app.route('/delete/<name>')
def delete(name):
    global CAR, FPV, CURRENT
    profiles = db.get('profiles', {})
    profile = profiles.get(name, None)
    if profile:
        del profiles[name]
        db.set('profiles', profiles)
    if name == CURRENT:
        CAR = FPV = None
    return redirect(url_for('index'))

@app.route('/configure/<name>')
def configure(name):
    global CAR, FPV, CURRENT
    profiles = db.get('profiles')
    if not profiles:
        return redirect(url_for('index'))
    profile = profiles.get(name, None)
    if not profile:
        return redirect(url_for('index'))
    CAR = car.Car(**get_pins_for_module(car.Car, profile))
    FPV = fpv.FPV(**get_pins_for_module(fpv.FPV, profile))
    CURRENT = name
    print('Using configuration: {0}'.format(profile))
    return redirect(url_for('control'))

@app.route('/control')
def control():
    global CAR, FPV
    if CAR is None or FPV is None:
        return redirect(url_for('index'))
    return render_template('control.html')


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


def get_pins_for_module(module, pins):
    selected = {}
    for pin in pins:
        if pin in module.PINS:
            selected[pin] = pins[pin]
    return selected
