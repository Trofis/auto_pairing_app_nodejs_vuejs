/** System locations
 * @module modules/locations
 * @requires path
 */
"use strict";

const path=require('path')

let __auto_pairing_app

__auto_pairing_app = require('app-root-path').path

/**
 * It aims to check each 6 seconds the file's process status
 * then call the method getResult
 * @name locations
 * @const
 * @global
 * @memberof module:modules/locations
 * @inner
 */
const locations = {
    // General folder
    /**
     * App's path
     * @name __auto_pairing_app
     * @memberof module:modules/locations~locationNM
     * @type {string}
     */
    '__auto_pairing_app' : __auto_pairing_app,
    /**
     * Python's code path
     * @name environment
     * @type {string}
     * @memberof module:modules/locations~locationNM
     * @default [.../src/utils/py/environment]
     */
    'environment': path.join(__auto_pairing_app, './src/utils/py/environment.py'),
}
/**
 * locations childs properties
 * @namespace locationNM
*/
module.exports = locations;