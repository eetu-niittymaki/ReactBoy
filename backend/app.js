const express = require('express')
const app = express()
const cors = require('cors')
const server = require('./server.js')

app.use(server, cors())
const port = process.env.PORT || 8080

// Start server
const getConnection = app.listen(port, async () => {
  try {
    console.log('Connection succesful')
    console.log(`Listening to port ${await getConnection.address().port}`)
  } catch (err) {
    console.log(err)
    getConnection.close()
  }
})