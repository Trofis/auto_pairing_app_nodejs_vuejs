module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        files:[
          "**/*",
          "src/scripts_python/*.py",
          "src/scripts_js/task_processor.js",
          "src/bash_script/code_linux"


        ],
        asar:false,
        extraResources:[
          "src/scripts_python/*.py",
          "src/scripts_js/task_processor.js",
          "src/bash_script/code_linux"


        ]
      }
    }
  }
}