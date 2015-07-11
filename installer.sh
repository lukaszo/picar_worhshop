#!/bin/bash

# TODO: rewrite to ansible
sudo -i <<SUDO

# preapare
apt-get update
apt-get -y  dist-upgrade

# install RPi_Cam_Web_Interface
cd /home/pi
git clone https://github.com/silvanmelchior/RPi_Cam_Web_Interface.git
cd RPi_Cam_Web_Interface
chmod u+x RPi_Cam_Web_Interface_Installer.sh
./RPi_Cam_Web_Interface_Installer.sh install

# install picar
cd -
sudo apt-get -y install python-pip python-dev
pip install -r requirements.txt
pip install -e .

# pigpiod 

cd /home/pi
wget abyz.co.uk/rpi/pigpio/pigpio.zip
unzip pigpio.zip
cd PIGPIO
make
make install

###########
# hotspot #
###########
apt-get -y install hostapd udhcpd
cat > /etc/udhcpd.conf <<EOL
start 192.168.40.2
end 192.168.40.20
interface wlan0
remaining yes
opt subnet 255.255.255.0
opt router 192.168.40.1
opt lease 864000
EOL

cat > /etc/default/udhcpd <<EOL
# Comment the following line to enable
# DHCPD_ENABLED="no"

# Options to pass to busybox' udhcpd.
#
# -S    Log to syslog
# -f    run in foreground

DHCPD_OPTS="-S"

EOL

# network
cat > /etc/network/interfaces << EOL
auto lo

iface lo inet loopback
iface eth0 inet dhcp

iface wlan0 inet static
  address 192.168.40.1
  netmask 255.255.255.0
EOL

cat > /etc/hostapd/hostapd.conf << EOL
interface=wlan0
ssid=picar0
hw_mode=g
channel=6
auth_algs=1
wmm_enabled=0
EOL

cat > /etc/default/hostapd  <<EOL
# Defaults for hostapd initscript
#
# See /usr/share/doc/hostapd/README.Debian for information about alternative
# methods of managing hostapd.
#
# Uncomment and set DAEMON_CONF to the absolute path of a hostapd configuration
# file and hostapd will be started during system boot. An example configuration
# file can be found at /usr/share/doc/hostapd/examples/hostapd.conf.gz
#
#DAEMON_CONF=""

DAEMON_CONF="/etc/hostapd/hostapd.conf"

# Additional daemon options to be appended to hostapd command:-
#       -d   show more debug messages (-dd for even more)
#       -K   include key data in debug messages
#       -t   include timestamps in some debug messages
#
# Note that -B (daemon mode) and -P (pidfile) options are automatically
# configured by the init.d script and must not be added to DAEMON_OPTS.
#
#DAEMON_OPTS=""
EOL

update-rc.d hostapd enable
update-rc.d udhcpd enable

cp /etc/rc.local /tmp/rc.local
cat >/etc/rc.local <<EOL
`cat /tmp/rc.local | grep -v "exit 0"`

/usr/local/bin/pigpiod
FLASK_UWSGI_DEBUG=true /usr/local/bin/uwsgi --http 0.0.0.0:8080 --http-websockets --processes 1 --master  --wsgi picar:app --daemonize /tmp/picar.log

exit 0
EOL
SUDO
