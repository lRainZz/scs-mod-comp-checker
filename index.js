const { gatherModDataFromArchives, analyseModsContent } = require('./src/analysis.js')
const { getArchivePathsOfLocalModDirectory } = require('./src/local.js')
const { PRG_ARGS } = require('./src/lib/args.js')
const { writeResults } = require('./src/result-files.js')
const { installSevenZip, uninstallSevenZip } = require('./src/lib/seven-zip/index.js')
const { determineWorkshopFolder, getListOfWorkshopArchives } = require('./src/workshop.js')
const { getGameVersion } = require('./src/game-version.js')
const { GAME_FOLDER } = require('./src/lib/game-installation.js')

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
            manualSteamDir
        } = PRG_ARGS

        const gameVersion = getGameVersion(manualSteamDir)
        console.log('Analysing', GAME_FOLDER, '- v' + gameVersion)

        const modArchives = getArchivePathsOfLocalModDirectory(modDir)
        const allArchives = [...modArchives]

        if (!excludeWorkshop) {
            const workshopDirectory = determineWorkshopFolder(manualSteamDir)
            const workshopArchives = getListOfWorkshopArchives(workshopDirectory, gameVersion)
            allArchives.push(...workshopArchives)
        }

        const modDataFromArchives = gatherModDataFromArchives(allArchives, withAutomatFiles)
        const results = await analyseModsContent(modDataFromArchives)

        writeResults(results, showAllConflictingFiles, modNamesOnly)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

setup()
main()