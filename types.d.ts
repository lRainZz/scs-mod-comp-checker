interface Arguments {
    modDir:                  string
    withAutomatFiles:        boolean
    showAllConflictingFiles: boolean
    modNamesOnly:            boolean
}

interface Archive {
    archiveName: string
    files:       string[]
}

interface ArchiveError {
    archiveName: string
    errors:      string[]
}

interface ArchiveContent {
    pathList: string[]
    errors:   string[]
}

interface ArchivesData {
    archives:      Archive[]
    archiveErrors: ArchiveError[]
}

interface AnalysisResult {
    duplicates: Duplicate[]
    errors:     string[]
}

interface Duplicate {
    filePath: string
    mods:     string[]
}

interface ResultStructure {
    mod:       string
    conflicts: Conflict[]
}

interface Conflict {
    modName: string
    files:   string[]
}