module.exports = function(config) {
    const fileRules = config.module.rules.filter(rule =>
    rule.test.toString().match(/.(py)$/)
    )
    fileRules.forEach(rule => {
        const pyLoader = rule.use.find(use => use.loader === "file-loader")
        // this is the actual modification we make:
        pyLoader.options.modules = "local"
    })
    
    return config
}