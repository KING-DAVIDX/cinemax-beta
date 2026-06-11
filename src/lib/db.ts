import { MongoDBClient } from '@shellhaki/sparkdb-sdk'
import mongoose, { Schema, type Model } from 'mongoose'

/**
 * Database access with a Mongoose fallback.
 *
 * SparkDB stays the primary store. When a SparkDB call fails because the
 * service is unreachable or erroring, the same operation is retried against
 * MongoDB through Mongoose. The SparkDB creator confirmed the same database
 * URL and collections exist on MongoDB, so the data stays consistent.
 */

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured.`)
  }
  return value
}

function getMongoUri() {
  return (
    process.env.MONGO_URL
    || process.env.MONGODB_URI
    || process.env.MONGODB_URL
    || getEnv('SPARK_DATABASE_URL')
  )
}

/**
 * True when a SparkDB error is an infrastructure/availability problem worth
 * falling back for (rather than a normal empty result).
 */
export function isSparkDbError(error: unknown) {
  if (!(error instanceof Error)) return true

  return (
    error.name === 'SparkError'
    || error.message === 'fetch failed'
    || error.message.startsWith('SparkDB ')
    || error.message.startsWith('SPARK_')
    || /timeout|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|network|unavailable|503|502|500/i.test(error.message)
  )
}

// ---- Mongoose connection (cached across hot reloads / serverless invocations) ----

type MongoCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as unknown as { _cinemaxMongoose?: MongoCache }
const mongoCache: MongoCache = globalForMongoose._cinemaxMongoose || { conn: null, promise: null }
globalForMongoose._cinemaxMongoose = mongoCache

async function getMongoose() {
  if (mongoCache.conn) return mongoCache.conn

  if (!mongoCache.promise) {
    const uri = getMongoUri()
    mongoCache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    })
  }

  try {
    mongoCache.conn = await mongoCache.promise
  } catch (error) {
    mongoCache.promise = null
    throw error
  }

  return mongoCache.conn
}

// A loose, schema-less model per collection so any document shape is accepted.
const looseSchema = new Schema({}, { strict: false, versionKey: false })
const modelCache = new Map<string, Model<Record<string, unknown>>>()

async function getModel(collection: string) {
  await getMongoose()

  const cached = modelCache.get(collection)
  if (cached) return cached

  const model =
    (mongoose.models[collection] as Model<Record<string, unknown>>)
    || mongoose.model<Record<string, unknown>>(collection, looseSchema, collection)

  modelCache.set(collection, model)
  return model
}

function stripMongoMeta<T>(doc: Record<string, unknown>): T {
  const { _id, __v, ...rest } = doc
  void _id
  void __v
  return rest as T
}

// ---- Chainable client that mirrors the SparkDB SDK surface used by the app ----

class FallbackTable<T extends object> {
  constructor(
    private readonly spark: MongoDBClient,
    private readonly table: string,
    private readonly filters: Partial<T> = {},
    private readonly rowLimit?: number
  ) {}

  where(filters: Partial<T>) {
    return new FallbackTable<T>(this.spark, this.table, { ...this.filters, ...filters }, this.rowLimit)
  }

  limit(limit: number) {
    return new FallbackTable<T>(this.spark, this.table, this.filters, limit)
  }

  async select(): Promise<T[]> {
    try {
      return await this.spark
        .collection<T>(this.table)
        .find(this.filters as Record<string, unknown>, { limit: this.rowLimit })
    } catch (error) {
      if (!isSparkDbError(error)) throw error
      console.error('[db] SparkDB select failed, falling back to MongoDB:', error)

      const model = await getModel(this.table)
      let query = model.find(this.filters as Record<string, unknown>).lean()
      if (typeof this.rowLimit === 'number') query = query.limit(this.rowLimit)
      const rows = (await query) as Record<string, unknown>[]
      return rows.map((row) => stripMongoMeta<T>(row))
    }
  }

  async insert(values: Partial<T>) {
    try {
      return await this.spark
        .collection<T>(this.table)
        .insertOne(values as Partial<T> & Record<string, unknown>)
    } catch (error) {
      if (!isSparkDbError(error)) throw error
      console.error('[db] SparkDB insert failed, falling back to MongoDB:', error)

      const model = await getModel(this.table)
      await model.create(values as Record<string, unknown>)
      return fallbackResult(1)
    }
  }

  async update(values: Partial<T>) {
    try {
      return await this.spark
        .collection<T>(this.table)
        .updateMany(
          this.filters as Record<string, unknown>,
          values as Partial<T> & Record<string, unknown>
        )
    } catch (error) {
      if (!isSparkDbError(error)) throw error
      console.error('[db] SparkDB update failed, falling back to MongoDB:', error)

      const model = await getModel(this.table)
      const result = await model.updateMany(
        this.filters as Record<string, unknown>,
        { $set: values as Record<string, unknown> }
      )
      return fallbackResult(result.modifiedCount ?? 0)
    }
  }

  async delete() {
    try {
      return await this.spark
        .collection<T>(this.table)
        .deleteMany(this.filters as Record<string, unknown>)
    } catch (error) {
      if (!isSparkDbError(error)) throw error
      console.error('[db] SparkDB delete failed, falling back to MongoDB:', error)

      const model = await getModel(this.table)
      const result = await model.deleteMany(this.filters as Record<string, unknown>)
      return fallbackResult(result.deletedCount ?? 0)
    }
  }
}

function fallbackResult(rowsAffected: number) {
  return {
    columns: [],
    rows: [],
    rows_affected: rowsAffected,
    duration_ms: 0,
    message: 'mongodb-fallback',
  }
}

export class FallbackDb {
  private readonly spark: MongoDBClient

  constructor() {
    this.spark = new MongoDBClient({
      database_url: getMongoUri(),
      apiKey: getEnv('SPARK_API_KEY'),
    })
  }

  from<T extends object>(table: string) {
    return new FallbackTable<T>(this.spark, table)
  }
}

export function getDb() {
  return new FallbackDb()
}
