const fs = require('fs')
const os = require('os')
const path = require('path')

const TEMP_DATA_DIR = path.join(os.homedir(), 'Appdata', 'Local', 'smcc')
fs.mkdirSync(TEMP_DATA_DIR, { recursive: true })

module.exports = TEMP_DATA_DIR