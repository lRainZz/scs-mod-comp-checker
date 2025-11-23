const { gatherArchiveData, analyseArchives, getArchivePathsOfDirectory } = require('./archive.js')
const { getArgs } = require('./args.js')
const { writeResults } = require('./result-files.js')

const main = async () => {
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
}

main()