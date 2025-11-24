const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const determineWorkshopFolder = (analyseEts, manualPath = '') => {
    const ERRORS = {
        STEAM_NOT_FOUND: 'steam-not-found',
        WORKSHOP_NOT_IN_MAIN: 'ets-workshop-not-in-main-steam-installation'
    }

    let directoryPath = manualPath

    if (!manualPath) {
        try {
            // try to read the steam install folder from the windows registry
            const output = execSync(
                'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
                { encoding: 'utf-8' }
            )

            const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);
            directoryPath = match ? match[1].trim().replace(/\\\\/g, "\\") : null

            if (!directoryPath) {
                throw ERRORS.STEAM_NOT_FOUND
            }
        } catch (error) {
            console.log('Could not determine Steam workshop directory, please use "--steam-dir="path/to/your/steam/dir/with/ets/or/ats" to supply it manually')
            console.log('Or exlude the Steam workshop analysis by using "-e, --exclude-workshop-mods"')
            process.exit(1)
        }
    }

    const appId = analyseEts ? '227300' : '270880'

    directoryPath = path.join(
        directoryPath,
        !directoryPath.includes('/steamapps') ? 'steamapps' : '',
        !directoryPath.includes('/workshop') ? 'workshop' : '',
        !directoryPath.includes('/content') ? 'content' : '',
        appId
    )

    if (!fs.existsSync(directoryPath)) {
        console.log('Could not read workshop directory "'+ directoryPath + '"')
        process.exit(1)
    }

    return directoryPath
}

module.exports = {
    determineWorkshopFolder
}

