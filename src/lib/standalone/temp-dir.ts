import fs from 'fs'
import os from 'os'
import path from 'path'

const TEMP_DATA_DIR: string = path.join(os.homedir(), 'Appdata', 'Local', 'smcc')
fs.mkdirSync(TEMP_DATA_DIR, { recursive: true })

export default TEMP_DATA_DIR