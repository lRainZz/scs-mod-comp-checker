const { analyseModsContent } = require('./src/analysis.js')
const { gatherModDataFromArchives, getArchivePathsOfDirectory } = require('./src/archive.js')
const { getArgs } = require('./src/args.js')
const { writeResults } = require('./src/result-files.js')
const { determineWorkshopFolder } = require('./src/workshop.js')

const main = async () => {
    try {
        const {
            modDir,
            withAutomatFiles,
            showAllConflictingFiles,
            modNamesOnly,
            excludeWorkshop,
            analyseEts,
            manualSteamDir
        } = getArgs()

        let allModData = []

        const modArchives = getArchivePathsOfDirectory(modDir)
        const modDataFromArchives = await gatherModDataFromArchives(modArchives)

        allModData.push(...modDataFromArchives)

        if (!excludeWorkshop) {
            const workshopDirectory = determineWorkshopFolder(analyseEts, manualSteamDir)
            // TODO: gather mod data from workshop dir
            // - versions.sii
            // - archives
            // - simple folders
            // add to "allModData"
            console.log('workshopDirectory', workshopDirectory)
        }

        const results = await analyseModsContent(allModData)

        writeResults(results, showAllConflictingFiles, modNamesOnly, withAutomatFiles)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

main()