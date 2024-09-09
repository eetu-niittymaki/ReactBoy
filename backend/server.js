const express = require('express')
const axios = require('axios')
const cors = require('cors')
const router = express.Router()
require("dotenv").config({path: [".env", "../.env"]})

const url = "https://api.mobygames.com/v1/games"

//, express.static('build')

router.use(express.json(), cors(), (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

router.get('/', async (req, res) => {
  try {

    const results = await axios.get(url, {
        params: {
            api_key: process.env.API_KEY,
            title: req.query.title,
        }
    })
    res.status(200).send(results.data.games)
    return results.data.games
  } catch (error) {
    console.log(error)
  }
})

module.exports = router