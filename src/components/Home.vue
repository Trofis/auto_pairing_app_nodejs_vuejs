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
            <v-btn rounded color="primary" @click="openDialogLocalZip"> Select directory</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="fluid" md="auto"> 
            <p class="mt-1">M2M servers : </p>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="primary" disabled  @click="openDialogM2M"> Select csv</v-btn>
          </v-col>
        </v-row>
      </div>
      <v-bottom-sheet v-model="sheet">
        <v-sheet v-if="message != ''" class="text-center" height="200px" >
            <v-btn
                class="mt-6"
                flat
                color="error"
                @click="sheet = !sheet"
            >
                Close
            </v-btn>
            <div class="py-3">{{message}}</div>
        </v-sheet>
        <v-sheet v-else class="text-center" height="100px" >
            <v-progress-circular
              indeterminate
              color = "primary"
              class="mt-2"
            >
            </v-progress-circular>
        </v-sheet>
    </v-bottom-sheet>
    </div>
    
  
    
</template>

<script>
const {ipcRenderer} = require('electron')
export default {
  name: 'Home',
  data: () => ({
    sheet : false,
    message : ''
  }),
  methods: {
    openDialogLocal(){
      this.message = ''
      ipcRenderer.send("openDialogLocal")
      this.sheet = true
      ipcRenderer.on("openDialogLocal", (event,arg) =>{
        console.log(arg)
        this.message = arg
      })
    },
    openDialogLocalZip(){
      this.message = ''
      ipcRenderer.send("openDialogLocalZip")
      this.sheet = true
      ipcRenderer.on("openDialogLocalZip", (event,arg) =>{
        console.log(arg)
        this.message = arg
      })
    },
    openDialogM2M(){
      ipcRenderer.send("openDialogM2M")
      ipcRenderer.on("openDialogM2M", (event,arg) =>{
        console.log(arg)
        this.sheet = true
        arg == '' ? this.message = "No file selected" : this.message = "The following file has been selected : "+arg
      })
    }
  }
};
</script>