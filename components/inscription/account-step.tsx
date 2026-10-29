'use client'

import { ArrowRight, Building2, ChevronDown, Eye, EyeOff, Lock, LockKeyhole, Mail, Phone, Store, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard, StepHeading, TextField, primaryButton } from './ui'

export type AccountData = {
  restaurant: string
  manager: string
  email: string
  phone: string
  password: string
  establishment: string
}

type FieldKey = keyof AccountData | 'confirm'
type Errors = Partial<Record<FieldKey, string>>

const establishmentTypes = [
  'Restaurant traditionnel',
  'Restaurant gastronomique',
  'Maquis',
  'Fast-food',
  'Café & salon de thé',
  'Bar & lounge',
  'Hôtel-restaurant',
  'Traiteur',
]

const fieldOrder: FieldKey[] = ['restaurant', 'manager', 'email', 'phone', 'password', 'confirm', 'establishment']

function validate(data: AccountData, confirm: string): Errors {
  const errors: Errors = {}
  if (data.restaurant.trim().length < 2) errors.restaurant = 'Indiquez le nom de votre restaurant.'
  if (data.manager.trim().length < 2) errors.manager = 'Indiquez le nom complet du responsable.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Saisissez une adresse e-mail valide.'
  const digits = data.phone.replace(/\D/g, '')
  if (digits.length !== 8 && digits.length !== 10) errors.phone = 'Saisissez un numéro béninois à 8 ou 10 chiffres.'
  if (data.password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caractères.'
  if (confirm !== data.password) errors.confirm = 'Les mots de passe ne correspondent pas.'
  if (!data.establishment) errors.establishment = 'Sélectionnez votre type d’établissement.'
  return errors
}

export function AccountStep({
  defaultValues,
  onSubmit,
}: {
  defaultValues: AccountData | null
  /** Renvoie un message d'erreur à afficher, ou null si l'étape est validée. */
  onSubmit: (data: AccountData) => Promise<string | null>
}) {
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const get = (key: string) => String(form.get(key) ?? '')
    const data: AccountData = {
      restaurant: get('restaurant'),
      manager: get('manager'),
      email: get('email'),
      phone: get('phone'),
      password: get('password'),
      establishment: get('establishment'),
    }
    const nextErrors = validate(data, get('confirm'))
    setErrors(nextErrors)
    const firstInvalid = fieldOrder.find((key) => nextErrors[key])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setFormError('')
    setSubmitting(true)
    const failure = await onSubmit({ ...data, email: data.email.trim(), restaurant: data.restaurant.trim(), manager: data.manager.trim() })
    setSubmitting(false)
    if (failure) setFormError(failure)
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="-mr-1 inline-flex size-10 items-center justify-center rounded text-muted-foreground transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40"
      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      aria-pressed={showPassword}
    >
      {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
    </button>
  )

  return (
    <section aria-labelledby="account-title" className="mx-auto w-full max-w-3xl">
      <StepHeading
        id="account-title"
        title="Créez votre compte RestoBen"
        subtitle="Rejoignez les restaurants qui élèvent leur gestion au rang d’art."
      />

      <GlassCard className="mt-6 p-5 sm:mt-10 sm:p-10">
        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-4 sm:grid-cols-2 sm:gap-y-5">
          <TextField
            id="restaurant"
            label="Nom du restaurant"
            icon={Store}
            placeholder="Chez Amina"
            autoComplete="organization"
            enterKeyHint="next"
            defaultValue={defaultValues?.restaurant}
            error={errors.restaurant}
          />
          <TextField
            id="manager"
            label="Nom complet du responsable"
            icon={UserRound}
            placeholder="Amina Houngbédji"
            autoComplete="name"
            defaultValue={defaultValues?.manager}
            error={errors.manager}
          />
          <TextField
            id="email"
            label="Adresse e-mail"
            icon={Mail}
            type="email"
            placeholder="contact@chezamina.bj"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={defaultValues?.email}
            error={errors.email}
          />
          <TextField
            id="phone"
            label="Numéro de téléphone"
            icon={Phone}
            prefix="+229"
            type="tel"
            placeholder="01 97 12 34 56"
            autoComplete="tel-national"
            inputMode="tel"
            defaultValue={defaultValues?.phone}
            error={errors.phone}
          />
          <TextField
            id="password"
            label="Mot de passe"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            defaultValue={defaultValues?.password}
            error={errors.password}
            trailing={passwordToggle}
          />
          <TextField
            id="confirm"
            label="Confirmation du mot de passe"
            icon={LockKeyhole}
            type={showPassword ? 'text' : 'password'}
            placeholder="Répétez le mot de passe"
            autoComplete="new-password"
            defaultValue={defaultValues?.password}
            error={errors.confirm}
          />

          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="establishment" className="text-sm font-medium text-foreground">
              Type d&apos;établissement
            </label>
            <div
              className={cn(
                'relative flex h-12 items-center rounded-lg border bg-background/70 transition-colors focus-within:border-ember focus-within:ring-3 focus-within:ring-ember/15',
                errors.establishment ? 'border-destructive' : 'border-input',
              )}
            >
              <Building2 className="pointer-events-none absolute left-4 size-4 text-muted-foreground" aria-hidden="true" />
              <select
                id="establishment"
                name="establishment"
                defaultValue={defaultValues?.establishment ?? ''}
                aria-invalid={errors.establishment ? true : undefined}
                aria-describedby={errors.establishment ? 'establishment-error' : undefined}
                className="h-full w-full appearance-none bg-transparent pl-11 pr-10 text-base text-foreground outline-none sm:text-sm"
              >
                <option value="" disabled>
                  Sélectionnez une option
                </option>
                {establishmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            {errors.establishment && (
              <p id="establishment-error" className="text-xs font-medium text-destructive">
                {errors.establishment}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-col items-center gap-5 sm:col-span-2">
            {formError && (
              <p role="alert" className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {formError}
              </p>
            )}
            <button type="submit" disabled={submitting} className={cn(primaryButton, 'w-full disabled:opacity-70 sm:w-auto sm:min-w-72')}>
              Continuer
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link href="/connexion" className="font-semibold text-ember underline-offset-4 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </GlassCard>
    </section>
  )
}
