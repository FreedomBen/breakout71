// npx nodemon checks.js --watch checks.js
const fs= require('fs')
const files = fs.readdirSync('./src/i18n/')
for(let filename of files){
    if(!filename.endsWith('.json')) continue
    const content = JSON.parse(fs.readFileSync(`./src/i18n/${filename}`))
    for(let key in content){
        if(content[key].match(/<|>|http|puck|palet|퍽|disco|шайба|冰球|rondelle/gi)){
            content[key]=''
            console.log(`Removed ${key} of ${filename}`)
        }
    }
    fs.writeFileSync(`./src/i18n/${filename}`, JSON.stringify(content, null,4)+'\n')
}
