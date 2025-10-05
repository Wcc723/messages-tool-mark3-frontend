/**
 * Google Identity Services 類型定義
 */

export interface GoogleCredentialResponse {
  credential: string // JWT token from Google
  select_by?: string
  clientId?: string
}

export interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }) => void
  prompt: (momentListener?: (notification: any) => void) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number
      locale?: string
    }
  ) => void
  disableAutoSelect: () => void
  revoke: (email: string, callback: (response: any) => void) => void
}

export interface GoogleAccounts {
  id: GoogleAccountsId
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts
    }
  }
}

export {}
