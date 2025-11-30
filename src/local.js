const fs = require('fs')
const path = require('path')

/**
 * @param {string} directory path
 * 
 * @returns {ModArchive[]} list of valid archives
 */
const getArchivePathsOfLocalModDirectory = (directory) => {
    const paths = fs.readdirSync(directory)
    // ets only supports archives in scs or zip format
    // no need to check for other formats or directories
    .filter(archivePath => archivePath.endsWith('.scs') || archivePath.endsWith('.zip'))
    .map(archivePath => path.resolve(directory, archivePath))

    return paths.map(archivePath => {
        /** @type {ModArchive} */
        const result = {
            modName: path.basename(archivePath),
            path:    archivePath,
            error:   null
        }
        return result
    })
}

module.exports = {
    getArchivePathsOfLocalModDirectory
}