import {config} from "https://deno.land/x/dotenv/mod.ts"
import {Bot, Client} from "https://deno.land/x/telegram@v0.1.1/mod.ts"
import createImageFromLetter from "./generator.js"
import emoji from "./emoji.js"
import emojiUnicode from "./emoji-unicode.js"
import {trimMessage} from "./utils.js"

const env = config()
const bot = new Bot(env.BOT_TOKEN)
const client = new Client(env.BOT_TOKEN)

const sendSticker = async ({sticker, chat_id}) => {
	const body = new FormData()
	body.append("sticker", sticker)
	body.append("chat_id", chat_id)
	return fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendsticker`, {
		method: "POST",
		body,
	}).then(function (res) {
		return res.json()
	})
}

const commands = [
	{
		command: "start",
		handler: async (ctx, next) => {
			await ctx.replyWithMarkdown(
				trimMessage(`
				👋 Hi. Send me any letter or number and I'll convert it to emoji-styled sticker.
				I also work in _inline mode_ so you can use me in any chat.

				Author's channel @FilteredInternet
				Feedback @mikhailsdv
				Hosted on 🦕 Deno Deploy
			`)
			)
			next()
		},
	},
	//to be continued...
]

bot.use(async (ctx, next) => {
	try {
		await next(ctx)
	} catch (err) {
		console.error(err.message)
	}
})

bot.use(async (ctx, next) => {
	if (ctx.updateType !== "inline_query") return next()
	const {query, from, id} = ctx.update.inline_query
	const queryTrim = query.trim()

	try {
		if (queryTrim.length) {
			const response = await sendSticker({
				sticker: await createImageFromLetter(queryTrim.substr(0, 1)),
				chat_id: env.CACHE_CHAT_ID,
			})
			if (response.ok) {
				const stickerId = response.result.sticker.file_id
				await client.method("answerInlineQuery", {
					inline_query_id: id,
					cache_time: 10,
					results: [
						{
							type: "sticker",
							id,
							sticker_file_id: stickerId,
						},
					],
				})
			} else {
				console.error(response)
			}
		} else {
			await client.method("answerInlineQuery", {
				inline_query_id: id,
				results: [],
				cache_time: 10,
				switch_pm_text: "Введите букву",
				switch_pm_parameter: "start",
			})
		}
	} catch (err) {
		console.error(err)
	}

	next()
})

bot.use(async (ctx, next) => {
	if (ctx?.update?.message?.text) return next()
	await ctx.replyWithMarkdown("You must send me just a letter or number ❗")
})

commands.forEach(({command, handler}) => {
	bot.on("text", async (ctx, next) => {
		const text = ctx.message?.text
		console.log(1)
		if (text === `/${command}`) {
			await handler(ctx)
		} else {
			next()
		}
	})
})

bot.on("text", async (ctx, next) => {
	const text = ctx.message?.text?.trim()
	if (!text) {
		return await ctx.replyWithMarkdown("There is not letter in your message ❗")
	}
	await client.method("sendChatAction", {
		chat_id: ctx.from.id,
		action: "choose_sticker",
	})
	const image = await createImageFromLetter(text.substr(0, 1))
	if (!image) {
		return await ctx.replyWithMarkdown("Couldn't create a sticker 😔")
	}
	try {
		const response = await sendSticker({
			sticker: image,
			chat_id: ctx.from.id,
		})
		if (!response.ok) {
			console.error(response)
		}
		return
	} catch (err) {
		return console.error(err)
	}

	next()
})

bot.launch()
