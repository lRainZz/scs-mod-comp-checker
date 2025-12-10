import fs from 'fs'
import path from 'path'
import { execute7zip } from './lib/seven-zip/index'
import TEMP_DATA_DIR from './lib/temp-dir'

const getListOfWorkshopArchives = async (workshopDirectory: string, gameVersion: string): Promise<ModContainer[]> => {
    const modDirectories: string[] = fs.readdirSync(workshopDirectory)
    .map((modPath: string) => path.join(workshopDirectory, modPath))
    .filter((modPath: string) => fs.lstatSync(modPath).isDirectory())

    const result: ModContainer[] = []

    for (const dir of modDirectories) {
        const modDataOfDir = await _extractModData(dir, gameVersion)
        result.push(modDataOfDir)
    }

    return result
}

const _extractModData = async (workshopModDirectory: string, gameVersion: string): Promise<ModContainer> => {
    const directoryFiles = fs.readdirSync(workshopModDirectory)

    // workshop mods can either be archvies OR just straight up folders
    // if there is only one container (folder or archive) besides
    // the versions.sii, then we can safely use that
    const containersInModDir = directoryFiles
    .filter((filePath: string) => !filePath.includes('versions.sii'))

    let pathToContainerToUse: string | undefined
    let modName: string | undefined
    let modError: any = null
    let modIsArchive = true

    try {
        if (containersInModDir.length === 1) {
            // if there is only one container present in the directory
            // wen can safely assume, that this is the actual mod
            pathToContainerToUse = path.join(workshopModDirectory, containersInModDir[0]!)
        } else {
            // else we need to analyse the versions.sii to get the correct archive
            pathToContainerToUse = _getArchiveToAnalyzeFromVersionsSii(workshopModDirectory, gameVersion)
        }

        if (!pathToContainerToUse) throw new Error('Could not determine archive name of workshop mod')

        modIsArchive = pathToContainerToUse?.endsWith('.scs') || pathToContainerToUse?.endsWith('.zip')

        modName = await _getModNameFromManifest(pathToContainerToUse, modIsArchive)
    } catch (error) {
        modError = error

        if (error instanceof Error) {
            modError = error?.message
        }
    }

    const result: ModContainer = {
        path:       pathToContainerToUse,
        modName:    modName,
        workshopId: path.basename(workshopModDirectory),
        isArchive:  modIsArchive,
        error:      modError
    }

    return result
}

const _getModNameFromManifest = async (modPath: string, isArchive: boolean = true): Promise<string> => {
    const MANIFEST_FILE = 'manifest.sii'

    let manifestToAnalyze

    // if the mod is an archive, we need to extract the manifest.sii first
    if (isArchive) {
        await execute7zip([
            'x',
            modPath,
            // mod name is defined in the root dir file manifest.sii
            MANIFEST_FILE,
            `-o${TEMP_DATA_DIR}`,
            // force overwrite of previous extracted file
            '-y'
        ])

        manifestToAnalyze = path.join(TEMP_DATA_DIR, MANIFEST_FILE)
    } else {
        manifestToAnalyze = path.join(modPath, MANIFEST_FILE)
    }

    const manifestContent = fs.readFileSync(manifestToAnalyze, { encoding: 'utf-8' })

    const displayNameLine = manifestContent.split('\n').find((line: string) => line.includes('display_name:'))
    const displayNameRegex = /display_name:\s*"([^"]+)"/
    const displayNameMatch = displayNameLine?.match(displayNameRegex)

    const name = displayNameMatch?.at(1)

    // there are mods that do not have a display_name in the manifest
    // for now, this is all we can do
    // -> but we return anyway insteaf of throwing an error,
    // because the mod may still be anaylzed successfully
    return name || 'NO_DISPLAY_NAME'
}

/**
 * this function is NOT utilizing a real sii parser
 * the determination of the correct version is done by simple
 * string comparisons and simple keyword analysis
*/
const _getArchiveToAnalyzeFromVersionsSii = (modPath: string, gameVersion: string): string => {
    const VERSIONS_FILE = 'versions.sii'

    const versionsFileContent = fs.readFileSync(path.join(modPath, VERSIONS_FILE), { encoding: 'utf-8' })
    const packageVersionBlocks = _parseVersionSii(versionsFileContent)

    const correctVersionBlock = packageVersionBlocks.find(versionBlock =>
        // try to find the block that contains a compatible version
        // for the current game version
        versionBlock.compatibleVersions.find(version => {
            // the versions from the compatibleVersions look like this:
            // "1.34.*" - "1.33.*" - "1.32.*"
            // if we cut away the star at the end, we can simply check if
            // the string is part of the current game version (alternatively we could
            // build the following regex to check against: "1\.34\..*")
            const versionToCheck = version?.slice(0, -1)
            if (!versionToCheck) return false
            return gameVersion.includes(versionToCheck)
        })
    )

    let archiveName

    if (correctVersionBlock) {
        archiveName = correctVersionBlock.packageName
    } else {
        // try to get the universal version block
        archiveName = packageVersionBlocks.find(versionBlock => versionBlock.universal === true)?.packageName
    }

    if (!archiveName) {
        throw new Error(`\nCould not determine archive of "${modPath}" to use for the current game version (also no universal archive)`)
    }

    const container = fs.readdirSync(modPath).find((path: string) => path.includes(archiveName))

    if (!container) {
        throw new Error(`\nCould not find container (archive or folder) in "${modPath}`)
    }

    return path.join(modPath, container)
}

const _parseVersionSii = (versionSiiContent: string): PackageVersionBlock[] => {
    const PACKAGE_VERSION_BLOCK_REGEX = /package_version_info\s*:\s*([^\s]+)\s*\{([\s\S]*?)\}/g

    const packageVersionBlocks: PackageVersionBlock[] = []

    let match

    // get all package_version_info blocks
    while ((match = PACKAGE_VERSION_BLOCK_REGEX.exec(versionSiiContent)) !== null) {
        const body = match[2] ?? ''

        const nameMatch   = body.match(/package_name:\s*"([^"]+)"/)
        const packageName = nameMatch && nameMatch[1] ? nameMatch[1] : 'THIS_CAN_NOT_HAPPEN_PROVE_ME_WRONG'

        const compatibleVersions = [...body.matchAll(/compatible_versions\[\]:\s*"([^"]+)"/g)].map(match => match[1] ?? '')

        const pacakgeVersionBlock: PackageVersionBlock = {
            packageName,
            compatibleVersions,
            universal: compatibleVersions.length === 0
        }

        packageVersionBlocks.push(pacakgeVersionBlock)
    }

    return packageVersionBlocks
}

export {
    getListOfWorkshopArchives
}
