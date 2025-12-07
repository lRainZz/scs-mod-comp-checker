interface Arguments {
    withAutomatFiles:        boolean
    showAllConflictingFiles: boolean
    modNamesOnly:            boolean
    excludeWorkshop:         boolean
    appId:                   string
    customModDir?:           string
    manualSteamDir?:         string
}

interface ModContainer {
    modName?:    string
    path?:       string
    workshopId?: string
    isArchive?:  boolean
    error:       any
}

interface Mod {
    modName?:    string
    workshopId?: string
    files:       string[]
    error:       any
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

interface VdfObject {
    [key: string]: string | VdfObject
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

interface WorkshopMod {
    path:      string
    isArchive: boolean
}
