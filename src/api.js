const {join} = require("path")
const {Low, JSONFile} = require("lowdb-node")
const {fileURLToPath} = require("url")

const file = join(__dirname, "db.json")
const adapter = new JSONFile(file)
const db = new Low(adapter)

const saveRequest = async ({
	from_id,
	username,
	first_name,
	language_code,
	text,
	letter,
	status,
	mode,
}) => {
	await db.read()
	db.data.requests.push({
		from_id,
		username,
		first_name,
		language_code,
		text,
		letter,
		status,
		mode,
		date: new Date().toISOString(),
	})
	await db.write()
}

module.exports = {saveRequest}
