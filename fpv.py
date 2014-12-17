from RPIO import PWM


class FPV(object):
    def __init__(self, horizontal_pin, vertical_pin):
        self._horizontal_pin = horizontal_pin
        self._vertical_pin = vertical_pin
        self._servo = PWM.Servo()

        self._horizontal_started = False
        self._vertical_started = False

    def set_horizontal_angle(self, angle):
        duty = self._calculate_duty(angle)
        self._servo.set_servo(self._horizontal_pin, duty)
        self._horizontal_started = True

    def set_vertical_angle(self, angle):
        duty = self._calculate_duty(angle)
        self._servo.set_servo(self._vertical_pin, duty)
        self._vertical_started = True

    def stop(self):
        self.stop_horizontal()
        self.stop_vertical()

    def stop_horizontal(self):
        if self._horizontal_started:
            self._servo.stop_servo(self._horizontal_pin)
            self._horizontal_started = False

    def stop_vertical(self):
        if self._vertical_started:
            self._servo.stop_servo(self._vertical_pin)
            self._vertical_started = False

    def _calculate_duty(self, angle):
        return (angle / 10.0 + 2.5) * 100
