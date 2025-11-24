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
            excludeWorkshop
        } = getArgs()

        const modArchives = getArchivePathsOfDirectory(modDir)
        const modDataFromArchives = await gatherModDataFromArchives(modArchives)

        if (!excludeWorkshop) {
            const steamDir = determineWorkshopFolder()
            console.log('steamDir', steamDir)
        }

        const results = await analyseModsContent(modDataFromArchives)

        writeResults(results, showAllConflictingFiles, modNamesOnly, withAutomatFiles)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

main()