const parseData = require("./back_utils/parseData")
const parseCsv = require("./parseNameFromCsv")
const express = require('express')
const path = require('path')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()

const server = express()
const port = process.env.PORT || 8000
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

const getGame = async (title) => {
  try {
    return await axios.get(url, {
      params: {
        api_key: process.env.API_KEY,
        title: title,
      }
    })
  } catch (error) {
    console.log(error)
  }
}

const getCompanies = async (obj, res) => {
  const devUrl = `https://api.mobygames.com/v1/games/${obj.id}/platforms/10`
  try {
    const result = await axios.get(devUrl, {
      params: {
        api_key: process.env.API_KEY,
      }
    })

    const dev_name = parseData.parseCompanies(result.data.releases[0].companies) // Parse to get the developer and not a publisher or something like that
    if (dev_name) obj["developer_name"] = dev_name // Add item to object
    res.status(200).send(obj)                      // Finally send object back
  } catch (error) {
    console.log(error)
  }
}

// API route for fetching data
server.get('/api/games', async (req, res) => {
  let title = req.query.title
  const parsedName = parseCsv.parseNameFromCsv(title)                       // Use algorithm to check what title is most similar to from released games (stupid)
  const results = await getGame(parsedName.toLowerCase().replace("\r", "")) //First get game data by name
  const findGame = parseData.parseRes(results.data.games)                   // Parse to ge the first released one
  setTimeout(() => {              // Timeout needed because of API limitations
    getCompanies(findGame, res) // Find companies related to game by game id
  }, 800)
})

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
