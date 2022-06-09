require("dotenv").config()
const env = process.env
const bot = require("./bot.js")
/*expressApp.use(bot.webhookCallback('/' + TOKEN));
  bot.telegram.setWebhook(URL + TOKEN);*/

bot.startWebhook(`/bot${env.BOT_TOKEN}`, null, env.PORT)
