#!./uwsgi --https :8443,foobar.crt,foobar.key --http-raw-body --gevent 100 --module tests.websockets_echo
import time

from flask.ext.uwsgi_websocket import WebSocket

import car
import fpv

from flask import Flask, render_template


app = Flask(__name__)
ws = WebSocket(app)


CAR = car.Car(15,14,23,24,18)
FPV = fpv.FPV(horizontal_pin=27,
              vertical_pin=23)


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


application = app


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080, master=True, processes=1)
