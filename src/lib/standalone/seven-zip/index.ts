import fs from 'fs'
import { spawn } from 'node:child_process'
import path from 'path'
import TEMP_DATA_DIR from '../temp-dir'

const SEVEN_ZIP_EXTERNAL_PATH = path.join(TEMP_DATA_DIR, '7za.exe')

// extract 7za but do not overwrite it if it exists to comply with the 7za lesser GPL!
const installSevenZip = () => {
    try {
        fs.copyFileSync(path.join(__dirname, '7za.exe'), SEVEN_ZIP_EXTERNAL_PATH, fs.constants.COPYFILE_EXCL)
    } catch (error) {
        if (error instanceof Error && 'code' in Error) {
            if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
                // silent exception -> 7za.exe already exists and we're using that
                return null
            }
        }

        // else we rethrow the error as it was unexpected
        throw error
    }
}

const uninstallSevenZip = () => fs.rmSync(SEVEN_ZIP_EXTERNAL_PATH)

const execute7zip = (commandList: string[]): Promise<string> => new Promise((res, rej) => {
    // using spawn isntead of execFile or execFileSync
    // to avoid any buffered output and therefor possible overflow (ENOBUFS)
    const childProcess = spawn(
        SEVEN_ZIP_EXTERNAL_PATH,
        commandList,
        {
            stdio: [
                // ignore stdin
                'ignore',
                // pipe the output of stdio and stderr back to app
                // instead of printing to the console
                'pipe',
                'pipe'
            ]
        }
    )

    // kill the child process if the parent is killed
    // ctrl+c really aborts the app an not just the "wrapper"
    const handleSigInt = () => childProcess.kill('SIGINT')
    process.on('SIGINT', handleSigInt)

    // ensure correc text encoding
    childProcess.stdout.setEncoding('utf-8')
    childProcess.stderr.setEncoding('utf-8')

    // read the output from the streams into string buffers
    let stdoutBuffer = ''
    let stderrBuffer = ''

    childProcess.stdout.on('data', (chunk: string) => stdoutBuffer += chunk)
    childProcess.stderr.on('data', (chunk: string) => stderrBuffer += chunk)

    // handle child process errors
    // - remove listener on process to avoid adding too many
    // - immediatly reject the promise if the spawn fails
    childProcess.on('error', (err: string) => {
        process.removeListener('SIGINT', handleSigInt)
        rej(err)
    })

    // handle the acutal result of the executed commands
    // - remove listener on process to avoid adding too many
    // - check the exit code and resolve or reject accordingly
    childProcess.on('exit', (code: number) => {
        process.removeListener('SIGINT', handleSigInt)

        if (code !== 0) {
            return rej(new Error(`7za excited with code ${code}: ${stderrBuffer}`))
        }

        res(stdoutBuffer)
    })
})

export {
    execute7zip,
    installSevenZip,
    uninstallSevenZip
}
