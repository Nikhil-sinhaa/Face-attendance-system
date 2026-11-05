import React, { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { CheckCircle2 } from 'lucide-react'
import { Notice } from './Notice'
import { COLLEGE_DOMAIN, GOOGLE_CLIENT_ID } from '../../services/config'


// Reads the (unverified) claims of a Google ID token for display only.
// The backend verifies the signature, audience and domain again.
const decodeJwt = (token) => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/**
 * "Sign in with Google" restricted to @iiitdwd.ac.in accounts.
 * `identity` is `{ credential, email, name, rollNo }` or null; changes are
 * reported through `onChange`.
 */
export const CollegeGoogleButton = ({ identity, onChange, disabled = false }) => {
  const [error, setError] = useState('')

  if (!GOOGLE_CLIENT_ID) {
    return <Notice>Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend .env file.</Notice>
  }

  if (identity) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2.5 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            Verified as <strong className="font-semibold">{identity.email}</strong>
          </span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-xs font-semibold text-slate-300 underline-offset-4 hover:underline"
          >
            Change
          </button>
        )}
      </div>
    )
  }

  const handleSuccess = (response) => {
    const claims = decodeJwt(response?.credential || '')
    const email = String(claims?.email || '').toLowerCase()
    if (!claims || !claims.email_verified || !email.endsWith(`@${COLLEGE_DOMAIN}`)) {
      setError(`Only @${COLLEGE_DOMAIN} accounts are allowed. Please choose your college account.`)
      return
    }
    setError('')
    onChange({
      credential: response.credential,
      email,
      name: claims.name || '',
      rollNo: email.split('@')[0],
    })
  }

  return (
    <div className="space-y-3">
      {error && <Notice>{error}</Notice>}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError('Google sign-in failed. Please try again.')}
        text="signin_with"
        shape="rectangular"
        theme="filled_black"
        size="large"
      />
      <p className="text-xs text-slate-400">Use your @{COLLEGE_DOMAIN} Google account.</p>
    </div>
  )
}
