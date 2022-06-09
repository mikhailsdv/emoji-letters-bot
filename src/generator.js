require("dotenv").config()
const env = process.env
const {Canvas, loadImage} = require("skia-canvas")
const emoji = require("./emoji.js")
const emojiUnicode = require("./emoji-unicode.js")
const {arrayRandom} = require("./utils.js")

const getBnWGrid = letter => {
	const size = Number(env.DETALIZATION)
	const canvas = new Canvas(size, size)
	const ctx = canvas.getContext("2d")

	ctx.font = `${Math.round(size * 0.8)}px Arial, sans-serif`
	ctx.fillStyle = "black"
	//ctx.imageSmoothingEnabled = false
	ctx.fillText(letter, 0, Math.round(size * 0.8))

	const pixels = ctx.getImageData(0, 0, size, size).data.reduce((acc, item, index) => {
		if ((index + 1) % 4 === 0) {
			acc.push(item / 255)
		}
		return acc
	}, [])

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
	const canvasWidth = pixelSize * gridWidth
	const canvasHeight = pixelSize * gridHeight

	const canvas = new Canvas(canvasWidth, canvasHeight)
	const ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvasWidth, canvasHeight)

	const image = await loadImage(arrayRandom(emoji).url)
	grid.forEach((row, y) => {
		row.forEach((item, x) => {
			if (!item) return
			const alpha = item * 5
			ctx.globalAlpha = alpha > 1 ? 1 : alpha
			ctx.drawImage(image, x * pixelSize, y * pixelSize, pixelSize, pixelSize)
		})
	})
	return canvas.toBuffer("png")
}

module.exports = async letter => await getEmojis(getBnWGrid(letter))
