import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Statement = { bind: (...values: unknown[]) => Statement; first: <T>() => Promise<T | null>; run: () => Promise<D1Result>; all: <T>() => Promise<D1Result<T>> }

export function makeD1(): D1Database {
  const database = new DatabaseSync(':memory:')
  for (const migration of ['0001_remote_access_installations.sql', '0002_activation_cooldown.sql']) {
    database.exec(readFileSync(resolve(import.meta.dirname, '../migrations', migration), 'utf8'))
  }
  return {
    prepare(sql: string): Statement {
      let values: unknown[] = []
      const statement = database.prepare(sql)
      const bound: Statement = {
        bind: (...next) => { values = next; return bound },
        first: async <T>() => (statement.get(...values) as T | undefined) ?? null,
        run: async () => ({ success: true, meta: { changes: Number(statement.run(...values).changes) } } as D1Result),
        all: async <T>() => ({ success: true, results: statement.all(...values) as T[] } as D1Result<T>),
      }
      return bound
    },
    batch: async () => [],
    exec: async query => { database.exec(query); return { count: 0, duration: 0 } },
    dump: async () => new ArrayBuffer(0),
    withSession: () => { throw new Error('Not implemented in test D1 adapter') },
  } as D1Database
}
