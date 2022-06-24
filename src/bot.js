require("dotenv").config()
const env = process.env
const {Telegraf} = require("telegraf")
const createImageFromLetter = require("./generator.js")
const {trimMessage} = require("./utils.js")
const {saveRequest} = require("./api.js")

const bot = new Telegraf(env.BOT_TOKEN)

bot.catch((err, ctx) => {
	console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.start(async ctx => {
	console.log("start")
	await ctx.replyWithMarkdown(
		trimMessage(`
				👋 Hi. Send me any letter or number and I'll convert it to emoji-styled sticker.
				I also work in _inline mode_ so you can use me in any chat.

				Author's channel @FilteredInternet
				Feedback @mikhailsdv
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
		console.log("sent inline sticker")
	} else {
		await ctx.answerInlineQuery([], {
			cache_time: 10,
			switch_pm_text: "Type a letter or number",
			switch_pm_parameter: "start",
		})
		console.log("empty inline query")
	}
})

bot.on("chosen_inline_result", async ctx => {
	console.log("chosen inline result")
	await saveRequest({
		from_id: ctx.update.chosen_inline_result.from.id,
		username: ctx.update.chosen_inline_result.from.username || "",
		first_name: ctx.update.chosen_inline_result.from.first_name,
		language_code: ctx.update.chosen_inline_result.from.language_code || "",
		text: ctx.update.chosen_inline_result.query,
		letter: ctx.update.chosen_inline_result.query.trim().substr(0, 1),
		status: true,
		mode: "inline",
	})
})

bot.on("message", async (ctx, next) => {
	console.log("message")
	const message = ctx.message
	const messageId = message.message_id
	const text = message.caption || message.text || ""
	const letter = text.trim().substr(0, 1)
	if (!letter) {
		return await ctx.replyWithMarkdown("There is no letter in your message ❗")
	}
	ctx.replyWithChatAction("choose_sticker")
	const image = await createImageFromLetter(letter)
	if (!image) {
		await saveRequest({
			from_id: ctx.from.id,
			username: ctx.from.username,
			first_name: ctx.from.first_name,
			language_code: ctx.from.language_code,
			text,
			letter,
			status: false,
			mode: "message",
		})
		console.log("error while sending sticker")
		return await ctx.replyWithMarkdown("Couldn't create a sticker 😔")
	}
	await ctx.replyWithSticker({source: image})
	await saveRequest({
		from_id: ctx.from.id,
		username: ctx.from.username,
		first_name: ctx.from.first_name,
		language_code: ctx.from.language_code,
		text,
		letter,
		status: true,
		mode: "message",
	})
	console.log("sticker sent")
})

module.exports = bot
