const path = require('path')
const fs = require('fs')
const TEMP_DATA_DIR = require('../temp-dir.js')
const { execFileSync } = require('child_process')

const SEVEN_ZIP_EXTERNAL_PATH = path.join(TEMP_DATA_DIR, '7za.exe')

// extract 7za but do not overwrite it if it exists to comply with the 7za lesser GPL!
const installSevenZip   = () => {
    try {
        fs.copyFileSync(path.join(__dirname, '7za.exe'), SEVEN_ZIP_EXTERNAL_PATH, fs.constants.COPYFILE_EXCL)
    } catch (error) {
        // silent exception -> 7za.exe already exists and we're using that
    }
}
const uninstallSevenZip = () => fs.rmSync(SEVEN_ZIP_EXTERNAL_PATH)

/**
 * 
 * @param {string[]} commandList
 * 
 * @returns {string} stdout/stderr result string
 */
const execute7zip = (commandList) => {
    try {
        return execFileSync(
            SEVEN_ZIP_EXTERNAL_PATH,
            commandList,
            {
                encoding: 'utf8',
                stdio: [],
                // set buffer (from default 200kB) to 50MB
                // so large archives don't exceed the output buffer
                maxBuffer: 1024 * 1024 * 50
            }
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