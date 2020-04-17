const { parentPort } = require('worker_threads')
const { execSync } = require('child_process')

const ResStatusEmun = Object.freeze({"In progress": 1, "Done": 2})
let script_win
let platform

parentPort.on('message', (task) => {
    script_win = task.script_win
    platform = task.platformUsed
    
    let filename = "/"+task.filename
    
    if (filename.match(/\n/g))
        filename = filename.replace(/\n/g, '')

    process = setInterval(() => {
        const resStatus = checkStatus(filename, task.logsDir, task.logstash_dir)
        if (resStatus == 1)
            console.log("In progress")
        if (resStatus==2) 
        {
            getResult(filename,task.logsDir)
            clearInterval(process)
        }
        console.log("Wait 6s ..")
    }, 6000);
    
})

const checkStatus = (filename,logsDir) => {
    let cmd
    if (platform == "win")
        cmd = "python "+script_win+" 6 "+logsDir+"/"+filename+" "+logsDir+"/status.log"
    else
        cmd = "grep "+logsDir+filename+" "+logsDir+"/status.log | grep 'Done'"
    try{
        const res = execSync(cmd).toString()
        if (res === '')
            return ResStatusEmun['In progress']
        return ResStatusEmun['Done']

    }catch(e){
        return ResStatusEmun['Done']

    }
    
}


const getResult = (filename,logsDir) => {
    let cmd
    if (platform == "win")
        cmd = "python "+script_win+" 7 "+logsDir+filename+" "+logsDir+"/result.log "
    else
        cmd = "grep "+logsDir+filename+" "+logsDir+"/result.log "
    
    console.log(cmd)
    let res = execSync(cmd).toString()
    
    // Clear data
    res = (/no error|error pattern 3/g).exec(res)[0].toString()

    parentPort.postMessage(res)
}   