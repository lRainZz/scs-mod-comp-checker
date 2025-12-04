const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { ETS_APP_ID } = require('./args.js')

/**
 * 
 * @param {string} appId
 * @param {string} [customModDir]
 * 
 * @returns {SteamLocations} path to installation of requested appId
 */
const findSteamGameInstall = (appId, customModDir = undefined) => {
    // the libraryfolders.vdf contains iformation which steam libs exist,
    // where they are located and wihch games they contain
    const libraryVdfPath = path.join(STEAM_ROOT, 'steamapps', 'libraryfolders.vdf')

    const raw = fs.readFileSync(libraryVdfPath, 'utf8')
    const steamLibraries = _parseLibraryFoldersFromVdf(raw)

    // get the library with the game
    const appLibrary = steamLibraries.find(lib => lib.apps.includes(appId))
    if (!appLibrary) {
        throw new Error('Could not determine library of app ' + appId)
    }

    // the acf contains the exact install location for a game inside a library
    const appAcf = path.join(
        appLibrary.path,
        'steamapps',
        `appmanifest_${appId}.acf`
    )

    if (!fs.existsSync(appAcf)) {
        throw new Error(`Could read acf "${appAcf}" in library "${appLibrary.path}"`)
    }

    const acfContent = fs.readFileSync(appAcf, 'utf-8')
    const installDirLine = acfContent.match(/"installdir"\s*"([^"]+)"/)
    const installDirName = installDirLine?.at(1)?.trim()

    if (!installDirName) {
        throw new Error(`Could not determine install folder of "${appId}" in library "${appLibrary.path}"`)
    }

    const fullPathToApp = path.join(
        appLibrary.path,
        'steamapps',
        'common',
        installDirName
    )

    const pathToAppWorkshop = path.join(
        appLibrary.path,
        'steamapps',
        'workshop',
        'content',
        appId
    )

    let fullPathToModDir = customModDir

    if (!customModDir) {
        if (!process.env.USERPROFILE) {
            throw new Error('\nCould not access %USERPROFILE%, please provide a custom mod dir via "--mod-dir=<path/to/your/mod/directory>"')
        }

        fullPathToModDir = path.join(
            process.env.USERPROFILE,
            'Documents',
            appId === ETS_APP_ID ? 'Euro Truck Simulator 2' : 'American Truck Simulator',
            'mod'
        )
    }

    const result = {
        name:        installDirName,
        gameDir:     fullPathToApp,
        modDir:      fullPathToModDir,
        workshopDir: pathToAppWorkshop
    }

    return result
}

/**
 * @param {string }appId
 * @param {string} gameDir
 * 
 * @returns {string} the game version
 */
const getGameVersion = (appId, gameDir) => {
    try {
        const pathToGameExe = path.join(
            gameDir,
            'bin',
            'win_x64',
            appId === ETS_APP_ID ? 'eurotrucks2.exe' : 'amtrucks.exe'
        )

        const version = execSync(
            `powershell -command "(Get-Item '${pathToGameExe}').VersionInfo.FileVersion"`
        )
        // the version string contains a hash section that we do not want, so well cut it off
        // - "1.57.2.4 (a7624b40b34b6135e6ed1cd5b813b17346746798)"
        .toString().trim().split(' ').at(0)

        if (!version) throw 'version-not-detected'

        return version
    } catch (error) {
        console.error('\nCould not determine game version')
        process.exit(1)
    }
}

/**
 * @returns {string}
 */
const _getSteamRoot = () => {
    // try to read the steam install folder from the windows registry
    const output = execSync(
        'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
        { encoding: 'utf-8' }
    )

    const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);
    const directoryPath = match ? match[1].trim().replace(/\\\\/g, "\\") : null

    // TODO move to a higher level
    if (!directoryPath) {
        console.error('\nCould not determine Steam workshop directory, please use "--steam-dir="path/to/your/steam/dir/with/ets/or/ats" to supply it manually')
        console.error('Or exlude the Steam workshop analysis by using "-e, --exclude-workshop-mods"')
        process.exit(1)
    }

    return directoryPath
}

/**
 * 
 * @param {string} vdfContent 
 * 
 * @returns {SteamLibrary[]}
 */
const _parseLibraryFoldersFromVdf = (vdfContent) => {
    const lines = vdfContent
        .replace(/\r/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)

    /** @type {Array<Record<string, any>>} */
    const stack = [{}]

    for (const line of lines) {
        if (line === '}') {
            stack.pop()
            continue
        }

        const keyVal = line.match(/^"([^"]+)"\s+"([^"]+)"$/)
        if (keyVal) {
            const [, key, val] = keyVal
            const target = stack.at(-1)

            if (!target) {
                throw new Error(`VDF parse error: encountered object start "${key}" before any parent object existed`)
            }

            target[key] = val
            continue
        }

        const objStart = line.match(/^"([^"]+)"$/)
        if (objStart) {
            const key = objStart[1]
            const parent = stack.at(-1)

            if (!parent) {
                throw new Error(`VDF parse error: object key "${key}" encountered with no parent object available`)
            }

            parent[key] = {}
            stack.push(parent[key])
        }
    }

    const result = Object.values(stack[0].libraryfolders).map(library => {
        /** @type {SteamLibrary} */
        const steamLib = {
            path: library.path,
            apps: Object.keys(library.apps)
        }

        return steamLib
    })

    return result
}

const STEAM_ROOT = _getSteamRoot()

findSteamGameInstall('227300')

module.exports = {
    STEAM_ROOT,
    findSteamGameInstall,
    getGameVersion
}
