interface Arguments {
    modDir:                  string
    withAutomatFiles:        boolean
    showAllConflictingFiles: boolean
    modNamesOnly:            boolean
    excludeWorkshop:         boolean
    analyseEts:              boolean
    manualSteamDir:          string | null
}

interface ModArchive {
    modName: string
    path:    string
    error:   any
}

interface Mod {
    modName: string
    files:   string[]
    error:   any
}

interface ModContent {
    pathList: string[]
    errors:   string[]
}

interface AnalysisResult {
    duplicates: Duplicate[]
    errors:     Mod[]
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