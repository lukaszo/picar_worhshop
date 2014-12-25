import RPi.GPIO as GPIO


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
        GPIO.setmode(GPIO.BCM)

        GPIO.setup(self._left_pin, GPIO.OUT)
        GPIO.setup(self._right_pin, GPIO.OUT)
        GPIO.setup(self._forward_pin, GPIO.OUT)
        GPIO.setup(self._backward_pin, GPIO.OUT)
        GPIO.setup(self._enable_moving, GPIO.OUT)
        GPIO.setup(self._enable_turning, GPIO.OUT)

        self._moving_pwm = GPIO.PWM(self._enable_moving, 100) # channel, frequency

    def turn_left(self):
        GPIO.output(self._enable_turning, True)
        GPIO.output(self._right_pin, False)
        GPIO.output(self._left_pin, True)

    def turn_right(self):
        GPIO.output(self._enable_turning, True)
        GPIO.output(self._left_pin, False)
        GPIO.output(self._right_pin, True)

    def straight(self):
        GPIO.output(self._enable_turning, False)
        GPIO.output(self._left_pin, False)
        GPIO.output(self._right_pin, False)

    def move_forward(self):
        GPIO.output(self._backward_pin, False)
        GPIO.output(self._forward_pin, True)
        self._start_moving_pwm()

    def move_backward(self):
        GPIO.output(self._forward_pin, False)
        GPIO.output(self._backward_pin, True)
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
        self._moving_pwm.stop()
        GPIO.output(self._backward_pin, False)
        GPIO.output(self._forward_pin, False)
        self._moving_pwm_started = False

    def stop(self):
        self._moving_pwm.stop()
        GPIO.output(self._left_pin, False)
        GPIO.output(self._right_pin, False)
        GPIO.output(self._backward_pin, False)
        GPIO.output(self._forward_pin, False)
        GPIO.output(self._enable_turning, False)
        self._moving_pwm_started = False

    def _start_moving_pwm(self):
        if self._moving_pwm_started:
            return
        self._moving_pwm.start(self._power)
        self._moving_pwm_started = True

    def _change_power(self):
        self._moving_pwm.ChangeDutyCycle(self._power)
