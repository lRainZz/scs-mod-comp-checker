const { execSync } = require('child_process')

const getSteamInstallationFolder = () => {
    // try to read the steam install folder from the windows registry
    const output = execSync(
        'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
        { encoding: 'utf-8' }
    )

    const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);
    const directoryPath = match ? match[1].trim().replace(/\\\\/g, "\\") : null

    if (!directoryPath) {
        console.log('\nCould not determine Steam workshop directory, please use "--steam-dir="path/to/your/steam/dir/with/ets/or/ats" to supply it manually')
        console.log('Or exlude the Steam workshop analysis by using "-e, --exclude-workshop-mods"')
        process.exit(1)
    }

    return directoryPath
}

module.exports = {
    getSteamInstallationFolder
}