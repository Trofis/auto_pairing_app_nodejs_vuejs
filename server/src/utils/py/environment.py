from pathlib import Path
import os
import subprocess
import re
import tarfile
import shutil
import sys
import psutil
import socket

try:
    from pip import main as pipmain
except ImportError:
    from pip._internal import main as pipmain

if 'psutil' not in sys.modules:
    pipmain(['install', 'psutil'])


def isRunning(ip, port):
    """ Check if logstash is already running
    Parameters :
        - ip
        - port

    Output : Boolean 

    Error : /
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((ip, int(port)))
        s.shutdown(2)
        return True
    except:
        return False

def setUpEnvironment():
    """ Check if logstash is already running
    Parameters :
        - ip
        - port

    Output : Boolean 

    Error : /
    """
    if not os.path.isdir("/tmp/logs_modem_files"):
        os.mkdir("/tmp/logs_modem_files")
    if not os.path.isdir("/tmp/logs_modem_files/all"):
        os.mkdir("/tmp/logs_modem_files/all")
    if not os.path.isfile("/tmp/logs_modem_files/result.log"):
        Path('/tmp/logs_modem_files/result.log').touch()
    if not os.path.isfile("/tmp/logs_modem_files/status.log"):
        Path('/tmp/logs_modem_files/status.log').touch()
   
# Switch deciding which action to execute



if sys.argv[1] == '1':
    print(isRunning(sys.argv[2], sys.argv[3]))
if sys.argv[1] == '2':
    setUpEnvironment()

sys.stdout.flush()

