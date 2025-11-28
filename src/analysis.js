const { execute7zip } = require('./seven-zip/index.js')

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
const gatherModDataFromArchives = (archivesToCheck, withAutomatFiles = false) => {
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

/**
 * @param {ModData} modsData
 * 
 * @returns {Promise<AnalysisResult>}
 */
const analyseModsContent = async (modsData) => {
    const duplicates = []
    const errors = []

    modsData.mods.forEach(mod => {
        mod.files.forEach(filePath => {
            // checked if the current file is in other mods
            const fileInOtherMods = modsData.mods.find(innerMods => innerMods.files.includes(filePath) && innerMods.modName !== mod.modName)

            // if not, go to the next one
            if (!fileInOtherMods) {
                return
            }

            // if its in other mods, check if its already in the duplicates
            const fileInDuplicates = duplicates.find(dup => dup.filePath === filePath)

            // if not, create the first duplicate entry
            if (!fileInDuplicates) {
                const newEntry = {
                    filePath,
                    mods: []
                }

                newEntry.mods.push(mod.modName)
                duplicates.push(newEntry)
                return
            }

            // else add the mod name to the conflicted mods
            fileInDuplicates.mods.push(mod.modName)
        })
    })

    modsData.modErrors.forEach(mod => errors.push(mod.modName))

    return { duplicates, errors }
}

module.exports = {
    analyseModsContent,
    gatherModDataFromArchives
}