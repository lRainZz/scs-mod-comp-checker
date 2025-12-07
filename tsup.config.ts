import { copyFileSync, mkdirSync } from 'fs'
import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['index.ts'],
    format: ['cjs'],
    target: 'node16',
    outDir: 'dist',
    clean: true,
    minify: true,
    bundle: true,
    outExtension: () => ({
        js: `.cjs`
    }),
    onSuccess: async () => {
        // we need to make sure the 7za.exe is bundled correctly
        const targetDir = path.join(__dirname, 'dist')
        mkdirSync(targetDir, { recursive: true })

        copyFileSync(
            path.join(__dirname, 'src', 'lib', 'seven-zip', '7za.exe'),
            path.join(targetDir, '7za.exe')
        )

        console.log('✅ 7za.exe copied to dist')
    }
})