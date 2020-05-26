<template>
    <div class="d-flex align-center justify-center fill-height fluid">
      <div class="flex-column">
        <v-row>
           <v-col class="fluid" md="auto"> 
            <h3 class="mt-1 text-center">Log file process </h3>
          </v-col>
        </v-row>
        <v-row>
          <template>
            <v-file-input class="mr-6" accept=".log" style="width:20em;" v-model="file" label="File input"></v-file-input>
          </template>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="success" vdark @click="singleFile">Confirm</v-btn>
          </v-col>
        </v-row>
        <v-row class="mt-5">
          <v-col class="fluid" md="auto"> 
            <h3 class="mt-1 text-center">Zip files process</h3>
          </v-col>
        </v-row>
        <v-row class="mt-1">
          <template>
            <v-file-input class="mr-6" multiple accept=".zip" style="width:20em;" v-model="files" label="Files input"></v-file-input>
          </template>
          <v-col class="d-flex justify-end">
            <v-btn rounded color="success" vdark @click="multipleFiles">Confirm</v-btn>
          </v-col>
        </v-row>
      </div>
      <app-pop-up :file="file" :files="files" :results="results"  :action="action" :message="message" :error="error" :sheet="sheet" :close="close"> </app-pop-up>
    </div>
</template>

<script>
  const axios = require('axios')
  import {eventBus} from '../main'
  import PopUp from './PopUp.vue'
  
export default {
  name: 'Home',
  components:{
    appPopUp : PopUp 
  },
  data: () => ({
    
    file: {},
    files: [],
    results: [],
    message : '',
    action:'',
    sheet:false,
    error:''
  }),
  
  methods: {
    multipleFiles(){
      if (this.files.length == 0){
        alert("You should select a file")
        return
      }
      this.files.forEach((file) => {
        this.results.push({file:file.name,result:null})
        this.analyseLogZip(file)
      })
      this.sheet = true
      this.message = ''
      this.action = 'multipleFiles'
    },
    singleFile(){
      if (this.file == undefined){
        alert("You should select a file")
        return
      }
      this.sheet = true
      this.action = 'singleFile'
      const formData = new FormData();
      formData.append("log", this.file)
      axios.post("http://127.0.0.1:3000/analyseLog", formData)
        .then(response => {
          this.message = response.data
        })
        .catch(error => {
          if (error.message === 'Network Error')
              this.error = 'Unable to communicate with the server, please contact the admin'
          else
            this.error = "An error occured"
          console.log(error)
        })
      },
      close(){
        this.sheet = false
        this.message=''
        this.file = {}
        this.files = []
        this.results = []
        this.error = ''
      },
      async analyseLogZip(file){
        const formData = new FormData()
        formData.append("log", file)

        axios.post("http://127.0.0.1:3000/analyseLogZip", formData)
          .then(response => {
            this.results.forEach(result => {if (result.file == response.data.file) result.result = response.data.result})
            eventBus.addResult(response.data)

          })
          .catch(error => {
            console.log(error.message )
            if (error.message === 'Network Error')
              this.error = 'Unable to communicate with the server, please contact the admin'
            else if (error.response.status === 400)
              this.error = "One of the files specified does not contain a ModemD log file, please correct this before to retry"
            else
              this.error = "An error occured"
          })
      }
    }
    
  }
  
</script>