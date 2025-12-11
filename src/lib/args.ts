import fs from 'fs'
import packageJson from '../../package.json'

const ETS_APP_ID = '227300'
const ATS_APP_ID = '270880'

const getArgs = (): Arguments => {
    const args = process.argv

    // args with shorthands
    const needsHelp               = args.includes('-h') || args.includes('--help')
    const printVersion            = args.includes('-v') || args.includes('--version')
    const withAutomatFiles        = args.includes('-i') || args.includes('--include-automat')
    const showAllConflictingFiles = args.includes('-a') || args.includes('--all-conflicting-files')
    const modNamesOnly            = args.includes('-m') || args.includes('--mod-names-only')
    const excludeWorkshop         = args.includes('-e') || args.includes('--exclude-workshop-mods')
    // special args
    const analyseEts              = !args.includes('--ats')
    const useCustomModDirArg      = args.find(arg => arg.includes('--mod-dir'))

    if (needsHelp) {
        _printHelp()
        process.exit(0)
    }

    if (printVersion) {
        const { version } = packageJson
        console.info('\nSMCC Version ' + version)
        process.exit(0)
    }

    // build the default mod dir if no custom one is supplied
    let customModDir

    if (!!useCustomModDirArg) {
        customModDir = useCustomModDirArg.split('=').at(1)

        if (!customModDir || !fs.existsSync(customModDir) || !fs.lstatSync(customModDir).isDirectory()) {
            console.error(`\nInvalid mod directory "${customModDir}", directory either does not exist or is not a directory`)
            process.exit(1)
        }
    }

    if (showAllConflictingFiles && modNamesOnly) {
        console.error('\nCan not show all conflicting files and none at the same time, either use "-a" OR "-m"')
        process.exit(1)
    }

    const appId = analyseEts ? ETS_APP_ID : ATS_APP_ID

    return {
        customModDir,
        withAutomatFiles,
        showAllConflictingFiles,
        modNamesOnly,
        excludeWorkshop,
        appId
    }
}

const _printHelp = () => {
    console.info(
`
SMCC - help

By default, SMCC will ignore any 'automat/' files and print out
up to 3 conflicting files per mod, as well as tell you how many
more files are conflicted. To fine tune your result, you can use
the following cmd line flags.

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

    --mod-dir
        Analyse a different mod folder than the one under <USERPROFILE>/Documents/<ETS2_or_ATS>/mod`)
}

const PRG_ARGS = getArgs()

export {
    ATS_APP_ID, ETS_APP_ID, PRG_ARGS
}

