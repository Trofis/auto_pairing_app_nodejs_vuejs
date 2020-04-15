"use strict";

const path=require('path')
const electron=require('electron')
const fs=require('fs')


let app
let __auto_pairing_app
let __user_data

if (electron.app == undefined)
    app = electron.remote.app
else
    app = electron.app

__auto_pairing_app = app.getAppPath()
__user_data = app.getPath('userData')


const locations = {
    // General folder
    '__auto_pairing_app' : __auto_pairing_app,
    'script': path.join(__auto_pairing_app,'src/scripts_python'),
    'script_windows': path.join(__auto_pairing_app, '../src/scripts_python/script_windows.py'),
    'task_processor': path.join(__auto_pairing_app, '../src/scripts_js/task_processor.js'),
    'code_linux': path.join(__auto_pairing_app, '../src/bash_script/code_linux'),
     // Loggers
     'logs_folder': path.join(__user_data, 'logs'),
     'log_js': path.join(__user_data, 'logs/debug_js.log'),
     'log_python': path.join(__user_data, 'logs/debug_py.log'),
}

module.exports = locations;