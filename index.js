const { gatherModDataFromArchives, analyseModsContent } = require('./src/analysis.js')
const { getModArchivesOfLocalModDirectory } = require('./src/local.js')
const { PRG_ARGS } = require('./src/lib/args.js')
const { writeResults } = require('./src/result-files.js')
const { installSevenZip, uninstallSevenZip } = require('./src/lib/seven-zip/index.js')
const { getListOfWorkshopArchives } = require('./src/workshop.js')
const { findSteamGameInstall, getGameVersion } = require('./src/lib/steam.js')

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
            customModDir,
            withAutomatFiles,
            showAllConflictingFiles,
            modNamesOnly,
            excludeWorkshop,
            appId
        } = PRG_ARGS

        const {
            name,
            gameDir,
            modDir,
            workshopDir
        } = findSteamGameInstall(appId, customModDir)

        const gameVersion = getGameVersion(appId, gameDir)
        console.info(`Analysing "${name}" - v ${gameVersion}`)
        console.info(`\nMod directory: "${modDir}"`)
        console.info(`Workshop directory: "${workshopDir}"`)

        const modArchives = getModArchivesOfLocalModDirectory(modDir)
        const allArchives = [...modArchives]

        if (!excludeWorkshop) {
            const workshopArchives = getListOfWorkshopArchives(workshopDir, gameVersion)
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