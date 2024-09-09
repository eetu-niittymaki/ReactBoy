const express = require('express')
const path = require('path')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()

const server = express()
const port = process.env.PORT || 8080
const url = 'https://api.mobygames.com/v1/games'

server.use(
  express.json(),
  cors(), 
  express.static(path.join(__dirname, '/build')),
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
  }
)


// API route for fetching data
server.get('/api/games', async (req, res) => {
  try {
    const results = await axios.get(url, {
      params: {
        api_key: process.env.API_KEY,
        title: req.query.title,
      },
    })
    console.log(results.data)
    res.status(200).send(results.data.games)
  } catch (error) {
    console.error(error)
    //res.status(500).send('Error fetching games data')
  }
})

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
