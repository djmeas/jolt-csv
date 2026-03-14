import { join } from 'path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

const dbPath = join(process.cwd(), '.data', 'sqlite.db')
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
