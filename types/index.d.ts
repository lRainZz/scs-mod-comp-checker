interface Arguments {
    modDir:                  string
    withAutomatFiles:        boolean
    showAllConflictingFiles: boolean
    modNamesOnly:            boolean
    excludeWorkshop:         boolean
    analyseEts:              boolean
    manualSteamDir:          string | null
}

interface Mod {
    modName: string
    files:   string[]
}

interface ModError {
    modName: string
    errors:  string[]
}

interface ModContent {
    pathList: string[]
    errors:   string[]
}

interface ModData {
    mods:      Mod[]
    modErrors: ModError[]
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