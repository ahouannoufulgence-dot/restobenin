'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Saisie du code reçu par e-mail (6 à 10 chiffres selon le réglage de Supabase : on n'impose donc pas de longueur
 * précise). `onSubmit` renvoie un message d'erreur à afficher, ou null si le code est bon.
 */
export function EmailCodeBox({ onSubmit, className = '' }: { onSubmit: (code: string) => Promise<string | null>; className?: string }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (busy || done) return
    setBusy(true)
    setError('')
    const failure = await onSubmit(code)
    setBusy(false)
    if (failure) setError(failure)
    else setDone(true)
  }

  return (
    // Pas de <form> ici : ce bloc peut se trouver à l'intérieur d'un autre formulaire (la connexion), ce qui est interdit en HTML.
    <div className={`w-full text-left ${className}`}>
      <label htmlFor="email-code" className="block text-sm font-semibold text-foreground">
        Code reçu par e-mail
      </label>
      <input
        id="email-code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault() // ne valide pas le formulaire de connexion qui peut entourer ce bloc
            void submit()
          }
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={10}
        placeholder="123456"
        aria-describedby={error ? 'email-code-error' : undefined}
        aria-invalid={error ? true : undefined}
        disabled={done}
        className="mt-1.5 h-14 w-full rounded-xl border border-border bg-background px-4 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-ember focus:ring-3 focus:ring-ember/20 disabled:opacity-60"
      />
      {error && (
        <p id="email-code-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-2 text-sm font-medium text-success">
          Code validé.
        </p>
      )}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || done || code.length < 6}
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember to-ember-deep text-base font-semibold text-primary-foreground shadow-lg shadow-ember-deep/25 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40"
      >
        {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {busy ? 'Vérification…' : 'Valider le code'}
      </button>
    </div>
  )
}
