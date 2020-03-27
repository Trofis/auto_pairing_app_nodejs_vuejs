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

        ],
        asar:false,
        extraResources:[
          "src/scripts_python/*.py",

        ]
      }
    }
  }
}