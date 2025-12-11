import fs from 'fs'
import path from 'path'

const getModContainersOfLocalModDirectory = (directory: string): ModContainer[] => {
    const paths = fs.readdirSync(directory)
    // ets only supports archives in scs or zip format
    // no need to check for other formats or directories
    .filter((archivePath: string) => archivePath.endsWith('.scs') || archivePath.endsWith('.zip'))
    .map((archivePath: string) => path.resolve(directory, archivePath))

    return paths.map((archivePath: string) => {
        const result: ModContainer = {
            modName:   path.basename(archivePath),
            path:      archivePath,
            isArchive: true,
            error:     null
        }
        return result
    })
}

export {
    getModContainersOfLocalModDirectory
}
