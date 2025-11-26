const path = require('path')
const os = require('os')
const fs = require('fs')

const TEMP_DATA_DIR = path.join(os.homedir(), 'Appdata', 'Local', 'smcc')
fs.mkdirSync(TEMP_DATA_DIR, { recursive: true })

module.exports = TEMP_DATA_DIR