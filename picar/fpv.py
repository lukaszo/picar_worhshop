# -*- coding: UTF-8 -*-
import pigpio


class FPV(object):
    def __init__(self, horizontal_pin, vertical_pin):
        self._horizontal_pin = horizontal_pin
        self._vertical_pin = vertical_pin

        self._horizontal_started = False
        self._vertical_started = False
        self._setup_gpio()

    def _setup_gpio(self):
        self._pi =  pigpio.pi()
        self._pi.set_mode(self._horizontal_pin, pigpio.OUTPUT)
        self._pi.set_mode(self._vertical_pin, pigpio.OUTPUT)

    def set_horizontal_angle(self, angle):
        duty = self._calculate_duty(angle)
        self._pi.set_servo_pulsewidth(self._horizontal_pin, duty)
        self._horizontal_started = True

    def set_vertical_angle(self, angle):
        duty = self._calculate_duty(angle)
        self._pi.set_servo_pulsewidth(self._vertical_pin, duty)
        self._vertical_started = True

    def stop(self):
        self.stop_horizontal()
        self.stop_vertical()

    def stop_horizontal(self):
        if self._horizontal_started:
            self._pi.set_servo_pulsewidth(self._horizontal_pin, 0)
            self._horizontal_started = False

    def stop_vertical(self):
        if self._vertical_started:
            self._pi.set_servo_pulsewidth(self._vertical_pin, 0)
            self._vertical_started = False

    def _calculate_duty(self, angle):
        return (angle / 10.0 + 2.5) * 100
