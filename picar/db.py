# -*- coding: UTF-8 -*-
import json
import os


class DB(object):
    def __init__(self, path='.'):
        self.db_path = os.path.join(path, 'picar.db')
        try:
            with open(self.db_path) as f:
                self._db = json.load(f)
        except (IOError, ValueError, TypeError):
            self._db = {}

    def set(self, key, value):
        self._db[key] = value
        with open(self.db_path, 'w') as f:
            json.dump(self._db, f)

    def get(self, key, default=None):
        return self._db.get(key, default)
