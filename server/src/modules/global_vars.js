/** Global app's properties
 * @module modules/global_vars
 * @requires locations
 */

"use strict";
const loc = require('./locations')


// Global vars used in code
/**
 * Contains global properties
 * @name global
 * @const
 * @global
 * @memberof module:modules/global_vars
 * @inner
 */
const global = {
    /**
     * logstash location
     * @name logstash_dir
     * @default [process.env.LOGSTASH]
     * @memberof module:modules/global_vars~globalNM
     * @type {string}
     */
    logstash_dir: process.env.LOGSTASH || "/home/trofis/Workspace/Worldline/autoPairing",
    /**
     * Logstash's log location
     * @name logs_dir
     * @default [/tmp/logs_modem_files]
     * @memberof module:modules/global_vars~globalNM
     * @type {string}
     */
    logs_dir:"/tmp/logs_modem_files",
    /**
     * Logstash config name
     * @name config_logstash_name
     * @default [logstash-config.conf]
     * @memberof module:modules/global_vars~globalNM
     * @type {string}
     */
    config_logstash_name:'logstash-config.conf',
    /**
     * Logstash's pid 
     * @name logstash_process_pid
     * @default [undefined]
     * @memberof module:modules/global_vars~globalNM
     * @type {number}
     */
    logstash_process_pid:undefined,
}

/**
 * global childs properties
 * @namespace globalNM
*/
module.exports=global