const { parentPort } = require('worker_threads')
const { execSync } = require('child_process')

parentPort.on('message', (task) => {
    const filename = task.file.match(/(\/[^/]*)$/g)
    let count = 0
    let res = ''

    while (count < 10 && (res == '' || res == '\n'))
    {
        //Looking for the file's result 
        const cmd = "grep "+task.logsDir+filename+" "+task.logstash_dir+"/result.log "
        try{
            res = execSync(cmd, (err, stdout, stderr) => {
                if (err)
                  console.log(err)
                console.log("stdout ",stdout)
                console.log("stdout ",stderr)
              }).toString('utf-8')
        }catch(err){
            console.log(err)
        }
        
        count ++
        console.log('result status for '+task.file+" : "+res)
    }
    
    //If count equals to 10 then no result found
    //if (count == 10) throw Error("Error : No result found")
    
    //If result contains something then extract the file's result
    if (res != '')
    {
        let reg = /log - (.*)/g
        res = reg.exec(res)[1]
    }else{
        res = "not found in result log"
    }

    parentPort.postMessage(res)
})
