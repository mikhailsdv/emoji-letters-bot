const fs = require("fs")
const path = require("path")
const {Canvas, loadImage, FontLibrary} = require("skia-canvas")
//const emoji = require("./emoji.js")
//const emojiUnicode = require("./emoji-unicode.js")
const {arrayRandom, env, limitByOne} = require("./utils.js")

const emojiPath = path.resolve(__dirname, "./emoji")
const emojiDir = fs.readdirSync(emojiPath)
const emoji = emojiDir.map(filename => path.resolve(emojiPath, filename))

FontLibrary.use("Default", [path.resolve(__dirname, "./font.ttf")])

const getBnWGrid = letter => {
	const size = Number(env.DETALIZATION)
	const canvas = new Canvas(size, size)
	const ctx = canvas.getContext("2d")

	ctx.font = `${Math.round(size * 0.8)}px Default, sans-serif`
	ctx.fillStyle = "black"
	ctx.fillText(letter, 0, Math.round(size * 0.8))

	const pixels = []
	const imageData = ctx.getImageData(0, 0, size, size).data
	for (let i = 0; i < imageData.length; i += 4) {
		const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3 / 255 //grayscale for emoji
		const alpha = imageData[i + 3] / 255 //opacity and letters
		const avgByAlpha = avg * alpha //opacitify avg

		const _avgByAlpha = limitByOne(avgByAlpha * 3) //"saturation" for avg
		const _alpha = limitByOne(alpha * 3) //"saturation" for letters

		pixels.push(_avgByAlpha > 0 ? _avgByAlpha : _alpha)
	}

	const grid = pixels.reduce((acc, item, index) => {
		const y = Math.floor(index / size)
		const x = index - y * size
		!acc[y] && (acc[y] = [])
		acc[y][x] = item
		return acc
	}, [])

	const borders = grid.reduce(
		(acc, row, y) => {
			const nonEmptyRow = row.some(item => item)
			if (nonEmptyRow && acc.endY < y) {
				acc.endY = y
			}
			if (!acc.startY && nonEmptyRow) {
				acc.startY = y
			}

			const startX = row.findIndex(item => item)
			if (startX >= 0 && startX < acc.startX) acc.startX = startX

			const endXReverse = row
				.slice()
				.reverse()
				.findIndex(item => item)
			const endX = endXReverse >= 0 ? size - 1 - endXReverse : -1
			if (endX >= 0 && endX > acc.endX) acc.endX = endX

			return acc
		},
		{
			startX: size - 1,
			endX: 0,
			startY: 0,
			endY: 0,
		}
	)

	const gridTrim = grid.reduce((acc, row, y) => {
		if (y < borders.startY || y > borders.endY) return acc
		acc[acc.length] = row.slice(borders.startX, borders.endX + 1)
		return acc
	}, [])

	return gridTrim
}

const getEmojis = async grid => {
	const gridWidth = grid?.[0]?.length
	const gridHeight = grid.length
	if (!gridWidth) return null
	const pixelSize = Number(env.PIXEL_SIZE)
	const padding = Number(env.PADDING) * pixelSize
	const canvasWidth = pixelSize * gridWidth + padding * 2
	const canvasHeight = pixelSize * gridHeight + padding * 2

	const canvas = new Canvas(canvasWidth, canvasHeight)
	const ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvasWidth, canvasHeight)

	//const image = await loadImage(arrayRandom(emoji).url)
	const image = await loadImage(arrayRandom(emoji))
	grid.forEach((row, y) => {
		row.forEach((alpha, x) => {
			if (!alpha) return
			ctx.globalAlpha = alpha
			ctx.drawImage(
				image,
				padding + x * pixelSize,
				padding + y * pixelSize,
				pixelSize,
				pixelSize
			)
		})
	})
	return canvas.toBuffer("png")
}

module.exports = async letter => await getEmojis(getBnWGrid(letter))
