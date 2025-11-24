const SevenZip = require('7z-wasm')
const fs = require('fs')
const path = require('path')

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
 * @returns {Promise<ModContent>} list of files in archive
 */
const _listFilesOfArchive = async (pathToArchive, withAutomatFiles = false) => {
    let output = ''
    const errors = []

    const sevenZip = await SevenZip({
        print: text => output += text + '\n',
        printErr: err => errors.push(err),
    })

    // get the arhive data and name
    const archiveData = fs.readFileSync(pathToArchive)
    const archiveName = path.basename(pathToArchive)

    // load the archive into the wasm file system
    const archiveStream = sevenZip.FS.open(archiveName, "w+")
    sevenZip.FS.write(archiveStream, archiveData, 0, archiveData.length)
    sevenZip.FS.close(archiveStream)

    // actual unpacking of the archive in the wasm fs
    // l: list archive contents
    // -ba: bare output, no headers, no sumamry
    sevenZip.callMain(["l", "-ba", archiveName])

    // const output = sevenZip.stdout.trim()

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
        // filePath.includes('/') -> only get files beyond the first level
        // since the root dir only contains meta data that is not mounted
        // into the games directories
        if (attributes
            && !attributes.includes('D')
            && filePath.includes('/')
            && (withAutomatFiles || !filePath.startsWith('automat/'))
        ) {
            pathList.push(filePath)
        }
    })

    /** @type {ModContent} */
    const result = {
        pathList,
        errors
    }

    return result
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
        const { pathList, errors } = await _listFilesOfArchive(archive.path, withAutomatFiles)

        if (errors.length > 0) {
            /** @type {ModError} */
            const modError = {
                modName,
                errors
            }

            modErrors.push(modError)
        }

        /** @type {Mod} */
        const mod = {
            modName,
            files: pathList
        }

        mods.push(mod)
    }

    /** @type {ModData} */
    const result = {
        mods,
        modErrors
    }

    return result
}

module.exports = {
    getArchivePathsOfDirectory,
    gatherModDataFromArchives
}