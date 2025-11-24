const fs = require('fs')

/**
 * 
 * @returns {Arguments}
 */
const getArgs = () => {
    const args = process.argv
    // arg[0] - should be the node path
    // arg[1] - the command itself
    // arg[2] - the first passed command
    // if args[2] contains a flag (starting with '-' or '--'),
    // we assume the user wanted to execute smcc inside the mod folder
    // so we clear the modDir
    let modDir = args[2]?.replace(/^-{1,2}.*/g, '')

    // args with shorthands
    const needsHelp               = args.includes('-h') || args.includes('--help')
    const printVersion            = args.includes('-v') || args.includes('--version')
    const withAutomatFiles        = args.includes('-i') || args.includes('--include-automat')
    const showAllConflictingFiles = args.includes('-a') || args.includes('--all-conflicting-files')
    const modNamesOnly            = args.includes('-m') || args.includes('--mod-names-only')
    const excludeWorkshop         = args.includes('-e') || args.includes('--exclude-workshop-mods')
    // special args
    const analyseEts              = !args.includes('--ats')
    const useManualSteamDirArg    = args.find(arg => arg.includes('--steam-dir'))

    if (needsHelp) {
        _printHelp()
        process.exit(0)
    }

    if (printVersion) {
        const { version } = require('../package.json')
        console.log('SMCC Version ' + version)
        process.exit(0)
    }

    if (!modDir?.trim()) {
        const currentDir = process.cwd()
        console.log('Mod directory missing, trying current directory "'+ currentDir + '"')
        modDir = currentDir
    }

    if (!fs.existsSync(modDir) || !fs.lstatSync(modDir).isDirectory()) {
        console.log(`Invalid mod directory "${modDir}" either does not exist or is not a directory`)
        process.exit(1)
    }

    if (showAllConflictingFiles && modNamesOnly) {
        console.log('Can not show all conflicting files and none at the same time, either use "-a" OR "-m"')
        process.exit(1)
    }

    let manualSteamDir = null

    if (!!useManualSteamDirArg) {
        /** @type {string} */
        const dirRegex = /--steam-dir=(?:"([^"]+)"|(\S+))/g
        manualSteamDir = useManualSteamDirArg.match(dirRegex).at(0)?.split('=')?.at(1)
        console.log('Using manual Steam directory "'+ manualSteamDir +'"')
    }

    return {
        modDir,
        withAutomatFiles,
        showAllConflictingFiles,
        modNamesOnly,
        excludeWorkshop,
        analyseEts,
        manualSteamDir
    }
}

const _printHelp = () => {
    console.log(
`
By default, SMCC will ignore any 'automat/' files and print out
up to 3 conflicting files per mod, as well as tell you how many
more files are conflicted. To fine tune your result, you can use
the following cmd line flags.

If the flag '--ats' is absent, the ETS2 workshop content will
be tried to be analyzed.

All flags must come after the the path to the mod folder if provided!
'smcc.exe [path-to-mod-directory] [flags]'

    -h, --help
        Print the cmd line help

    -v, --version
        Prints the SMCC version

    -i, --include-automat
        Includes automat files in the result

    -a, --all-conflicting-files
        IUNCLUDES ALL files that are conflicted in the result

    -m, --mod-names-only
        EXCLUDES ALL files that are conflicted from the result

    -e, --exclude-workshop-mods
        Excludes the workshop files from the analysis

    --ats
        Analyse the workshop contens of ATS instead of ETS2
`)
}

module.exports = {
    getArgs
}
