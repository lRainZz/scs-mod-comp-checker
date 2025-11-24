const { analyseModsContent } = require('./src/analysis.js')
const { gatherModDataFromArchives, getArchivePathsOfDirectory } = require('./src/archive.js')
const { getArgs } = require('./src/args.js')
const { writeResults } = require('./src/result-files.js')
const { determineWorkshopFolder, getListOfWorkshopArchives } = require('./src/workshop.js')

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

        const modArchives = getArchivePathsOfDirectory(modDir)
        const allArchives = [...modArchives]

        if (!excludeWorkshop) {
            const workshopDirectory = determineWorkshopFolder(analyseEts, manualSteamDir)
            const workshopArchives = getListOfWorkshopArchives(workshopDirectory)
            allArchives.push(...workshopArchives)
        }

        const modDataFromArchives = await gatherModDataFromArchives(allArchives)
        const results = await analyseModsContent(modDataFromArchives)

        writeResults(results, showAllConflictingFiles, modNamesOnly, withAutomatFiles)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

main()