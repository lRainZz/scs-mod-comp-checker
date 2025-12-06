const path = require('path')
const fs = require('fs')
const { execute7zip } = require('./lib/seven-zip/index.js')
const TEMP_DATA_DIR = require('./lib/temp-dir.js')
const { version } = require('os')

/**
 * @param {string} workshopDirectory
 * @param {string} gameVersion
 * 
 * @returns {ModContainer[]}
 */
const getListOfWorkshopArchives = (workshopDirectory, gameVersion) => {
    const modDirectories = fs.readdirSync(workshopDirectory)
    .map(modPath => path.join(workshopDirectory, modPath))
    .filter(modPath => fs.lstatSync(modPath).isDirectory())

    // TODO, check errors, example "1236032431" could not be analyzed but is a folder mod
    console.log('workshop mods', modDirectories.map(dir =>_extractModData(dir, gameVersion)))

    return modDirectories.map(dir =>_extractModData(dir, gameVersion))
}

/**
 * @param {string} workshopModDirectory
 * @param {string} gameVersion
 * 
 * @returns {ModContainer} for the given mod dir
 */
const _extractModData = (workshopModDirectory, gameVersion) => {
    const directoryFiles = fs.readdirSync(workshopModDirectory)

    // workshop mods can either be archvies OR just straight up folders
    // if there is only one container (folder or archive) besides
    // the versions.sii, then we can safely use that
    const containersInModDir = directoryFiles
    .filter(filePath => !filePath.includes('versions.sii'))

    /** @type {string | undefined} */
    let pathToContainerToUse = undefined
    /** @type {string | undefined} */
    let modName = undefined
    /** @type {any} */
    let modError = null
    let modIsArchive = true

    try {
        if (containersInModDir.length === 1) {
            // if there is only one container present in the directory
            // wen can safely assume, that this is the actual mod
            pathToContainerToUse = path.join(workshopModDirectory, containersInModDir[0])
        } else {
            // else we need to analyse the versions.sii to get the correct archive
            pathToContainerToUse = _getArchiveToAnalyzeFromVersionsSii(workshopModDirectory, gameVersion)
        }

        if (!pathToContainerToUse) throw 'Could not determine archive name of workshop mod'

        modIsArchive = pathToContainerToUse?.endsWith('.scs') || pathToContainerToUse?.endsWith('.zip')

        modName = _getModNameFromManifest(pathToContainerToUse, modIsArchive)
    } catch (error) {
        modError = error

        if (error instanceof Error) {
            modError = error?.message
        }
    }

    /** @type {ModContainer} */
    const result = {
        path:       pathToContainerToUse,
        modName:    modName,
        workshopId: path.basename(workshopModDirectory),
        isArchive:  modIsArchive,
        error:      modError
    }

    return result
}

/**
 * 
 * @param {string} modPath
 * 
 * @returns {string}
 */
const _getModNameFromManifest = (modPath, isArchive = true) => {
    const MANIFEST_FILE = 'manifest.sii'

    let manifestToAnalyze

    // if the mod is an archive, we need to extract the manifest.sii first
    if (isArchive) {
        execute7zip([
            'x',
            modPath,
            // mod name is defined in the root dir file manifest.sii
            MANIFEST_FILE,
            `-o${TEMP_DATA_DIR}`,
            // force overwrite of previous extracted file
            '-y'
        ])

        manifestToAnalyze = path.join(TEMP_DATA_DIR, MANIFEST_FILE)
    } else {
        manifestToAnalyze = path.join(modPath, MANIFEST_FILE)
    }

    const manifestContent = fs.readFileSync(manifestToAnalyze, { encoding: 'utf-8' })

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
 * @param {string} gameVersion version string for looking up the correct archive
 * 
 * @returns {string} path of mod container
*/
const _getArchiveToAnalyzeFromVersionsSii = (modPath, gameVersion) => {
    const VERSIONS_FILE = 'versions.sii'

    const versionsFileContent = fs.readFileSync(path.join(modPath, VERSIONS_FILE), { encoding: 'utf-8' })
    const packageVersionBlocks = _parseVersionSii(versionsFileContent)

    const correctVersionBlock = packageVersionBlocks.find(versionBlock =>
        // try to find the block that contains a compatible version
        // for the current game version
        versionBlock.compatibleVersions.find(version => {
            // the versions from the compatibleVersions look like this:
            // "1.34.*" - "1.33.*" - "1.32.*"
            // if we cut away the star at the end, we can simply check if
            // the string is part of the current game version (alternatively we could
            // build the following regex to check against: "1\.34\..*")
            const versionToCheck = version.slice(0, -1)
            return gameVersion.includes(versionToCheck)
        })
    )

    let archiveName

    if (correctVersionBlock) {
        archiveName = correctVersionBlock.packageName
    } else {
        // try to get the universal version block
        archiveName = packageVersionBlocks.find(versionBlock => versionBlock.universal === true)?.packageName
    }

    if (!archiveName) {
        throw new Error(`\nCould not determine archive of "${modPath}" to use for the current game version (also no universal archive)`)
    }

    const container = fs.readdirSync(modPath).find(path => path.includes(archiveName))

    if (!container) {
        throw new Error(`\nCould not find container (archive or folder) in "${modPath}`)
    }

    return path.join(modPath, container)
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

