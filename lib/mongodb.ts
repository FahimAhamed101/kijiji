import mongoose from 'mongoose'

/**
 * Cached Mongoose connection.
 *
 * Next.js hot-reloads modules in dev, which would otherwise open a brand new
 * connection pool on every reload and exhaust the Atlas connection limit.
 * We stash the promise on `globalThis` so it survives HMR.
 *
 * NOTE ON DNS: `mongodb+srv://` URIs need a DNS SRV lookup. Some routers /
 * corporate DNS resolvers refuse SRV queries (you get `querySrv ECONNREFUSED`).
 * When that happens we transparently retry with `MONGODB_URI_FALLBACK`, which
 * is the same cluster written as an explicit seed list.
 */

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK
const MONGODB_DB = process.env.MONGODB_DB || 'ecomkiji'

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not set. Add it to .env.local (see .env.example).'
  )
}

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache =
  global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null })

const MONGO_OPTIONS: mongoose.ConnectOptions = {
  dbName: MONGODB_DB,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15_000,
  socketTimeoutMS: 45_000,
}

/** True when the failure looks like an SRV/DNS resolution problem. */
function isSrvResolutionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /querySrv|_mongodb\._tcp|ENOTFOUND|ECONNREFUSED|ESERVFAIL|ETIMEOUT/i.test(msg)
}

async function connect(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true)

  try {
    return await mongoose.connect(MONGODB_URI as string, MONGO_OPTIONS)
  } catch (err) {
    if (MONGODB_URI_FALLBACK && isSrvResolutionError(err)) {
      console.warn(
        '[mongodb] SRV lookup failed, retrying with MONGODB_URI_FALLBACK seed list.'
      )
      return mongoose.connect(MONGODB_URI_FALLBACK, MONGO_OPTIONS)
    }
    throw err
  }
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = connect()
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Reset so the next request can retry instead of reusing a rejected promise.
    cached.promise = null
    throw err
  }

  return cached.conn
}

export default dbConnect
