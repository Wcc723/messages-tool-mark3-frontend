/**
 * Cookie 工具函數
 * 用於儲存認證 token，未來可輕鬆調整為 httpOnly cookie
 */

export interface CookieOptions {
  expires?: number | Date // 過期天數或日期
  path?: string // Cookie 路徑
  domain?: string // Cookie 域名
  secure?: boolean // 是否僅 HTTPS
  sameSite?: 'Strict' | 'Lax' | 'None' // SameSite 屬性
}

/**
 * 設定 Cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  // 處理過期時間
  if (options.expires) {
    let expiresDate: Date
    if (typeof options.expires === 'number') {
      expiresDate = new Date()
      expiresDate.setTime(expiresDate.getTime() + options.expires * 24 * 60 * 60 * 1000)
    } else {
      expiresDate = options.expires
    }
    cookieString += `; expires=${expiresDate.toUTCString()}`
  }

  // 路徑
  cookieString += `; path=${options.path || '/'}`

  // 域名
  if (options.domain) {
    cookieString += `; domain=${options.domain}`
  }

  // Secure
  if (options.secure) {
    cookieString += '; secure'
  }

  // SameSite
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`
  }

  document.cookie = cookieString
}

/**
 * 取得 Cookie
 */
export function getCookie(name: string): string | null {
  const nameEQ = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    const rawCookie = cookies[i]
    if (!rawCookie) continue
    const cookie = rawCookie.trimStart()
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }

  return null
}

/**
 * 刪除 Cookie
 */
export function removeCookie(name: string, options: CookieOptions = {}): void {
  setCookie(name, '', {
    ...options,
    expires: new Date(0), // 設定過期時間為過去
  })
}

/**
 * 檢查 Cookie 是否存在
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null
}

// Cookie 名稱常數
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'hex_toolman_token',
  REFRESH_TOKEN: 'hex_toolman_refresh',
} as const

// Cookie 預設選項
export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  sameSite: 'Lax',
  // 未來可以改為 secure: true (僅 HTTPS)
}
