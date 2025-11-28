const path = require('path')
const fs = require('fs')
const TEMP_DATA_DIR = require('../temp-dir.js')
const { execFileSync } = require('child_process')

const SEVEN_ZIP_EXTERNAL_PATH = path.join(TEMP_DATA_DIR, '7za.exe')

const installSevenZip   = () => fs.copyFileSync(path.join(__dirname, '7za.exe'), SEVEN_ZIP_EXTERNAL_PATH)
const uninstallSevenZip = () => fs.rmSync(SEVEN_ZIP_EXTERNAL_PATH)

const execute7zip = (commandList) => {
    try {
        return execFileSync(
            SEVEN_ZIP_EXTERNAL_PATH,
            commandList,
            { encoding: "utf8", stdio: [] }
        )
    } catch (error) {
        throw error
    }

}

module.exports = {
    installSevenZip,
    uninstallSevenZip,
    execute7zip
}