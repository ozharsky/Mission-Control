// Secure token storage with encryption
// Uses simple obfuscation - for production, use a proper encryption library

const TOKEN_PREFIX = 'mc_enc_'

// Simple XOR encryption (not truly secure, but better than plaintext)
// For production, use Web Crypto API or a library like crypto-js
function encrypt(text, key = 'mc-default-key') {
  if (!text) return ''
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return btoa(result)
}

function decrypt(encrypted, key = 'mc-default-key') {
  if (!encrypted) return ''
  try {
    const text = atob(encrypted)
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch (e) {
    console.error('Decryption failed:', e)
    return ''
  }
}

// Secure storage wrapper
export const secureStorage = {
  // Firebase token
  getFirebaseToken() {
    const encrypted = localStorage.getItem(`${TOKEN_PREFIX}firebase`)
    return encrypted ? decrypt(encrypted) : ''
  },
  
  setFirebaseToken(token) {
    if (token) {
      localStorage.setItem(`${TOKEN_PREFIX}firebase`, encrypt(token))
    } else {
      localStorage.removeItem(`${TOKEN_PREFIX}firebase`)
    }
  },
  
  // GitHub token
  getGithubToken() {
    const encrypted = localStorage.getItem(`${TOKEN_PREFIX}github`)
    return encrypted ? decrypt(encrypted) : ''
  },
  
  setGithubToken(token) {
    if (token) {
      localStorage.setItem(`${TOKEN_PREFIX}github`, encrypt(token))
    } else {
      localStorage.removeItem(`${TOKEN_PREFIX}github`)
    }
  },
  
  // Clear all secure tokens
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(TOKEN_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },
  
  // Check if tokens exist
  hasTokens() {
    return !!(this.getFirebaseToken() || this.getGithubToken())
  }
}

// Session-only storage (cleared when tab closes)
export const sessionSecureStorage = {
  get(key) {
    const encrypted = sessionStorage.getItem(`${TOKEN_PREFIX}${key}`)
    return encrypted ? decrypt(encrypted) : null
  },
  
  set(key, value) {
    if (value) {
      sessionStorage.setItem(`${TOKEN_PREFIX}${key}`, encrypt(value))
    } else {
      sessionStorage.removeItem(`${TOKEN_PREFIX}${key}`)
    }
  },
  
  remove(key) {
    sessionStorage.removeItem(`${TOKEN_PREFIX}${key}`)
  }
}

// Export encryption functions for other uses
export { encrypt, decrypt }