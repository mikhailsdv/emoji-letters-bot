const {Telegraf} = require("telegraf")
const createImageFromLetter = require("./generator.js")
const {env, trimMessage, wait, extractLetters} = require("./utils.js")
const {saveRequest} = require("./api.js")
const bot = new Telegraf(env.BOT_TOKEN)

bot.catch((err, ctx) => {
	console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.start(async ctx => {
	console.log("start")
	await ctx.replyWithMarkdown(
		trimMessage(`
				👋 Hi. Send me any letter, number or word up to 12 characters and I'll convert it to emoji-styled sticker.
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
	const {query, id} = ctx.inlineQuery
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
		from_id: ctx.chosenInlineResult.from.id,
		username: ctx.chosenInlineResult.from.username || "",
		first_name: ctx.chosenInlineResult.from.first_name,
		language_code: ctx.chosenInlineResult.from.language_code || "",
		text: ctx.chosenInlineResult.query,
		letter: ctx.chosenInlineResult.query.trim().substr(0, 1),
		status: true,
		mode: "inline",
	})
})

bot.on("message", async ctx => {
	console.log("message")
	const message = ctx.message
	//const messageId = message.message_id
	const text = (message.caption || message.text || "").trim()
	if (!text) {
		return await ctx.replyWithMarkdown("There is no letter in your message ❗")
	}
	await ctx.replyWithChatAction("choose_sticker")

	const letters = extractLetters(text)
	for (const letter of letters) {
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
			await ctx.replyWithMarkdown("Couldn't create a sticker 😔")
			continue
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
		await wait(200)
	}
})

module.exports = bot
