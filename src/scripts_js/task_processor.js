const { parentPort } = require('worker_threads')
const { execSync } = require('child_process')

const ResStatusEmun = Object.freeze({"In progress": 1, "Done": 2})
var res 
let script_win
let platform

parentPort.on('message', (task) => {
    let filename
    task.file == undefined ? filename = task.filename : filename = task.file
    script_win = task.script_win
    platform = task.platformUsed
    let resStatus

    console.log(filename, script_win, task.logsDir, task.logstash_dir)
    getResult(filename,task.logsDir)
    if (res == null || res == ''){
        process = setInterval(() => {
            resStatus = checkStatus(filename, task.logsDir, task.logstash_dir)
            if (resStatus == 1)
                console.log("In progress")
            if (resStatus==2) 
            {
                getResult(filename,task.logsDir)
                clearInterval(process)
            }
            console.log("Wait 3s ..")
        }, 3000);
    }
    
})

function checkStatus(filename,logsDir){
    let cmd2
    if (platform == "win32" || platform == "win64")
        cmd2 = "python "+script_win+" 6 "+logsDir+"/"+filename+" "+logsDir+"/status.log"
    else
        cmd2 = "grep "+logsDir+filename+" "+logsDir+"/status.log | grep 'Done'"
    let res2
    try{
        res2 = execSync(cmd2, (err, stdout, stderr) => {
            if (err)
              console.log(err)
            console.log("stdout ",stdout.toString())
            console.log("stdout ",stderr)
          }).toString()
    }catch(err){
        console.log(err)
        return ResStatusEmun['In progress']
    }
    if (res2 === '')
        return ResStatusEmun['In progress']
    return ResStatusEmun['Done']
}


function getResult(filename,logsDir){
    let cmd
    //Looking for the file's result 
    if (platform == "win32" || platform == "win64")
        cmd = "python "+script_win+" 7 "+logsDir+"/"+filename+" "+logsDir+"/result.log "
    //cmd = "findstr "+logsDir+filename+" "+logsDir+"/result.log"
    else
        cmd = "grep "+logsDir+filename+" "+logsDir+"/result.log "
    try{
        res = execSync(cmd, (err, stdout, stderr) => {
            if (err)
                console.log(err)
            console.log("stdout ",stdout.toString())
            console.log("stdout ",stderr)
            }).toString('utf-8')
        console.log(res)
    }catch(err){
        console.log(err)
    }
    
    
    //If count equals to 10 then no result found
    //if (count == 10) throw Error("Error : No result found")
    
    //If result contains something then extract the file's result
    try{
        if (platform != "win32" && platform != "win64"){
            let reg = /log - (.*)/g
            res = reg.exec(res)[1]
        }
        else{
            if (res == 'False' || res == 'False\r\n' || res == [])
                throw Error('Not found')
        }
        parentPort.postMessage(res)
            
    }catch(err){
        console.log("1st check : not found in result log")
        res = null
    }

}   