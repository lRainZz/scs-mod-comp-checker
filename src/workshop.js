const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const determineWorkshopFolder = (analyseEts, manualPath) => {
    const ERRORS = {
        STEAM_NOT_FOUND: 'steam-not-found',
        WORKSHOP_NOT_IN_MAIN: 'ets-workshop-not-in-main-steam-installation'
    }

    try {
        // try to read the steam install folder from the windows registry
        const output = execSync(
            'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
            { encoding: 'utf-8' }
        )

        const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);
        let directoryPath = match ? match[1].trim().replace(/\\\\/g, "\\") : null

        if (!directoryPath) {
            throw ERRORS.STEAM_NOT_FOUND
        }

        const appId = analyseEts ? '227300' : '270880'

        directoryPath = path.join(
            directoryPath,
            !directoryPath.includes('/steamapps') ? 'steamapps' : '',
            !directoryPath.includes('/workshop') ? 'workshop' : '',
            !directoryPath.includes('/content') ? 'content' : '',
            !directoryPath.includes(appId) ? appId : ''
        )

        if (!fs.existsSync(directoryPath)) {
            throw ERRORS.WORKSHOP_NOT_IN_MAIN
        }

        return directoryPath
    } catch (error) {
        console.log('Could not determine Steam workshop directory, please "-s, --steam-dir" to supply it manually')
        
        if (!Object.values(ERRORS).includes(error)) {
            throw error
        }
    }
}

module.exports = {
    determineWorkshopFolder
}

