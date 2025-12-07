const fs = require('fs')
const { execute7zip } = require('./lib/seven-zip/index')

const _listFilesOfArchive = (pathToArchive: string): string[] => {
    let output = ''

    try {
        output = execute7zip([
            'l',
            '-ba',
            pathToArchive
        ])
    } catch (error) {
        throw error
    }

    // 7zip uses the following file attributes:
    // D.... - directory
    // .R... - read-only
    // ..H.. - hidden
    // ...S. - system (windows system file)
    // ....A - archive (normal file)
    // an entry looks like this:
    // date - time - file attributes - size uncompressed - size compressed - path
    // 2025-06-02 19:16:52 ....A      1398256         3082  vehicle/truck/upgrade/paintjob/scania.t/airbrush/accessories/acc_0.dds
    const pathList: string[] = []

    output.trim().split('\n')
    .forEach(entry => {
        // collapse whitespace to single spaces
        entry = entry.trim().replaceAll(/\s+/g, ' ')

        // check for control/non-printable characters
        // and clean them up
        if (entry.match(/[\x00-\x1F\x7F]/g)) {
            entry = entry.replace(/[\x00-\x1F\x7F]/g, '').replace('undefined', '').replace(/0M Scan/g, '').trim()
        }

        // split the string at the spaces
        // and check if the third entry (file attr.) do not contain a D
        let [ _date, _time, attributes, _sizeUncomp, _sizeComp, filePath, ...rest ] = entry.split(' ')

        // if there are file names with whitespaces, we'll get them in the rest param
        // for sake of the comparison, we can just stitch them togehter with a delimiter
        if (rest?.length > 0) {
            filePath += rest.join('_')
        }

        // only get files not directories
        if (!attributes?.includes('D')) {
            pathList.push(filePath || '')
        }
    })

    return pathList.filter(Boolean)
}

const gatherModDataFromArchives = (archivesToCheck: ModContainer[], withAutomatFiles = false): Mod[] => {
    const mods = []

    for (const archive of archivesToCheck) {
        const mod: Mod = {
            modName:    archive.modName,
            workshopId: archive.workshopId,
            files:      [],
            error:      null
        }

        try {
            if (!archive.path || archive.error) {
                throw new Error('Could not get files of mod: ' + archive.error)
            }

            if (archive.isArchive) {
                mod.files = _listFilesOfArchive(archive.path)
            } else {
                mod.files = fs.readdirSync(archive.path)
            }

            mod.files = mod.files.filter(filePath => {
                // filePath.includes('/') || filePath.includes('\\')) -> only get files beyond the first level
                // since the root dir only contains meta data that is not mounted into the games directories
                const topLevelCheck = filePath.includes('/') || filePath.includes('\\')
                // filter automat files if option is enabled
                const automatCheck = withAutomatFiles || !filePath.startsWith('automat')

                return topLevelCheck && automatCheck
            })
        } catch (error) {
            mod.error = error
        }

        mods.push(mod)
    }

    return mods
}

const analyseModsContent = async (mods: Mod[]): Promise<AnalysisResult> => {
    const duplicates: Duplicate[] = []
    const modsWithErrors: Mod[] = []

    const total = mods.length
    const stepSize = Math.ceil(total / 10)

    mods.forEach((mod, idx) => {
        // progress bar
        if (idx % stepSize === 0) {
            const percent  = Math.min(Math.round((idx / total) * 100), 100)
            const barCount = Math.floor(percent / 10);
            const bar      = "[" + "⛟".repeat(barCount) + " ".repeat(10 - barCount) + "]"

            process.stdout.write(`\r${bar} ${percent}%`)
        }

        if (mod.error) {
            return modsWithErrors.push(mod)
        }

        mod.files.forEach(filePath => {
            // checked if the current file is in other mods
            const fileInOtherMods = mods.find(innerMods => innerMods.files.includes(filePath) && innerMods.modName !== mod.modName)

            // if not, go to the next one
            if (!fileInOtherMods) {
                return
            }

            // if its in other mods, check if its already in the duplicates
            const fileInDuplicates = duplicates.find(dup => dup.filePath === filePath)

            let modName = mod.modName

            if (mod.workshopId) {
                modName += ' [WORKSHOP MOD - ' + mod.workshopId + ']'
            }

            // if not, create the first duplicate entry
            if (!fileInDuplicates) {
                const newEntry: Duplicate = {
                    filePath,
                    mods: []
                }

                newEntry.mods.push(modName || '-')
                duplicates.push(newEntry)
                return
            }

            // else add the mod name to the conflicted mods
            fileInDuplicates.mods.push(modName || '-')
        })
    })

    // "save" progress bar when finished
    process.stdout.write(`\r[▇▇▇▇▇▇▇▇▇▇] 100%\n`)

    return { duplicates, errors: modsWithErrors }
}

module.exports = {
    analyseModsContent,
    gatherModDataFromArchives
}
