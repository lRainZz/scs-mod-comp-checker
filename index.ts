import { analyseModsContent, gatherModDataFromArchives } from './src/analysis'
import { PRG_ARGS } from './src/lib/args'
import { installSevenZip, uninstallSevenZip } from './src/lib/seven-zip/index'
import { findSteamGameInstall, getGameVersion } from './src/lib/steam'
import { getModContainersOfLocalModDirectory } from './src/local'
import { writeResults } from './src/result-files'
import { getListOfWorkshopArchives } from './src/workshop'

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

        console.info('\nAnalyzing your mods...')
        console.info('\nWARNING: This can take between seconds and a few minutes, depending on the number of mods and the available hardware.')
        console.info('\nIf you haven\'t started SMCC via the cmd line, this window will close itself, when the analysis has completed!')
        console.info('\nAborting the process or closing the window manually may result in artifacts under\n    "%USERPROFILE%/AppData/Local/smcc"')

        console.info('\n... gathering local mods ...')
        const modContainers = getModContainersOfLocalModDirectory(modDir)
        const allContainers = [...modContainers]

        if (!excludeWorkshop) {
            console.info('\n... gathering workshop mods ...')
            const workshopArchives = await getListOfWorkshopArchives(workshopDir, gameVersion)
            allContainers.push(...workshopArchives)
        }

        console.info('\n... gathering mod data ...')
        const modDataFromArchives = await gatherModDataFromArchives(allContainers, withAutomatFiles)

        console.info('\n... analyzing mod data ...')
        const results = await analyseModsContent(modDataFromArchives)

        console.info('\n... writing results ...')
        writeResults(results, showAllConflictingFiles, modNamesOnly)
    } catch (error) {
        console.error('Unexpected error', error)
        process.exit(1)
    }
}

try {
    setup()
    main()
} catch (error) {
    console.error('RTE', error, JSON.stringify(error, null, 4))
}