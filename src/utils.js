const trimMessage = str => str.replace(/\t+/gm, "")

const arrayRandom = arr => {
	return arr[Math.floor(Math.random() * arr.length)]
}

module.exports = {trimMessage, arrayRandom}
