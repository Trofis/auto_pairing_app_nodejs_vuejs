/** Express router providing user related routes
 * @module router/main
 * @requires express,analyseFile,global_vars,extract-zip,fs,rimraf
 */

// intern imports
const {analyseFile}= require('../../src/utils/js/analyseFile')
const global = require('../modules/global_vars')

// Express
const express = require('express')
const router = new express.Router()

// Global imports
const extract = require('extract-zip')
const fs = require('fs')
const rimraf = require('rimraf')


/**
 * Route serving analyse single log file
 * @name get/analyseLog
 * @function
 * @memberof module:router/main
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/analyseLog', async(req, res) => {
  // Init the req's file
  const file = req.files.log
  file.name = req.id

  // Send file to logstash for analyse process
  file.mv(`${global.logs_dir}/all/${file.name}.log`)

  // Wait result
  const resultFile = await analyseFile(file.name)

  // Change response status to 200 and send file result
  await res.status(200).send(resultFile)
})

/**
 * Route serving analyse single zip file
 * @name get/analyseLogZip
 * @function
 * @memberof module:router/main
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/analyseLogZip', async(req, res) => {
  // Init the req's file
  let file = req.files.log
  let file_path = `${global.logs_dir}/${file.name}`

  // Send zip file to log logstash's root folder for extraction
  file.mv(file_path)

  /**
 * All the process here aims to find the ModemD_OOOOOOOO log file in the extracted zip file
 * If not found it throws an error saying it didn't find it & send a response with 400 error status
 */
  try{
    // Extract & rename the file name
    await extract(file_path,{dir : `${global.logs_dir}/zip`})
    file.name = file.name.match(/([A-Z])\w+/g)[0] 

    // Check in the root or archives folder the Modem log file
    if (fs.existsSync(`${global.logs_dir}/zip/${file.name}/ModemD_00000000.log`)) {
      fs.rename(`${global.logs_dir}/zip/${file.name}/ModemD_00000000.log`, `${global.logs_dir}/zip/${file.name}/${req.id}.log`, (err) => console.log(err))
      fs.rename(`${global.logs_dir}/zip/${file.name}/${req.id}.log`, `${global.logs_dir}/all/${req.id}.log`, (err) => console.log(err))
    }
    else if (fs.existsSync(`${global.logs_dir}/zip/${file.name}/archives/ModemD_00000000.log`)) {
      fs.rename(`${global.logs_dir}/zip/${file.name}/archives/ModemD_00000000.log`, `${global.logs_dir}/zip/${file.name}/archives/${req.id}.log`, (err) => console.log(err))
      fs.rename(`${global.logs_dir}/zip/${file.name}/archives/${req.id}.log`, `${global.logs_dir}/all/${req.id}.log`, (err) => console.log(err)  )
    }
    else 
      throw Error("No modem files found")
    
    // Clean up (delete folder extracted & the zip file)
    rimraf(`${global.logs_dir}/zip/${file.name}`, (err) => console.log(err))
    fs.unlink(`${global.logs_dir}/${file.name}.zip`, (err) => console.log(err))
    console.log("Extraction completed")
  }catch(err){
    console.log(err)
    await res.status(400).send()
  }

  // Wait result
  const resultFile = await analyseFile(req.id)

  // Change response status to 200 and send file result
  await res.status(200).send({file: `${file.name}.zip`, result:resultFile})
})
  
module.exports = router
  
      
  