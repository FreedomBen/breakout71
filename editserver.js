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

app.post('/', (req, res) => {
    if(req.body?.trim()) {
        fs.writeFileSync(srcPath, req.body)
    }
    res.end('OK')
})

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
