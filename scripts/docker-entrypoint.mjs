import { spawnSync, spawn } from 'child_process'

// Run migrations so the SQLite DB is ready (idempotent)
spawnSync('npm', ['run', 'db:migrate'], { stdio: 'inherit', cwd: process.cwd() })

// Start the app (CMD is passed as args: node .output/server/index.mjs)
const [cmd, ...args] = process.argv.slice(2)
const child = spawn(cmd ?? 'node', args.length ? args : ['.output/server/index.mjs'], {
  stdio: 'inherit',
  cwd: process.cwd()
})
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 128 : 0)))
