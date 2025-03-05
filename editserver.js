const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs')
const app = express()
const port = 4400

const srcPath = 'src/levels.json'
app.use(bodyParser.text({
    type: 'text/plain',
    limit:'1MB'
}));


app.get('/', (req, res) => {
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Level editor</title>
    <link rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎨</text></svg>"
    />
</head>
<body>
 
<div id="levels"></div> 
<div id="palette">
<button id="new-level">new</button>
</div>  

<style>
${fs.readFileSync('./editclient.css').toString()}
</style> 
<script>
const allLevels = ${fs.readFileSync(srcPath).toString()};
const palette = ${fs.readFileSync('src/palette.json').toString()};
${fs.readFileSync('./editclient.js').toString()}
</script>  
</body>  
  `)
})
app.post('/', (req, res) => {
    console.log(req.body)
    if(req.body?.trim()) {
        fs.writeFileSync(srcPath, req.body)
    }
    res.end('OK')
})

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
