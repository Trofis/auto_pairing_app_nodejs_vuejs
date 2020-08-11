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
  import {eventBus} from '../main'
  import PopUp from './PopUp.vue'
  
  const axios = require('axios')
  
  const instance = axios.create({
    baseURL:`http://${process.env.VUE_APP_BACK_ADDRESS}:${process.env.VUE_APP_BACK_PORT}/`
  })
  
  
/**
 * @vue-data {Object} [file ={}] - singleFile's object
 * @vue-data {Array} [files =[]] - multipleFiles' array
 * @vue-data {Array} [results =[]] - multipleFiles' analyse results
 * @vue-data {string} [message =''] - keep infos or single result
 * @vue-data {string} [action =''] - keep which action the user performed : singleFile or multipleFiles
 * @vue-data {boolean} [sheet =false]- show or not the popUp
 * @vue-data {string} [error =''] -  error message
*/ 
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
    /**
     * MultipleFile process which will through an async method send the files
     */
    multipleFiles(){
      // Check if any file's been selected
      // If not we send back an alert
      if (this.files.length == 0){
        alert("You should select a file")
        return
      }

      // Init for each file a result item (files's name,file's result)
      // Call the method analyseLogZip to send asynchronously the file
      this.files.forEach((file) => {
        this.results.push({file:file.name,result:null})
        this.analyseLogZip(file)
      })

      // Set sheet to true to display the popUp component
      this.sheet = true
      // Set to '' message 
      this.message = ''
      // Set to 'multipleFiles' action for the appropriate popup's display
      this.action = 'multipleFiles'
    },
    /**
     * Single file process which will simply send a request to the back with the file
     * And then wait for the file's result response
     */
    singleFile(){
      if (this.file == undefined){
        alert("You should select a file")
        return
      }
      console.log(process.env.VUE_APP_BACK_ADDRESS)
      console.log(process.env.VUE_APP_BACK_PORT)
      console.log(process.env.NODE_ENV)
      console.log(`${process.env.VUE_APP_BACK_ADDRESS}:${process.env.VUE_APP_BACK_PORT}/analyseLog`)
      this.sheet = true
      this.action = 'singleFile'
      const formData = new FormData();
      formData.append("log", this.file)
      instance.post(`analyseLog`, formData)
        .then(response => {
          if (response.data.length > 20)
            this.error = 'Unable to communicate with the server, please contact the admin'
          else
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
      /**
       * Close process whic00toh initialize all basic properties
       */
      close(){
        this.sheet = false
        this.message=''
        this.file = {}
        this.files = []
        this.results = []
        this.error = ''
      },
      /**
       * It aims to send the file from parameter to the back and wait for its answer 
       * @param {file} file - file to be send to the back
       * @async
       */
      async analyseLogZip(file){
        const formData = new FormData()
        formData.append("log", file)
        instance.post(`analyseLogZip`, formData)
          .then(response => {
            if (response.data.result.length > 20)
              this.error = 'Unable to communicate with the server, please contact the admin'
            else{
              this.results.forEach(result => {if (result.file == response.data.file) result.result = response.data.result})
              eventBus.addResult(response.data)

            }

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