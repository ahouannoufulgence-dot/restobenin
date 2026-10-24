'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ChefHat, ChevronRight, ConciergeBell, Filter, Mail, Package, Phone, Plus, Search, ShieldCheck, Trash2, UserCheck, Users, Umbrella, Wallet, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isValidEmail, isValidPhone } from '@/lib/auth'
import { photoToDataUrl } from '@/lib/image-resize'
import {
  employeesActions,
  normalizeEmail,
  phoneKey,
  roleLabels,
  roleOrder,
  statusLabels,
  type Employee,
  type EmployeeRole,
  type EmployeeStatus,
} from '@/lib/employees-store'
import { Panel, ScreenHeader, iconButton, primaryAction } from './shared'

const roleIcons: Record<EmployeeRole, LucideIcon> = {
  gerant: ShieldCheck,
  chef: ChefHat,
  cuisinier: ChefHat,
  serveur: ConciergeBell,
  caissier: Wallet,
  stockiste: Package,
}

const fieldClass =
  'h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ember focus:ring-3 focus:ring-ember/20'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

function Avatar({ employee, className }: { employee: Pick<Employee, 'name' | 'photo'>; className?: string }) {
  return employee.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={employee.photo} alt="" className={cn('shrink-0 rounded-full object-cover', className)} />
  ) : (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-sand font-serif font-semibold text-terracotta', className)}>
      {initials(employee.name)}
    </span>
  )
}

function StatusPill({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs',
        status === 'actif' ? 'bg-success/12 text-success' : 'bg-ember/12 text-ember-deep',
      )}
    >
      <span className={cn('size-1.5 rounded-full', status === 'actif' ? 'bg-success' : 'bg-ember')} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}

function RolePill({ role }: { role: EmployeeRole }) {
  const Icon = roleIcons[role]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9a6f2e] px-2.5 py-0.5 text-[11px] font-semibold text-cream sm:py-1 sm:text-xs">
      <Icon className="size-3.5" aria-hidden="true" />
      {roleLabels[role]}
    </span>
  )
}

function Stat({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: 'brand' | 'ok' | 'warn' }) {
  const tones = {
    brand: { box: 'bg-sand text-terracotta', value: 'text-ember-deep' },
    ok: { box: 'bg-success/12 text-success', value: 'text-success' },
    warn: { box: 'bg-ember/12 text-ember', value: 'text-ember-deep' },
  }[tone]
  return (
    <Panel className="flex min-w-0 flex-col items-center gap-1 p-2.5 text-center sm:p-4">
      <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
        <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-full', tones.box)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-medium leading-tight text-foreground/85 sm:text-sm">{label}</span>
      </span>
      <span className={cn('font-serif text-3xl font-semibold tabular-nums sm:text-4xl', tones.value)}>{value}</span>
    </Panel>
  )
}

type Draft = { id: string; name: string; role: EmployeeRole; phone: string; email: string; status: EmployeeStatus; photo?: string }

function EmployeeForm({ employee, all, onClose }: { employee: Employee | null; all: Employee[]; onClose: () => void }) {
  const isNew = !employee
  const [draft, setDraft] = useState<Draft>(
    employee ?? { id: employeesActions.newId(), name: '', role: 'serveur', phone: '+229 ', email: '', status: 'actif' },
  )
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'email' | 'form', string>>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  // Le dernier gérant ne peut être ni supprimé, ni rétrogradé, ni mis en congé : il faut toujours un accès gérant.
  const gerants = all.filter((e) => e.role === 'gerant' && e.status === 'actif')
  const isLastGerant = !!employee && employee.role === 'gerant' && employee.status === 'actif' && gerants.length === 1

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      set('photo', await photoToDataUrl(file, 256, 0.8))
      setErrors((x) => ({ ...x, form: undefined }))
    } catch (err) {
      setErrors((x) => ({ ...x, form: err instanceof Error ? err.message : 'Photo impossible à lire.' }))
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    const others = all.filter((x) => x.id !== draft.id)
    if (!draft.name.trim()) next.name = 'Indiquez le nom de l’employé.'
    if (!isValidPhone(draft.phone)) next.phone = 'Numéro invalide (ex. +229 01 97 12 34 56).'
    else if (others.some((x) => phoneKey(x.phone) === phoneKey(draft.phone))) next.phone = 'Ce numéro est déjà utilisé par un autre employé.'
    if (!isValidEmail(draft.email)) next.email = 'Adresse e-mail invalide.'
    else if (others.some((x) => normalizeEmail(x.email) === normalizeEmail(draft.email))) next.email = 'Cette adresse est déjà utilisée par un autre employé.'
    if (isLastGerant && (draft.role !== 'gerant' || draft.status !== 'actif')) next.form = 'Il doit rester au moins un gérant actif.'
    setErrors(next)
    if (Object.keys(next).length) return
    const saved: Employee = { ...draft, name: draft.name.trim().replace(/\s+/g, ' '), email: draft.email.trim(), phone: draft.phone.trim() }
    if (!employeesActions.save(saved)) return setErrors({ form: 'Enregistrement impossible : le stockage du navigateur est plein.' })
    onClose()
  }

  function remove() {
    if (!employee || isLastGerant) return
    if (!confirmDelete) return setConfirmDelete(true)
    employeesActions.remove(employee.id)
    onClose()
  }

  const label = 'mb-1.5 block text-sm font-medium text-foreground/85'
  const err = (m?: string) => (m ? <p className="mt-1.5 text-sm text-destructive">{m}</p> : null)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="employee-form-title">
      <form onSubmit={submit} noValidate className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-background p-5 shadow-2xl md:max-w-lg md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="employee-form-title" className="font-serif text-2xl font-semibold">
            {isNew ? 'Ajouter un employé' : 'Modifier l’employé'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className={iconButton}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {errors.form && (
          <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {errors.form}
          </p>
        )}

        <div className="mt-5 flex items-center gap-4">
          <Avatar employee={draft} className="size-16 text-xl" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-ember hover:text-ember focus-within:ring-3 focus-within:ring-ember/30">
              <Camera className="size-4" aria-hidden="true" />
              {draft.photo ? 'Changer la photo' : 'Ajouter une photo'}
              <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
            </label>
            {draft.photo && (
              <button type="button" onClick={() => set('photo', undefined)} className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:text-destructive">
                Retirer
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="emp-name" className={label}>Nom complet</label>
            <input ref={nameRef} id="emp-name" value={draft.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" placeholder="Prénom Nom" aria-invalid={!!errors.name} className={cn(fieldClass, errors.name && 'border-destructive')} />
            {err(errors.name)}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emp-role" className={label}>Rôle</label>
              <select id="emp-role" value={draft.role} onChange={(e) => set('role', e.target.value as EmployeeRole)} className={fieldClass}>
                {roleOrder.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emp-status" className={label}>Statut</label>
              <select id="emp-status" value={draft.status} onChange={(e) => set('status', e.target.value as EmployeeStatus)} className={fieldClass}>
                <option value="actif">Actif</option>
                <option value="conge">En congé</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="emp-phone" className={label}>Téléphone</label>
            <input id="emp-phone" type="tel" inputMode="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="off" aria-invalid={!!errors.phone} className={cn(fieldClass, errors.phone && 'border-destructive')} />
            {err(errors.phone)}
          </div>

          <div>
            <label htmlFor="emp-email" className={label}>Adresse e-mail</label>
            <input id="emp-email" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={draft.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" placeholder="prenom.nom@restoben.bj" aria-invalid={!!errors.email} className={cn(fieldClass, errors.email && 'border-destructive')} />
            {err(errors.email)}
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          L’employé se connecte via l’onglet « Employé » avec cette adresse e-mail ou ce téléphone.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!isNew ? (
            <button
              type="button"
              onClick={remove}
              disabled={isLastGerant}
              title={isLastGerant ? 'Le dernier gérant ne peut pas être supprimé' : undefined}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className={primaryAction}>
            {isNew ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function EmployeesScreen({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'tous' | EmployeeStatus>('tous')
  const [editing, setEditing] = useState<Employee | 'new' | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const active = employees.filter((e) => e.status === 'actif').length
  const onLeave = employees.length - active

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter((e) => {
      if (statusFilter !== 'tous' && e.status !== statusFilter) return false
      if (!q) return true
      return [e.name, roleLabels[e.role], e.phone, e.email].some((v) => v.toLowerCase().includes(q))
    })
  }, [employees, query, statusFilter])

  const closeForm = () => setEditing(null)

  return (
    <>
      <ScreenHeader
        title="Employés"
        subtitle="Votre équipe, ses rôles et ses accès."
        actions={
          <>
            <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Rechercher un employé" aria-pressed={searchOpen} className={iconButton}>
              <Search className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setFilterOpen((o) => !o)} aria-label="Filtrer par statut" aria-pressed={filterOpen || statusFilter !== 'tous'} className={iconButton}>
              <Filter className="size-5" aria-hidden="true" />
            </button>
          </>
        }
      />

      {searchOpen && (
        <div className="mb-4">
          <label htmlFor="emp-search" className="sr-only">Rechercher un employé</label>
          <input ref={searchRef} id="emp-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, rôle, téléphone, e-mail…" className={fieldClass} />
        </div>
      )}

      {filterOpen && (
        <div role="group" aria-label="Filtrer par statut" className="mb-4 flex flex-wrap gap-2">
          {(['tous', 'actif', 'conge'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={cn(
                'h-9 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30',
                statusFilter === s ? 'border-ember bg-ember text-primary-foreground' : 'border-border bg-card hover:border-ember',
              )}
            >
              {s === 'tous' ? 'Tous' : statusLabels[s]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Users} label="Total employés" value={employees.length} tone="brand" />
        <Stat icon={UserCheck} label="Actifs" value={active} tone="ok" />
        <Stat icon={Umbrella} label="En congé" value={onLeave} tone="warn" />
      </div>

      <h2 className="mt-6 inline-block border-b-2 border-gold pb-1 font-serif text-xl font-semibold">Liste des employés</h2>

      {visible.length === 0 ? (
        <Panel className="mt-4 text-center text-sm text-muted-foreground">Aucun employé ne correspond à votre recherche.</Panel>
      ) : (
        <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
          {visible.map((e) => (
            <li key={e.id} className="flex min-w-0 items-stretch gap-1 rounded-2xl border border-border bg-card p-2.5 shadow-[0_10px_30px_-18px_rgba(74,36,14,0.35)] sm:p-4">
              <button
                type="button"
                onClick={() => setEditing(e)}
                aria-label={`Modifier ${e.name}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/25"
              >
                <Avatar employee={e} className="size-12 text-base min-[400px]:size-14 min-[400px]:text-lg sm:size-[4.5rem] sm:text-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg font-semibold leading-tight sm:text-xl">{e.name}</span>
                  <span className="mt-1 block"><RolePill role={e.role} /></span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-foreground/80 sm:text-xs">
                    <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate tabular-nums">
                      {e.phone.startsWith('+229') ? (
                        <>
                          <span className="max-[359px]:hidden">+229 </span>
                          {e.phone.slice(4).trim()}
                        </>
                      ) : (
                        e.phone
                      )}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground/80 sm:text-xs">
                    <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{e.email}</span>
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                <StatusPill status={e.status} />
                <div className="flex items-center">
                  <a href={`tel:${e.phone.replace(/[^\d+]/g, '')}`} aria-label={`Appeler ${e.name}`} className="inline-flex size-8 items-center justify-center rounded-full text-espresso/80 hover:bg-muted hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 sm:size-9">
                    <Phone className="size-[1.15rem] sm:size-5" aria-hidden="true" />
                  </a>
                  <a href={`mailto:${e.email}`} aria-label={`Écrire à ${e.name}`} className="inline-flex size-8 items-center justify-center rounded-full text-espresso/80 hover:bg-muted hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30 sm:size-9">
                    <Mail className="size-[1.15rem] sm:size-5" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <ChevronRight className="my-auto size-4 shrink-0 text-ember sm:size-5" aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => setEditing('new')} className={cn(primaryAction, 'mt-5 h-14 w-full text-base')}>
        <Plus className="size-5" aria-hidden="true" />
        Ajouter un employé
      </button>

      {editing && <EmployeeForm employee={editing === 'new' ? null : editing} all={employees} onClose={closeForm} />}
    </>
  )
}
