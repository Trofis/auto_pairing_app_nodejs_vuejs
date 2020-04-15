<template>
    <div class="d-flex align-center justify-center fill-height fluid">
      <div class="flex-column">
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">Local - log file: </p>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" vdark @click="openDialogLocal"> Select log</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">Local - zip files: </p>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" @click="multipleFiles"> Select directory</v-btn>
          </v-col>
        </v-row>
      </div>
      <v-overlay :value="overlay">
        <v-progress-circular indeterminate size="64">{{actualSize}}</v-progress-circular>
      </v-overlay>
      <v-overlay :value="overlay_menu">
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>
      <v-bottom-sheet v-model="sheet" persistent>
        <v-sheet v-if="message == 'files'" class="text-center" height="50%" >
          <div class ="text-center">
            <v-btn rounded class="mt-3" color="error" @click="sheet = !sheet" dark>Close</v-btn>
          </div>
            <v-skeleton-loader
                    :loading='finalRes'
                    class='d-flex align-center justify-center'
                    height="100%"
                    type="text"
                  >
              <v-ship dark style="border-radius:100px;" class="pa-3 ma-3 green darken-2 text-center white--text"> {{result}} : {{dir_zip}}</v-ship>
            </v-skeleton-loader>
            <v-data-table
              :headers="headers"
              :items="files"
              :items-per-page="5"
              class="elevation-1"
            >
              
                <template v-slot:item.result='{item}'>
                  <v-skeleton-loader
                    :loading="loading[files.indexOf(item)]"
                    class='d-flex align-center'
                    height="100%"
                    type="text"
                  >
                    <v-ship dark> {{item.result}}</v-ship>
                  </v-skeleton-loader>

                </template>
                

            </v-data-table>

        </v-sheet>
        <v-sheet v-else class="text-center" height="200px" >
            <div class ="text-center ">
              <v-btn rounded class="mt-3" color="error" @click="sheet = !sheet" dark>Close</v-btn>
            </div>
            <div class="py-3">{{message}}</div>
        </v-sheet>
    </v-bottom-sheet>
    </div>
    
  
    
</template>

<script>
const {ipcRenderer, remote} = require('electron')
export default {
  name: 'Home',
  data: () => ({
    headers : [
      { text : 'Files', align:"start", sortable:false, value:'file'},
      { text : 'Result', value:'result'},
    ],
    loading:[],
    files: [],
    message : '',
    messageload : "",
    color: "error",
    result:'',
    finalRes:true,
    size: 0,
    actualSize:0,
    dir_zip:"",
    actualUpdateSize:0,
    valueCircular:0,
    overlay:false,
    sheet : false,
  }),
  watch:{
    actualSize (val)  {
      console.log("update")
      this.valueCircular = this.actualSize/this.size*100
      if (val == this.size)
      {
        this.message = 'files'
        this.sheet = true
        this.overlay=false
      }
    },
    actualUpdateSize (val)  {
      if (val == this.size)
      {
        this.result = 'A csv has been created in the directory'
        this.finalRes = false
      }
    },
    sheet(val) {
      if (this.message == 'Logstash not found, the app will close, please make sure you have the autoPairing folder in your computer' && !val)
        remote.getCurrentWindow().close()
    }
  },
  methods: {
    multipleFiles(){
      ipcRenderer.send("multipleFiles")
      this.files = []
      this.actualSize = 0
      this.valueCircular=0
      console.log("sync files")
      
    },
    openDialogLocal(){
      this.color = "error"
      this.message = ''
      ipcRenderer.send("openDialogLocal")
      this.overlay_menu = true
      
    }
  },
  beforeMount() {
    this.message = ''
    this.messageload = 'Looking for logstash on your computer & launching it ...'
    this.overlay_menu = true
    this.color = "success"
    
    ipcRenderer.send("lookingForLogstash")

    ipcRenderer.once("lookingForLogstash", (event,arg) =>{
      console.log(arg)
      if (arg == 'Logstash not found')
        this.message = 'Logstash not found, the app will close, please make sure you have the autoPairing folder in your computer'
      else
        this.message = arg
      this.messageload = ''
      this.overlay_menu = false
      this.sheet = true
      
    })
    ipcRenderer.on("multipleFiles", (event,arg) =>{
      console.log(arg)
      this.overlay=true
      this.actualSize = 0
      if (typeof arg == "number" )
        if (arg == 0)
        {
          this.message = 'No zip files found'
          this.sheet = true
          this.overlay=false
        }
        else
          this.size = arg
      else
      {
        if (arg == 'No directory selected'){
          this.overlay=false
          this.message = 'Please you must select a directory'
          this.sheet = true
        }
        else if (arg == 'No zip files found')
        {
          this.overlay=false
          this.message = 'Please you must select a correct directory, no zip files found'
          this.sheet = true
        }
        else{
          this.files.push({ file : arg, result: ''})
          this.loading.push(true)
          this.message = 'files'
          setTimeout(() => {
            console.log("increment actual size")
            this.actualSize++
            
          }, 500)
        }
        
      }
    })
    ipcRenderer.on('multipleFilesResult', (event, arg) => {
      console.log('Incoming results')
      console.log(arg)
      if (arg[0]=='dir_zip')
      {
        this.dir_zip = arg[1]
      }else{
        this.files.forEach((elem, i) => { 
          console.log(arg[0]," ", arg[1])
          if (elem['file'] == arg[0]) 
          {
            this.actualUpdateSize++
            elem['result']= arg[1]
            console.log(this.loading[i])
            this.loading[i] = false
          }
        })
      }
      
    })

    ipcRenderer.on('infos', (event,arg) => {console.log("Info : ", arg)})

    ipcRenderer.on("openDialogLocal", (event,arg) =>{
      this.overlay_menu = false
      this.sheet = true
      console.log(arg)
      if (arg == 'No file selected')
        this.message = 'Please you must select a log file'
      else if (arg == 'Bad file')
        this.message = 'Please you must select a ModemD_00000000.log file'
      else
        this.message = arg
    })
  
  }
  
};
</script>