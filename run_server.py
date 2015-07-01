# -*- coding: UTF-8 -*-
from picar import app


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080, master=True, processes=1)
