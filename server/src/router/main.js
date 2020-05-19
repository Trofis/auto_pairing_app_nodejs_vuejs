const {analyseFile}= require('../../src/utils/js/analyseFile')
const global = require('../modules/global_vars')

const extract = require('extract-zip')
const fs = require('fs')
const rimraf = require('rimraf')



const express = require('express')
const router = new express.Router()


//ANALYSE LOG FILE EVENT
router.post('/analyseLog', async(req, res) => {
  console.log(req.files)
  const file = req.files.log
  file.name = req.id
  file.mv(`${global.logs_dir}/all/${file.name}.log`)
  const resultFile = await analyseFile(file.name)
  await res.status(200).send(resultFile)
})

//ANALYSE ZIP FILE EVENT
router.post('/analyseLogZip', async(req, res) => {
  console.log(req.files)

  let file = req.files.log
  let file_path = `${global.logs_dir}/${file.name}`
  file.mv(file_path)

  try{
    await extract(file_path,{dir : `${global.logs_dir}/zip`})
    file.name = file.name.match(/([A-Z])\w+/g)[0] 

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
    rimraf(`${global.logs_dir}/zip/${file.name}`, (err) => console.log(err))
    fs.unlink(`${global.logs_dir}/${file.name}.zip`, (err) => console.log(err))
    console.log("Extraction completed")
  }catch(err){
    console.log(err)
    await res.status(400).send()
  }
  const resultFile = await analyseFile(req.id)
  await res.status(200).send({file: `${file.name}.zip`, result:resultFile})
})
  
module.exports = router
  
      
  