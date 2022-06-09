require("dotenv").config()
const env = process.env
const {Telegraf, Telegram} = require("telegraf")
const createImageFromLetter = require("./generator.js")
const {trimMessage} = require("./utils.js")

const bot = new Telegraf(env.BOT_TOKEN)
const telegram = new Telegram(env.BOT_TOKEN)

bot.catch((err, ctx) => {
	console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.start(async ctx => {
	//log("Command /start")
	//const from = ctx.from

	await ctx.replyWithMarkdown(
		trimMessage(`
				👋 Hi. Send me any letter or number and I'll convert it to emoji-styled sticker.
				I also work in _inline mode_ so you can use me in any chat.

				Author's channel @FilteredInternet
				Feedback @mikhailsdv
				Hosted on [Deta.sh](https://deta.sh/)
			`),
		{
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Try inline mode",
							switch_inline_query: "",
						},
					],
				],
			},
		}
	)
})

bot.on("inline_query", async ctx => {
	const {query, from, id} = ctx.update.inline_query
	const queryTrim = query.trim()

	if (queryTrim.length) {
		const sticker = await createImageFromLetter(queryTrim.substr(0, 1))
		const response = await ctx.telegram.sendSticker(env.CACHE_CHAT_ID, {source: sticker})
		const stickerId = response.sticker.file_id
		await ctx.answerInlineQuery(
			[
				{
					type: "sticker",
					id,
					sticker_file_id: stickerId,
				},
			],
			{
				cache_time: 10,
			}
		)
	} else {
		await ctx.answerInlineQuery([], {
			cache_time: 10,
			switch_pm_text: "Type a letter or number",
			switch_pm_parameter: "start",
		})
	}
})

bot.on("chosen_inline_result", async ctx => {
	//log("Chosen inline result")
	const fileId = Number(ctx.update.chosen_inline_result.result_id)
	const chatId = ctx.from.id
	console.log("chosen_inline_result", chatId, fileId)
	/*increaseUsedCount({
		chat_id: chatId,
		id: fileId,
	})*/
})

bot.on("message", async (ctx, next) => {
	const chatId = ctx.chat.id
	const message = ctx.message
	const messageId = message.message_id
	const letter = (message.caption || message.text || "").trim().substr(0, 1)
	if (!letter) {
		return await ctx.replyWithMarkdown("There is not letter in your message ❗")
	}
	ctx.replyWithChatAction("choose_sticker")
	const image = await createImageFromLetter(letter)
	if (!image) {
		return await ctx.replyWithMarkdown("Couldn't create a sticker 😔")
	}
	await ctx.replyWithSticker({source: image})
})

module.exports = bot
