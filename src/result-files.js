const fs = require('fs')
const path = require('path')

/**
 * @param {AnalysisResult} result
 */
const writeResults = (result, showAllConflictingFiles = false, modNamesOnly = false) => {
    const errorString = result.errors.length > 0
        ? 'Could not open/analyze the following mod archives:\n  - "' + result.errors.map(mod => mod.modName).join('"\n  - "') + '"'
        : ''

    if (result.duplicates.length === 0) {
        if (errorString) console.error(errorString)
        console.error('\nNo duplicates found')
        process.exit(0)
    }
    const transformedResult = _buildResultPrintStructure(result.duplicates)

    // result structure:
    //
    // "modName"
    // │
    // └─ conflicts : "mod"
    //    │
    //    └─ because of: file
    //
    // box building chars: └ ├ │ ─

    let outputContent = errorString + '\n\n'

    transformedResult.forEach(resultStruc => {
        outputContent += `"${resultStruc.mod}"\n`

        resultStruc.conflicts.forEach((conflict, conflictIdx) => {
            const isLastConflict = conflictIdx === resultStruc.conflicts.length -1

            const conflictCurve = isLastConflict
                ? '└'
                : '├'

            const conflictExtensionEnd = isLastConflict
                ? '   │'
                : '│  │'

            outputContent += `│\n${conflictCurve}─ conflicts with: "${conflict.modName}"\n${conflictExtensionEnd}`
            if (modNamesOnly) return // abort if only the mod names are wanted

            // make a copy as to not alter the original files sectio n
            // which is needed in aother iterations
            // -> simple spread works for stringlists
            const filesToDisplay = [...conflict.files]

            // show only 3 entries
            if (!showAllConflictingFiles) filesToDisplay.splice(3, filesToDisplay.length -1)
            const appendSizeHint = !showAllConflictingFiles && (conflict.files.length > 3)

            if (appendSizeHint) {
                filesToDisplay.push(`${conflict.files.length - 3} more ...`)
            }

            filesToDisplay.forEach((file, fileIdx) => {
                const isLastFile = fileIdx === filesToDisplay.length -1

                const fileCurve = isLastFile// && !appendSizeHint
                    ? '└'
                    : '├'

                    const conflictStraight = isLastConflict// && !appendSizeHint
                    ? ' '
                    : '│'

                const keyWord = appendSizeHint && isLastFile
                    ? 'and'
                    : 'because of:'

                outputContent += `\n${conflictStraight}  ${fileCurve}─ ${keyWord} ${file}`
            })

            outputContent += '\n'
        })

        outputContent += '\n'
    })

    if (modNamesOnly || !showAllConflictingFiles) {
        outputContent += '\nTo see all files that are causing conflicts, use the "-a, --all-conflicting-files" flag'
    }

    if (!modNamesOnly) {
        outputContent += '\nTo only see conflicting mods without the files, use the "-m, --mod-names-only" flag'
    }

    outputContent += _getFinePrint()

    const resultFilePath = path.resolve(process.cwd(), 'mod-analysis-result.txt')
    fs.writeFileSync(resultFilePath, outputContent)
    console.info('\nSuccessfully written result to "' + resultFilePath + '"')
}

/**
 * @param {Duplicate[]} resultDuplicates
 * 
 * @returns {ResultStructure[]}
 */
const _buildResultPrintStructure = (resultDuplicates) => {
    /** @type {ResultStructure[]} */
    const resultPrintStructure = []

    /** @type {string[]} */
    const conflictedMods = resultDuplicates.reduce((out, currentValue) => {
        out.push(...currentValue.mods)
        return out
    }, /** @type {string[]} */ ([]))
    .filter((value, index, array) => array.indexOf(value) === index)

    conflictedMods.forEach(modName => {
        /** @type {ResultStructure} */
        const resultStruc = {
            mod: modName,
            conflicts: _buildConflictsForMod(modName, resultDuplicates)
        }

        resultPrintStructure.push(resultStruc)
    })

    return resultPrintStructure
}

/**
 * 
 * @param {string} modName 
 * @param {Duplicate[]} resultDuplicates 
 * 
 * @returns {Conflict[]}
 */
const _buildConflictsForMod = (modName, resultDuplicates) => {
    // find all files that are affected and part of the mod
    // create a copy of the original so we can alter
    // the mods sesction freely without disturbing
    // following iteration
    /** @type {Duplicate[]} */
    const conflicts = JSON.parse(JSON.stringify(resultDuplicates.filter(dup => dup.mods.includes(modName))))
    // filter the current modName from the conflicted mods
    conflicts.forEach(dup => dup.mods.splice(dup.mods.indexOf(modName), 1))

    // tranform this:
    //
    // conflicts = [
    //     { filePath: 'file1', mods: ['mod1', 'mod2'] },
    //     { filePath: 'file2', mods: ['mod2'] }
    // ]
    //
    //
    // into this:
    //
    // conflicts =[
    //     { modName: 'mod1', files: ['file1'] },
    //     { modName: 'mod2', files: ['file1', 'file2'] }
    // ]
    /**
     * @type {Record<string, string[]>}
     */
    const result = {}

    conflicts.forEach(({ filePath, mods }) => {
        mods.forEach(/** @type { string} */ mod => {
            if (!result[mod]) {
                result[mod] = []
            }
            result[mod].push(filePath)
        })
    })

    return Object.entries(result).map(([ modName, files ]) => {
        /** @type {Conflict} */
        const conflict = {
            modName,
            files
        }

        return conflict
    })
}

const _getFinePrint = () => {
    let result = '\n\nThis analysis was brought to you by lRainZz - https://steamcommunity.com/id/rainzzonsteam/'
    result += '\nIf you found this helpful, consider buying me Coffee - https://ko-fi.com/lrainzz'
    result += '\n\nIf you have questions, issues or ideas, consider contributing via GitHub - https://github.com/lRainZz/scs-mod-comp-checker'

    return result
}

module.exports = {
    writeResults
}