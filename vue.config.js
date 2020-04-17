module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        files:[
          "**/*",
          "src/utils/py/*.py",
          "src/utils/js/task_processor.js",
          "src/utils/bash/code_linux"
        ],
        asar:false,
        extraResources:[
          "src/utils/py/*.py",
          "src/utils/js/task_processor.js",
          "src/utils/bash/code_linux"
        ]
      }
    }
  }
}