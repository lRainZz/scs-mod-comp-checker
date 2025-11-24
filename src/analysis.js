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
    analyseModsContent
}