// npx nodemon checks.js
const fs= require('fs')
const english = JSON.parse(fs.readFileSync('./src/i18n/en.json'))
console.debug(Object.entries(english).sort((a,b)=>a[1].length-b[1].length).slice(-10,-1).map(([k,v])=>k+'\n'+k.split('').map(c=>'=').join('')+'\n\n'+v).join('\n\n'))