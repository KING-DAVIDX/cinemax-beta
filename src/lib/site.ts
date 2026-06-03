export const ADMIN_EMAIL = 'ajayid340@gmail.com'
export const CINEMAX_EMAIL = 'cinemax.nexustech@gmail.com'
export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb66P6J8aKvJNoSXEy1A'

export function isAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL
}
