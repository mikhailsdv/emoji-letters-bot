const path = require("path")
require("dotenv").config({path: path.resolve(__dirname, "../.env")})
const env = process.env

const trimMessage = str => str.replace(/\t+/gm, "")

const arrayRandom = arr => {
	return arr[Math.floor(Math.random() * arr.length)]
}

const wait = d => new Promise(r => setTimeout(r, d))

const extractLetters = str => str.replace(/[\s\n\t\rㅤ⠀ ]/gm, "").substr(0, env.MAX_MESSAGE_LENGTH)

const limitByOne = n => (n > 1 ? 1 : n)

module.exports = {env, trimMessage, arrayRandom, wait, extractLetters, limitByOne}
