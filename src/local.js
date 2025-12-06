const fs = require('fs')
const path = require('path')

/**
 * @param {string} directory path
 * 
 * @returns {ModContainer[]} list of valid archives
 */
const getModContainersOfLocalModDirectory = (directory) => {
    const paths = fs.readdirSync(directory)
    // ets only supports archives in scs or zip format
    // no need to check for other formats or directories
    .filter(archivePath => archivePath.endsWith('.scs') || archivePath.endsWith('.zip'))
    .map(archivePath => path.resolve(directory, archivePath))

    return paths.map(archivePath => {
        /** @type {ModContainer} */
        const result = {
            modName:   path.basename(archivePath),
            path:      archivePath,
            isArchive: true,
            error:     null
        }
        return result
    })
}

module.exports = {
    getModContainersOfLocalModDirectory
}