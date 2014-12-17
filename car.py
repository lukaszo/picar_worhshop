import RPi.GPIO as GPIO


class Car(object):
  def __init__(self, left_pin, right_pin, forward_pin, backward_pin,
               pwm_pin, start_speed=65):
    self._left_pin = left_pin
    self._right_pin = right_pin
    self._forward_pin = forward_pin
    self._backward_pin = backward_pin
    self._pwm_pin = pwm_pin
    self._setup_gpio()

    self._pwm_started = False
    self._speed = start_speed

  def _setup_gpio(self):
    GPIO.setmode(GPIO.BCM)

    GPIO.setup(self._left_pin, GPIO.OUT)
    GPIO.setup(self._right_pin, GPIO.OUT)
    GPIO.setup(self._forward_pin, GPIO.OUT)
    GPIO.setup(self._backward_pin, GPIO.OUT)
    GPIO.setup(self._pwm_pin, GPIO.OUT)

    self._pwm = GPIO.PWM(self._pwm_pin, 100) # channel, frequency

  def turn_left(self):
    GPIO.output(self._right_pin, False)
    GPIO.output(self._left_pin, True)

  def turn_right(self):
    GPIO.output(self._left_pin, False)
    GPIO.output(self._right_pin, True)

  def straight(self):
    GPIO.output(self._left_pin, False)
    GPIO.output(self._right_pin, False)

  def move_forward(self):
    GPIO.output(self._backward_pin, False)
    GPIO.output(self._forward_pin, True)
    self._start_pwm()

  def move_backward(self):
    GPIO.output(self._forward_pin, False)
    GPIO.output(self._backward_pin, True)
    self._start_pwm()

  def faster(self, change_value=15):
    if self._speed + change_value > 100:
      self._speed = 100
    else:
      self._speed += change_value
    self._change_speed()

  def slower(self, change_value=15):
    if self._speed - change_value < 30:
      self._speed = 30
    else:
      self._speed -= change_value
    self._change_speed()

  def stop_moving(self):
    self._pwm.stop()
    GPIO.output(self._backward_pin, False)
    GPIO.output(self._forward_pin, False)
    self._pwm_started = False

  def stop(self):
    self._pwm.stop()
    GPIO.output(self._left_pin, False)
    GPIO.output(self._right_pin, False)
    GPIO.output(self._backward_pin, False)
    GPIO.output(self._forward_pin, False)
    self._pwm_started = False

  def _start_pwm(self):
    if self._pwm_started:
      return
    self._pwm.start(self._speed)
    self._pwm_started = True

  def _change_speed(self):
    self._pwm.ChangeDutyCycle(self._speed)
