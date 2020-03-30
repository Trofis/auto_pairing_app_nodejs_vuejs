from pathlib import Path
import os
import subprocess
import re
import tarfile
import shutil
import sys
import psutil
import socket
#from pip import main as pipmain

def exec_logstash(path_logstash, config):
    print("logstash :")
    full_path = path_logstash.replace("\r\n","")+"\\logstash-7.6.1\\bin\\logstash.bat"
    print(full_path)
    config_path = path_logstash.replace("\r\n","")+"\\config\\"+config
    print("config :")
    print(repr(config_path))
    subprocess.call([full_path, '-f', config_path, "-w", '1'])

def find_AutoPairing(root):
    atom = 'autoPairing'
    for path, dirs, files in os.walk(root):
        if atom in dirs:
            return os.path.join(path, atom)
    return False


def find_Files(root):
    result = []
    for files in os.listdir(root):
        res = re.findall('CONTI_[0-9]*_[0-9]*_LOG.tar.gz', files)
        if len(res) > 0:
            result.append(res[0])
    return result

def code_linux(root):
    files = find_Files(root)
    print(files)
    for f in files:
        print(root+"/"+f+"-folder")
        if not os.path.isdir(root+"/"+f+"-folder"):
            os.mkdir(root+"/"+f+"-folder")
        tf = tarfile.open(root+"/"+f)
        tf.extractall(root+"/"+f+"-folder")
        #shutil.move()
        if not os.path.isdir("/var/logs_modem_files"):
            os.mkdir("/var/logs_modem_files")
        if not os.path.isdir("/var/logs_modem_files/"+f+"-folder"):
            os.mkdir("/var/logs_modem_files/"+f+"-folder")
        print(os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log"))
        print(os.path.isdir("/var/logs_modem_files/"+f+"-folder/"))
        if os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log") and os.path.isdir("/var/logs_modem_files/"+f+"-folder/"):
            os.rename(root+"/"+f+"-folder/archives/ModemD_00000000.log", "/var/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
        elif os.path.isdir("/var/logs_modem_files/"+f+"-folder/"):
            os.rename(root+"/"+f+"-folder/ModemD_00000000.log", "/var/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
        shutil.rmtree(root+"/"+f+"-folder")

def code_windows(root):
    files = find_Files(root)
    print(files)
    for f in files:
        if not check_status(f,'C:/logs_modem_files/status.log'):
            print(root+"/"+f+"-folder")
            if not os.path.isdir(root+"/"+f+"-folder"):
                os.mkdir(root+"/"+f+"-folder")
            tf = tarfile.open(root+"/"+f)
            tf.extractall(root+"/"+f+"-folder")
            #shutil.move()
            if not os.path.isdir("C:/logs_modem_files"):
                os.mkdir("C:/logs_modem_files")
            if not os.path.isdir("C:/logs_modem_files/"+f+"-folder"):
                os.mkdir("C:/logs_modem_files/"+f+"-folder")
            print(os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log"))
            print(os.path.isdir("C:/logs_modem_files/"+f+"-folder/"))
            if os.path.isfile(root+"/"+f+"-folder/archives/ModemD_00000000.log") and os.path.isdir("C:/logs_modem_files/"+f+"-folder/"):
                os.rename(root+"/"+f+"-folder/archives/ModemD_00000000.log", "C:/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
            elif os.path.isdir("C:/logs_modem_files/"+f+"-folder/"):
                os.rename(root+"/"+f+"-folder/ModemD_00000000.log", "C:/logs_modem_files/"+f+"-folder/ModemD_00000000.log")
            shutil.rmtree(root+"/"+f+"-folder")

def check_status(file, status_file):
    file = str(file)
    with open(status_file) as f:
        result = re.findall(file+".*- Done", f.read())
        if len(result) > 0:
            return True
        return False

def get_result(file, result_file):
    file = str(file)
    with open(result_file) as f:
        result = re.findall(file+".*- (.*)", f.read())
        if len(result) > 0:
            return result[0]
        return False

def isRunning(ip, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((ip, int(port)))
        s.shutdown(2)
        return True
    except:
        return False


   

#pipmain(['install', 'psutil'])

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
    print('args')
    print(sys.argv[2])
    print(sys.argv[3])
    print(check_status(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == '7':
    print(get_result(sys.argv[2], sys.argv[3]))
elif sys.argv[1] == '8':
    print(isRunning(sys.argv[2], sys.argv[3]))

sys.stdout.flush()


#code_windows('/home/thomasm/Documents')
