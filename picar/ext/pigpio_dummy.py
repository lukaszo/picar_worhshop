# -*- coding: UTF-8 -*-
# Dummmy pigpio library to make it possible 
# to test code on non Pi computers

INPUT = 0
OUTPUT = 1

class pi(object):
    def __getattr__(self, name):
        def log(*args, **kwargs):
            print('Dummy call: {0}({1}, {2})'.format(name, args, kwargs))
        return log
