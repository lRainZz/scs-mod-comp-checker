const { execSync } = require('child_process')
const { GAME_FOLDER, GAME_EXE } = require('./lib/game-installation.js')
const { getSteamInstallationFolder } = require('./steam-dir.js')
const path = require('path')

/**
 *
 * @param {string} manualPath 
 * 
 * @returns {string} the game version
 */
const getGameVersion = (manualPath = '') => {
    /** @type {string | null} */
    let GAME_EXEPath = manualPath

    if (!manualPath) {
        GAME_EXEPath = getSteamInstallationFolder()
    }

    GAME_EXEPath = path.join(
        GAME_EXEPath,
        'common',
        GAME_FOLDER,
        'bin',
        'win_x64',
        GAME_EXE
    )

    try {
        const version = execSync(
            `powershell -command "(Get-Item '${GAME_EXEPath}').VersionInfo.FileVersion"`
        )
        // the version string contains a hash section that we do not want, so well cut it off
        // - "1.57.2.4 (a7624b40b34b6135e6ed1cd5b813b17346746798)"
        .toString().trim().split(' ').at(0)

        if (!version) throw 'version-not-detected'

        return version
    } catch (error) {
        console.log('\nCould not determine game version')
        process.exit(1)
    }
}

module.exports = {
    getGameVersion
}