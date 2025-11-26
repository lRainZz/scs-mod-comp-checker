const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')
const { execute7zip } = require('./seven-zip/index.js')

const APP_DATA_PATH           = path.join(os.homedir(), 'Appdata', 'Local', 'smcc')
const SEVEN_ZIP_INTERNAL_PATH = path.join(__dirname, '..', 'lib', '7za.exe')
fs.mkdirSync(APP_DATA_PATH, { recursive: true })

/**
 * @param {string} directory path
 * 
 * @returns {ModArchive[]} list of valid archives
 */
const getArchivePathsOfDirectory = (directory) => {
    const paths = fs.readdirSync(directory)
    // ets only supports archives in scs or zip format
    // no need to check for other formats or directories
    .filter(archivePath => archivePath.endsWith('.scs') || archivePath.endsWith('.zip'))
    .map(archivePath => path.resolve(directory, archivePath))

    return paths.map(archivePath => {
        /** @type {ModArchive} */
        const result = {
            modName: path.basename(archivePath),
            path: archivePath
        }
        return result
    })
}

/**
 * @param {string} pathToArchive
 * 
 * @returns {Promise<string[]>} list of files in archive
 */
const _listFilesOfArchive = (pathToArchive, withAutomatFiles = false) => {
    let output = ''

    try {
        output = execute7zip([
            "l",
            "-ba",
            pathToArchive
        ])
    } catch (error) {
        console.log('\n7zip error while listing files of archive:', error)
        throw error
    }

    // 7zip uses the following file attributes:
    // D.... - directory
    // .R... - read-only
    // ..H.. - hidden
    // ...S. - system (windows system file)
    // ....A - archive (normal file)
    // an entry looks like this:
    // date - time - file attributes - size uncompressed - size compressed - path
    // 2025-06-02 19:16:52 ....A      1398256         3082  vehicle/truck/upgrade/paintjob/scania.t/airbrush/accessories/acc_0.dds
    const pathList = []

    output.trim().split('\n')
    .forEach(entry => { 
        // collapse whitespace to single spaces
        entry = entry.trim().replaceAll(/\s+/g, ' ')

        // check for control/non-printable characters
        // and clean them up
        if (entry.match(/[\x00-\x1F\x7F]/g)) {
            entry = entry.replace(/[\x00-\x1F\x7F]/g, '').replace('undefined', '').replace(/0M Scan/g, '').trim()
        }

        // split the string at the spaces
        // and check if the third entry (file attr.) do not contain a D
        let [ _date, _time, attributes, _sizeUncomp, _sizeComp, filePath, ...rest ] = entry.split(' ')

        // if there are file names with whitespaces, we'll get them in the rest param
        // for sake of the comparison, we can just stitch them togehter with a delimiter
        if (rest?.length > 0) {
            filePath += rest.join('_')
        }

        // only get files not directories
        // filePath.includes('/') || filePath.includes('\\')) -> only get files beyond the first level
        // since the root dir only contains meta data that is not mounted into the games directories
        if (!attributes.includes('D')
            && (filePath.includes('/') || filePath.includes('\\'))
            && (withAutomatFiles || !filePath.startsWith('automat'))
        ) {
            pathList.push(filePath)
        }
    })

    return pathList
}

/**
 * @param {ModArchive[]} archivesToCheck list of archive paths
 * 
 * @returns {Promise<MoData>}
 */
const gatherModDataFromArchives = async (archivesToCheck, withAutomatFiles = false) => {
    const mods      = []
    const modErrors = []

    for (const archive of archivesToCheck) {
        const modName = archive.modName

        try {
            const pathList = _listFilesOfArchive(archive.path, withAutomatFiles)

            /** @type {Mod} */
            const mod = {
                modName,
                files: pathList
            }

            mods.push(mod)
        } catch (error) {
            /** @type {ModError} */
            const modError = {
                modName,
                error
            }

            modErrors.push(modError)
        }
    }

    /** @type {ModData} */
    const result = {
        mods,
        modErrors
    }

    return result
}

const extractFileFromArchive = (archivePath, pathToFileInArchive) => {
    try {
        const result = execute7zip([
            'x',
            archivePath,
            pathToFileInArchive,
            `-o${APP_DATA_PATH}`
        ])

        // TODO: read file content
        console.log('extract result', result)
    } catch (error) {
        console.log('\n7zip error while extracting:', error)
        throw error
    }
}

module.exports = {
    getArchivePathsOfDirectory,
    gatherModDataFromArchives,
    extractFileFromArchive
}