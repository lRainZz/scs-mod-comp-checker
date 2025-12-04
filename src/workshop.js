const path = require('path')
const fs = require('fs')
const { execute7zip } = require('./lib/seven-zip/index.js')
const TEMP_DATA_DIR = require('./lib/temp-dir.js')

/**
 * @param {string} workshopDirectory
 * @param {string} gameVersion
 * 
 * @returns {ModArchive[]}
 */
const getListOfWorkshopArchives = (workshopDirectory, gameVersion) => {
    const modDirectories = fs.readdirSync(workshopDirectory)
    .map(modPath => path.join(workshopDirectory, modPath))
    .filter(modPath => fs.lstatSync(modPath).isDirectory())

    const workshopMods = modDirectories.map(dir =>_extractModData(dir, gameVersion))

    // console.log('workshop mods', workshopMods)

    return [] 
}

/**
 * @param {string} workshopModDirectory
 * @param {string} gameVersion
 * 
 * @returns {ModArchive} for the given mod dir
 */
const _extractModData = (workshopModDirectory, gameVersion) => {
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

            // TODO:
            // using game version
            // console.log('analyzing', _getArchiveToAnalyzeFromVersionsSii(workshopModDirectory))
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

/**
 * this function is NOT utilizing a real sii parser
 * the determination of the correct version is done by simple
 * string comparisons and simple keyword analysis
 * 
 * @param {string} modPath path to the mod folder
 * 
*/
// * @returns {string} name of the archive to use (without extension!)
const _getArchiveToAnalyzeFromVersionsSii = (modPath) => {
    const VERSIONS_FILE = 'versions.sii'

    const versionsFileContent = fs.readFileSync(path.join(modPath, VERSIONS_FILE), { encoding: 'utf-8' })
    const packageVersionBlocks = _parseVersionSii(versionsFileContent)

    // if there is a universal block, we use that

    return packageVersionBlocks
}

/**
 * @param {string} versionSiiContent 
 * 
 * @returns {PackageVersionBlock[]}
 */
const _parseVersionSii = (versionSiiContent) => {
    const PACKAGE_VERSION_BLOCK_REGEX = /package_version_info\s*:\s*([^\s]+)\s*\{([\s\S]*?)\}/g

    /** @type {PackageVersionBlock[]} */
    const packageVersionBlocks = []

    let match

    // get all package_version_info blocks
     while ((match = PACKAGE_VERSION_BLOCK_REGEX.exec(versionSiiContent)) !== null) {
        const body = match[2]

        const nameMatch   = body.match(/package_name:\s*"([^"]+)"/)
        const packageName = nameMatch ? nameMatch[1] : 'THIS_CAN_NOT_HAPPEN_PROVE_ME_WRONG'

        const compatibleVersions = [...body.matchAll(/compatible_versions\[\]:\s*"([^"]+)"/g)].map(match => match[1])

        /** @type {PackageVersionBlock} */
        const pacakgeVersionBlock = {
            packageName,
            compatibleVersions,
            universal: compatibleVersions.length === 0
        }

        packageVersionBlocks.push(pacakgeVersionBlock)
    }

    return packageVersionBlocks
}

module.exports = {
    getListOfWorkshopArchives
}

