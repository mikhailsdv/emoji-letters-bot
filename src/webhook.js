require("dotenv").config()
const env = process.env
const bot = require("./src/bot.js")
const express = require("express")
const expressApp = express()

expressApp.use(bot.webhookCallback(`/${env.BOT_TOKEN}`))

expressApp.get("/", (req, res) => {
  res.send("Hello World!")
})

module.exports = expressApp
