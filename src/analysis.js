const { execute7zip } = require('./lib/seven-zip/index.js')

/**
 * @param {string} pathToArchive
 * 
 * @returns {string[]} list of files in archive
 */
const _listFilesOfArchive = (pathToArchive, withAutomatFiles = false) => {
    let output = ''

    try {
        output = execute7zip([
            'l',
            '-ba',
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
    /** @type {string[]} */
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
 * @returns {Mod[]}
 */
const gatherModDataFromArchives = (archivesToCheck, withAutomatFiles = false) => {
    const mods = []

    for (const archive of archivesToCheck) {
        /** @type {Mod} */
        const mod = {
            modName: archive.modName,
            files:   [],
            error:   null
        }

        try {
            mod.files = _listFilesOfArchive(archive.path, withAutomatFiles)
        } catch (error) {
            mod.error = error
        }

        mods.push(mod)
    }

    return mods
}

/**
 * @param {Mod[]} mods
 * 
 * @returns {Promise<AnalysisResult>}
 */
const analyseModsContent = async (mods) => {
    /** @type {Duplicate[]} */
    const duplicates = []
    /** @type {Mod[]} */
    const modsWithErrors = []

    mods.forEach(mod => {
        if (mod.error) {
            return modsWithErrors.push(mod)
        }

        mod.files.forEach(filePath => {
            // checked if the current file is in other mods
            const fileInOtherMods = mods.find(innerMods => innerMods.files.includes(filePath) && innerMods.modName !== mod.modName)

            // if not, go to the next one
            if (!fileInOtherMods) {
                return
            }

            // if its in other mods, check if its already in the duplicates
            const fileInDuplicates = duplicates.find(dup => dup.filePath === filePath)

            // if not, create the first duplicate entry
            if (!fileInDuplicates) {
                /** @type {Duplicate} */
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

    return { duplicates, errors: modsWithErrors }
}

module.exports = {
    analyseModsContent,
    gatherModDataFromArchives
}