# SCS Mod Compatibility Checker - SMCC
This programm is intended for checking if any of the installed mods in an ETS2/ATS mod directory are conflicting themselves in any way. It compares the contents of the local mod folder as well as the workshop contents of either ETS2 or ATS, depending on the settings.

## How To
### Download
To get started, download the latest version from  
https://github.com/lRainZz/scs-mod-comp-checker/releases

If you got the executable anywhere else, consider verifying the authenticity, by checking the file hash of the executable.

### Hash Check
To check the if you have obtained a legitimate version of the tool, generate a sha256 file hash of the executable, either with Powershell integrated tools, or Windows certutil via cmd line:

Powershell:
`Get-FileHash "C:\path\to\smcc.exe" -Algorithm SHA256`

Cmd line:
`certutil -hashfile "C:\path\to\smcc.exe" SHA256`

And compare the resulting hash to the one listed in the GitHub release.

> ONLY EXECUTE SMCC IF THE HASH IS VALID! ELSE YOU ARE RISKING INFECTION OF YOUR PC!

### Execution
To use SMCC either paste it anywhere you like and execute it by double-clicking or call it via the cmd line to supply extra parameters for fine tuning. SMCC will pick up your installation locations and local mod directory automatically!

> By default the ETS2 mods are analyzed, if you want to execute it for ATS, call it via the cmd with the `--ats` argument  
> `$ smcc.exe --ats`

In both cases this will result in a `mod-analysis-result.txt` located where SMCC was started from. This file contains the gathered information in a human readable format.

### -h, --help
```
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
        Analyse a different mod folder than the one under <USERPROFILE>/Documents/<ETS2_or_ATS>/mod
```

## License
This project is licensed under the GPL-3.0 license

# TODO
- switch from sync file ops to async and handle process termination correctly!
- locked mods with scs extractor?
- Tests
- UI
- file search (find specific file with path from error in mods)