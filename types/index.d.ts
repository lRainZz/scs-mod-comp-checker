interface Arguments {
    withAutomatFiles:        boolean
    showAllConflictingFiles: boolean
    modNamesOnly:            boolean
    excludeWorkshop:         boolean
    appId:                   string
    customModDir?:           string
    manualSteamDir?:         string
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

interface PackageVersionBlock {
    universal:          boolean
    packageName:        string
    compatibleVersions: string[]
}

interface SteamLocations {
    name:        string
    gameDir:     string
    modDir?:     string
    workshopDir: string
}

interface SteamLibrary {
    path: string
    apps: string[]
}
