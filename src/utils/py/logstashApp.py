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


# --------------------------------------------
#        Functions relative to windows
# --------------------------------------------

def exec_logstash(autoPairing_path, config):
    """ Exectute logstash in background
    Parameters :
        - autoPairing_path : absolute path to autoPairing app (Logstash)
        - config : absolute path to the logstash's config

    Output : / 

    Error : 
        - SubprocessError : path unresolved
    """
    try:
        full_path = autoPairing_path.replace("\r\n","")+"\\logstash-7.6.1\\bin\\logstash.bat"
        config_path = autoPairing_path.replace("\r\n","")+"\\config\\"+config
        subprocess.call([full_path, '-f', config_path, "-w", '1'])
    except subprocess.SubprocessError as error:
        print(error)
        raise 
    

def find_AutoPairing(root):
    """ Find autoPairing app on the computer
    Parameters :
        - root : root's folder absolute path 

    Output : 
        - A path
        - or False 

    Error : /
    """
    atom = 'autoPairing'
    for path, dirs, files in os.walk(root):
        if atom in dirs:
            return os.path.join(path, atom)
    return False


def find_Files(root):
    """ Find autoPairing app on the computer
    Parameters :
        - root : root's folder absolute path 

    Output : 
        - A path
        - or False 

    Error : /
    """
    result = []
    for files in os.listdir(root):
        res = re.findall('CONTI_[0-9]*_[0-9]*_LOG.tar.gz', files)
        if len(res) > 0:
            result.append(res[0])
    return result

"""
    Code_linux works but has already is implementation in bash > faster
"""

# def code_linux(root):
#     files = find_Files(root)
#     print(files)
#     for f in files:
#         print(root+"/"+f+"-folder")
#         if not os.path.isdir(root+"/"+f+"-folder"):
#             os.mkdir(root+"/"+f+"-folder")
#         tf = tarfile.open(root+"/"+f)
#         tf.extractall(root+"/"+f+"-folder")
#         #shutil.move()
#         if not os.path.isdir("/var/logs_modem_files"):
#             os.mkdir("/var/logs_modem_files")
#         if not os.path.isdir("/var/logs_modem_files/"+f+"-folder"):
#             os.mkdir("/var/logs_modem_files/"+f+"-folder")
#         print(os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log"))
#         print(os.path.isdir("/var/logs_modem_files/"+f+"-folder/"))
#         if os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log") and os.path.isdir("/var/logs_modem_files/"+f+"-folder/"):
#             os.rename(root+"/"+f+"-folder/archives/ModemD_00000000.log", "/var/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
#         elif os.path.isdir("/var/logs_modem_files/"+f+"-folder/"):
#             os.rename(root+"/"+f+"-folder/ModemD_00000000.log", "/var/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
#         shutil.rmtree(root+"/"+f+"-folder")

def code_windows(root):
    """ Execute a series of bundles for sending a bunch of logs files from a certain directory 
    Parameters :
        - root : root's folder absolute path 

    Output : / 

    Error : /
    """
    files = find_Files(root)
    for f in files:
        # Check if file has already been treated  
        # If yes then noting to do
        # If not we continue the process
        if not check_status(f,'C:/logs_modem_files/status.log'):
            # Extract compressed files into a dedicated folder
            if not os.path.isdir(root+"/"+f+"-folder"):
                os.mkdir(root+"/"+f+"-folder")
            tf = tarfile.open(root+"/"+f)
            tf.extractall(root+"/"+f+"-folder")

            # Check if logstash's folder "logs_modem_files" already exists
            # If not create it before to create the one for the specified file
            if not os.path.isdir("C:/logs_modem_files"):
                os.mkdir("C:/logs_modem_files")
            os.mkdir("C:/logs_modem_files/"+f+"-folder")

            # Check ModemD_00000000.log position 
            # and tranfert it to its dedicated folder inside "log_modem_files"
            if os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log") and os.path.isdir("C:/logs_modem_files/"+f+"-folder/"):
                os.rename(root+"/"+f+"-folder/archives/ModemD_00000000.log", "C:/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
            elif os.path.isdir("C:/logs_modem_files/"+f+"-folder/"):
                os.rename(root+"/"+f+"-folder/ModemD_00000000.log", "C:/logs_modem_files/"+f+"-folder/ModemD_00000000.log")

            # Remove unecessary folder with all its content
            shutil.rmtree(root+"/"+f+"-folder")

def check_status(file, status_file):
    """ Check file's treatment progression inside status.log file
    Parameters :
        - file : file path or name
        - status_file : aboslute path to "status.log" file

    Output : Boolean

    Error : /
    """
    file = str(file)
    with open(status_file) as f:
        result = re.findall(file+".*- Done", f.read())
        if len(result) > 0:
            return True
        return False

def get_result(file, result_file):
    """ Get file's logstash result inside result.log file
    Parameters :
        - file : file path or name
        - result_file : aboslute path to "result.log" file

    Output : / 

    Error : /
    """
    file = str(file)
    with open(result_file) as f:
        result = re.findall(file+".*- (.*)", f.read())
        if len(result) > 0:
            return result[0]
        return False

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
    if not os.path.isfile("/tmp/logs_modem_files/result.log"):
        Path('/tmp/logs_modem_files/result.log').touch()
    if not os.path.isfile("/tmp/logs_modem_files/status.log"):
        Path('/tmp/logs_modem_files/status.log').touch()
   
# Switch deciding which action to execute



if sys.argv[1] == '1':
    exec_logstash(sys.argv[2], sys.argv[3])
elif sys.argv[1] == '2':
    print(find_AutoPairing(sys.argv[2]))
elif sys.argv[1] == '3':
    print(find_Files(sys.argv[2]))
elif sys.argv[1] == '4':
    code_linux(sys.argv[2])
elif sys.argv[1] == '5':
    print(code_windows(sys.argv[2]))
elif sys.argv[1] == '6':
    print(check_status(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == '7':
    print(get_result(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == '8':
    print(isRunning(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == '9':
    setUpEnvironment()

sys.stdout.flush()

