const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const { extractFileFromArchive } = require('./archive.js')

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
            console.log('\nCould not determine Steam workshop directory, please use "--steam-dir="path/to/your/steam/dir/with/ets/or/ats" to supply it manually')
            console.log('Or exlude the Steam workshop analysis by using "-e, --exclude-workshop-mods"')
            process.exit(1)
        }
    }

    const appId = analyseEts ? '227300' : '270880'

    directoryPath = path.join(
        directoryPath,
        !directoryPath.includes('steamapps') ? 'steamapps' : '',
        !directoryPath.includes('workshop') ? 'workshop' : '',
        !directoryPath.includes('content') ? 'content' : '',
        appId
    )

    if (!fs.existsSync(directoryPath)) {
        console.log('\nCould not read workshop directory "'+ directoryPath + '"')
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
    .map(modPath => path.join(workshopDirectory, modPath))
    .filter(modPath => fs.lstatSync(modPath).isDirectory())

    modDirectories.map(dir => _extractModData(dir))

    return [] 
}

/**
 * @param {string} workshopModDirectory
 * 
 * @returns {ModArchive} for the given mod dir
 */
const _extractModData = (workshopModDirectory) => {
    const directoryFiles = fs.readdirSync(workshopModDirectory)

    const onlyOneArchive = directoryFiles
    .filter(filePath => filePath.includes('.zip') || filePath.includes('.scs'))
    .length === 1

    // if there is only one archive present in the directory
    // wen can safely assume, that this is the actual mod
    if (onlyOneArchive) {
        const archiveName = directoryFiles.find(filePath => filePath.includes('.zip'))
        || directoryFiles.find(filePath => filePath.includes('.scs'))

        return _getModNameFromManifest(path.join(workshopModDirectory, archiveName))
    }

    // else we need to analyse the versions.sii to get 
    // the correct archive

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

/**
 * 
 * @param {string} modPath 
 * 
 * @returns {ModArchive}
 */
const _getModNameFromManifest = (modPath) => {
    // extractFileFromArchive(modPath, 'manifest.sii')
}

module.exports = {
    determineWorkshopFolder,
    getListOfWorkshopArchives
}

