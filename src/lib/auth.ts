import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { client } from '@shellhaki/sparkdb-sdk'
import { isAdminEmail } from '@/lib/site'

export const SESSION_COOKIE = 'cinemax_session'
export const AUTH_SERVICE_ERROR_MESSAGE = 'Account service is temporarily unavailable. Try again later.'
const USERS_COLLECTION = 'users'
const PBKDF2_ITERATIONS = 210000
const PBKDF2_KEY_LENGTH = 32
const PBKDF2_DIGEST = 'sha256'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export type AuthProvider = 'password' | 'google'

export type StoredUser = {
  id: string
  email: string
  name: string
  provider: AuthProvider
  passwordHash?: string
  googleId?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export type PublicUser = {
  id: string
  email: string
  name: string
  provider: AuthProvider
  avatarUrl?: string
  createdAt: string
}

type SessionPayload = {
  uid: string
  exp: number
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured.`)
  }
  return value
}

export function isAuthServiceError(error: unknown) {
  if (!(error instanceof Error)) return false

  return (
    error.name === 'SparkError'
    || error.message === 'fetch failed'
    || error.message.startsWith('SparkDB ')
    || error.message.startsWith('SPARK_')
    || error.message.startsWith('AUTH_')
  )
}

export function getDb() {
  return new client('mongodb', {
    database_url: getEnv('SPARK_DATABASE_URL'),
    apiKey: getEnv('SPARK_API_KEY'),
  })
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function sanitizeName(name: string, fallbackEmail: string) {
  const trimmed = name.trim()
  if (trimmed) return trimmed.slice(0, 80)
  return fallbackEmail.split('@')[0] || 'Cinemax User'
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}

export async function findUserByEmail(email: string) {
  const users = await getDb()
    .from<StoredUser>(USERS_COLLECTION)
    .where({ email: normalizeEmail(email) })
    .limit(1)
    .select()

  return users[0] || null
}

export async function findUserById(id: string) {
  const users = await getDb()
    .from<StoredUser>(USERS_COLLECTION)
    .where({ id })
    .limit(1)
    .select()

  return users[0] || null
}

export async function listUsers() {
  const users = await getDb().from<StoredUser>(USERS_COLLECTION).select()

  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function createUser(user: Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString()
  const storedUser: StoredUser = {
    id: crypto.randomUUID(),
    ...user,
    email: normalizeEmail(user.email),
    createdAt: now,
    updatedAt: now,
  }

  await getDb().from<StoredUser>(USERS_COLLECTION).insert(storedUser)
  return storedUser
}

export async function updateUser(id: string, values: Partial<StoredUser>) {
  const updatedAt = new Date().toISOString()
  await getDb()
    .from<StoredUser>(USERS_COLLECTION)
    .where({ id })
    .update({ ...values, updatedAt })

  return findUserById(id)
}

export async function deleteUser(id: string) {
  await getDb().from<StoredUser>(USERS_COLLECTION).where({ id }).delete()
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex')

  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`
}

export function verifyPassword(password: string, storedHash?: string) {
  if (!storedHash) return false

  const [algorithm, iterationsValue, salt, originalHash] = storedHash.split('$')
  if (algorithm !== 'pbkdf2' || !iterationsValue || !salt || !originalHash) return false

  const iterations = Number(iterationsValue)
  if (!Number.isFinite(iterations)) return false

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex')
  const candidateBuffer = Buffer.from(candidate, 'hex')
  const originalBuffer = Buffer.from(originalHash, 'hex')

  return candidateBuffer.length === originalBuffer.length && crypto.timingSafeEqual(candidateBuffer, originalBuffer)
}

function base64Url(input: string) {
  return Buffer.from(input).toString('base64url')
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac('sha256', getEnv('AUTH_SECRET')).update(encodedPayload).digest('base64url')
}

export function createSessionToken(userId: string) {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encodedPayload = base64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)

  return `${encodedPayload}.${signature}`
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

export function attachSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId), sessionCookieOptions())
  return response
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    ...sessionCookieOptions(),
    maxAge: 0,
  })
  return response
}

export function verifySessionToken(token?: string) {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)
  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.uid || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session) return null

  return findUserById(session.uid)
}

export function isAdminUser(user?: StoredUser | PublicUser | null) {
  return isAdminEmail(user?.email)
}
