const { gatherArchiveData, analyseArchives, getArchivePathsOfDirectory } = require('./src/archive.js')
const { getArgs } = require('./src/args.js')
const { writeResults } = require('./src/result-files.js')

const main = async () => {
    try {
        const {
            modDir,
            withAutomatFiles,
            showAllConflictingFiles,
            modNamesOnly
        } = getArgs()

        const modArchives = getArchivePathsOfDirectory(modDir)
        const archiveData = await gatherArchiveData(modArchives)
        const results     = await analyseArchives(archiveData)

        writeResults(results, showAllConflictingFiles, modNamesOnly, withAutomatFiles)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

main()