const { gatherModDataFromArchives, analyseModsContent } = require('./src/analysis.js')
const { getArchivePathsOfLocalModDirectory } = require('./src/local.js')
const { getArgs } = require('./src/args.js')
const { writeResults } = require('./src/result-files.js')
const { installSevenZip, uninstallSevenZip, readFilePathsFromArchive } = require('./src/seven-zip/index.js')
const { determineWorkshopFolder, getListOfWorkshopArchives } = require('./src/workshop.js')

const setup = () => installSevenZip()
const cleanup = () => uninstallSevenZip()

// register cleanup for any kind of shutdown
process.on('exit', cleanup)
process.on('SIGINT', () => { 
    cleanup()
    process.exit()
})
process.on('SIGTERM', () => {
    cleanup()
    process.exit()
})

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

        const modArchives = getArchivePathsOfLocalModDirectory(modDir)
        const allArchives = [...modArchives]

        if (!excludeWorkshop) {
            const workshopDirectory = determineWorkshopFolder(analyseEts, manualSteamDir)
            const workshopArchives = getListOfWorkshopArchives(workshopDirectory)
            allArchives.push(...workshopArchives)
        }

        const modDataFromArchives = await gatherModDataFromArchives(allArchives, withAutomatFiles)
        const results = await analyseModsContent(modDataFromArchives)

        writeResults(results, showAllConflictingFiles, modNamesOnly)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

setup()
main()