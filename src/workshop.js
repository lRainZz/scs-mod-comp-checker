const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const { execute7zip } = require('./seven-zip/index.js')
const TEMP_DATA_DIR = require('./temp-dir.js')

const ETS_APP_ID = '227300'
const ATS_APP_ID = '270880'

/**
 * @param {boolean} analyseEts
 * @param {string} manualPath
 * 
 * @returns {string} Path to the workshop folder
 */
const determineWorkshopFolder = (analyseEts, manualPath = '') => {
    /** @type {string | null} */
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

    const appId = analyseEts ? ETS_APP_ID : ATS_APP_ID

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

    const workshopMods = modDirectories.map(dir =>_extractModData(dir))

    console.log('workshop mods', workshopMods)

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

    // use the workshop folder name (workshop mod id) as fallback
    const modNameFallback = path.basename(workshopModDirectory)

    /** @type {ModArchive} */
    const result = {
        path:    workshopModDirectory,
        modName: modNameFallback,
        error:   null
    }

    try {
        /** @type {string | undefined} */
        let archiveToUse

        if (onlyOneArchive) {
            // if there is only one archive present in the directory
            // wen can safely assume, that this is the actual mod
            archiveToUse = directoryFiles.find(filePath => filePath.includes('.zip'))
            || directoryFiles.find(filePath => filePath.includes('.scs'))
        } else {
            // else we need to analyse the versions.sii to get 
            // the correct archive
            // TODO:
        }

        if (!archiveToUse) throw 'Could not determine archive name of workshop mod'

        result.modName = _getModNameFromManifest(path.join(workshopModDirectory, archiveToUse))
    } catch (error) {
        result.error = error

        if (error instanceof Error) {
            result.error = error?.message
        }
    }

    return result
}

/**
 * 
 * @param {string} modPath
 * 
 * @returns {string}
 */
const _getModNameFromManifest = (modPath) => {
    const MANIFEST_FILE = 'manifest.sii'

    execute7zip([
        'x',
        modPath,
        // mod name is defined in the root dir file manifest.sii
        MANIFEST_FILE,
        `-o${TEMP_DATA_DIR}`,
        // force overwrite of previous extracted file
        '-y'
    ])

    const extractedFilePath = path.join(TEMP_DATA_DIR, MANIFEST_FILE)
    const manifestContent = fs.readFileSync(extractedFilePath, { encoding: 'utf-8' })

    const displayNameLine = manifestContent.split('\n').find(line => line.includes('display_name:'))
    const displayNameRegex = /display_name:\s*"([^"]+)"/
    const displayNameMatch = displayNameLine?.match(displayNameRegex)

    const name = displayNameMatch?.at(1)

    if (!name) throw 'Could not determine workshop mod name from manifest'

    return name
}

module.exports = {
    determineWorkshopFolder,
    getListOfWorkshopArchives
}

