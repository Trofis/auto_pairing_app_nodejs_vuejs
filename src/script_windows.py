from pathlib import Path
import os
import subprocess
import re
import tarfile
import shutil
import sys
from pip import main as pipmain

def exec_logstash(path_logstash, linux_config):
    subprocess.call([path_logstash+"/logstash-7.6.0/bin/logstash", '-f', path_logstash+"/config/"+linux_config, "-w", '1'])

def find_AutoPairing(root):
    atom = 'autoPairing'
    for path, dirs, files in os.walk(root):
        if atom in dirs:
            return os.path.join(path, atom)


def find_Files(root):
    atom = 'CONTI.*_LOG.tar.gz'
    result = []
    for files in os.listdir(root):
        res = re.findall('CONTI.*_LOG.tar.gz', files)
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

def check_status(status_file, file):
    with open(status_file) as f:
        print(file+'/ModemD_00000000.log - Done')
        result = re.findall(file+".*- Done", f.read())
        print(result)
        if len(result) > 0:
            return True

def get_result(result_file, file):
    with open(result_file) as f:
        print(file+'/ModemD_00000000.log - (.*)')
        result = re.findall(file+".*- (.*)", f.read())
        print(result)
        if len(result) > 0:
            return False

def isRunning(processName):
    for proc in psutil.process_iter():
        try:
            if processName.lower() in proc.name().lower():
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

#pipmain(['install', 'psutil'])

if sys.argv[1] == '1':
    exec_logstash(sys.argv[2], sys.argv[3])
elif sys.argv[1] == '2':
    print(find_AutoPairing(sys.argv[2]))
elif sys.argv[1] == '3':
    find_Files(sys.argv[2])
elif sys.argv[1] == '4':
    code_linux(sys.argv[2])
elif sys.argv[1] == '5':
    code_windows(sys.argv[2])
elif sys.argv[1] == '6':
    check_status(sys.argv[2], sys.argv[3])
elif sys.argv[1] == '7':
    get_result(sys.argv[2], sys.argv[3])
elif sys.argv[1] == '8':
    print(isRunning(sys.argv[2]))
sys.stdout.flush()


#code_windows('/home/thomasm/Documents')
