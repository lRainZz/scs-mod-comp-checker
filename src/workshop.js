const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

/**
 * @param {boolean} analyseEts
 * @param {string} manualPath
 * 
 * @returns {string} Path to the workshop folder
 */
const determineWorkshopFolder = (analyseEts, manualPath = '') => {
    let directoryPath = manualPath

    if (!manualPath) {
        // try to read the steam install folder from the windows registry
        const output = execSync(
            'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
            { encoding: 'utf-8' }
        )

        const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);
        directoryPath = match ? match[1].trim().replace(/\\\\/g, "\\") : null

        if (!directoryPath) {
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

/**
 * @param {string} workshopDirectory
 * 
 * @returns {ModArchive[]}
 */
const getListOfWorkshopArchives = (workshopDirectory) => {
    const modDirectories = fs.readdirSync(workshopDirectory)
    .filter(path => fs.lstatSync(path).isDirectory())

    return [] // modDirectories.map(dir => _extractModData(dir))
}

/**
 * @param {string} workshopModDirectory
 * 
 * @returns {ModArchive} for the given mod dir
 */
const _extractModData = (workshopModDirectory) => {
    // TODO: 
    // - analyse versions.sii to get the correct archive (newest)
    // - analyse manifest.ssi for the mod name (workshop: [name] - [modId])
    //      -> refactor getArchivePathsOfDirectory to add a mod name to the path
    //         since the workshop archives have arbitrary names
    /** @type {ModArchive} */
    const result = {
        modName: 'TODO',
        path: 'TODO'
    }

    return result
}

module.exports = {
    determineWorkshopFolder,
    getListOfWorkshopArchives
}

