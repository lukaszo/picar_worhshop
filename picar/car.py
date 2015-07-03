# -*- coding: UTF-8 -*-
from config import MOCK
if not MOCK:
  import pigpio
  


class Car(object):
    def __init__(self, left_pin, right_pin, forward_pin, backward_pin,
                 enable_moving, enable_turning, start_power=65):
        self._left_pin = left_pin
        self._right_pin = right_pin
        self._forward_pin = forward_pin
        self._backward_pin = backward_pin
        self._enable_moving = enable_moving
        self._enable_turning = enable_turning

        self._setup_gpio()

        self._moving_pwm_started = False
        self._power = start_power


    def _setup_gpio(self):
        self._pi =  pigpio.pi()

        self._pi.set_mode(self._left_pin, pigpio.OUTPUT)
        self._pi.set_mode(self._right_pin, pigpio.OUTPUT)
        self._pi.set_mode(self._forward_pin, pigpio.OUTPUT)
        self._pi.set_mode(self._backward_pin, pigpio.OUTPUT)
        self._pi.set_mode(self._enable_moving, pigpio.OUTPUT)
        self._pi.set_mode(self._enable_turning, pigpio.OUTPUT)

        self._pi.set_PWM_frequency(self._enable_moving, 100) # channel, frequency

    def turn_left(self):
        self._pi.write(self._enable_turning, True)
        self._pi.write(self._right_pin, False)
        self._pi.write(self._left_pin, True)

    def turn_right(self):
        self._pi.write(self._enable_turning, True)
        self._pi.write(self._left_pin, False)
        self._pi.write(self._right_pin, True)

    def straight(self):
        self._pi.write(self._left_pin, False)
        self._pi.write(self._right_pin, False)
        self._pi.write(self._enable_turning, False)

    def move_forward(self):
        self._pi.write(self._backward_pin, False)
        self._pi.write(self._forward_pin, True)
        self._start_moving_pwm()

    def move_backward(self):
        self._pi.write(self._forward_pin, False)
        self._pi.write(self._backward_pin, True)
        self._start_moving_pwm()

    def faster(self, change_value=15):
        if self._power + change_value > 100:
            self._power = 100
        else:
            self._power += change_value
        self._change_power()

    def slower(self, change_value=15):
        if self._power - change_value < 30:
            self._power = 30
        else:
            self._power -= change_value
        self._change_power()

    def stop_moving(self):
        self._pi.set_PWM_dutycycle(self._enable_turning, 0)
        self._pi.write(self._backward_pin, False)
        self._pi.write(self._forward_pin, False)
        self._moving_pwm_started = False

    def stop(self):
        self.stop_moving()
        self._pi.write(self._left_pin, False)
        self._pi.write(self._right_pin, False)
        self._pi.write(self._enable_turning, False)

    def _start_moving_pwm(self):
        if self._moving_pwm_started:
            return
        self._pi.set_PWM_dutycycle(self._enable_moving, self._power)
        self._moving_pwm_started = True

    def _change_power(self):
        self._pi.set_PWM_dutycycle(self._enable_moving, self._power)
