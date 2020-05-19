"use strict";

const path=require('path')

let __auto_pairing_app
// let __user_data

__auto_pairing_app = require('app-root-path').path
// __user_data = app.getPath('userData')


const locations = {
    // General folder
    '__auto_pairing_app' : __auto_pairing_app,
    'environment': path.join(__auto_pairing_app, './src/utils/py/environment.py'),
     // Loggers
    //  'logs_folder': path.join(__user_data, 'logs'),
    //  'log_js': path.join(__user_data, 'logs/debug_js.log'),
    //  'log_python': path.join(__user_data, 'logs/debug_py.log'),
}

module.exports = locations;