const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const TEMP_DATA_DIR = require('../temp-dir')

const SEVEN_ZIP_EXTERNAL_PATH = path.join(TEMP_DATA_DIR, '7za.exe')

// extract 7za but do not overwrite it if it exists to comply with the 7za lesser GPL!
const installSevenZip = () => {
    try {
        console.log('dirname join', path.join(__dirname, '7za.exe'))
        console.log('dirname resolve', path.resolve(__dirname, '7za.exe'))
        fs.copyFileSync(path.join(__dirname, '7za.exe'), SEVEN_ZIP_EXTERNAL_PATH, fs.constants.COPYFILE_EXCL)
    } catch (error) {
        if (error instanceof Error && 'code' in Error) {
            if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
                // silent exception -> 7za.exe already exists and we're using that
                return
            }
        }

        // else we rethrow the error as it was unexpected
        throw error
    }
}

const uninstallSevenZip = () => fs.rmSync(SEVEN_ZIP_EXTERNAL_PATH)

const execute7zip = (commandList: string[]): string => {
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

export {
    execute7zip,
    installSevenZip,
    uninstallSevenZip
}
