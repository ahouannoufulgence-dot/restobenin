'use client'

import { useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { roleLabels } from '@/lib/employees-store'
import {
  DEFAULT_PERMISSIONS,
  accessFor,
  configurableModules,
  editableRoles,
  permissionsActions,
  usePermissionOverrides,
  type ConfigurableView,
  type RolePermissions,
} from '@/lib/permissions'
import { Panel } from './shared'

function Toggle({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border bg-card text-transparent transition-colors peer-checked:border-ember-deep peer-checked:bg-ember-deep peer-checked:text-white peer-focus-visible:ring-3 peer-focus-visible:ring-ember/30">
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </span>
      <span>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  )
}

/** Paramètres > Rôles et accès : le gérant choisit ce que chaque fonction peut ouvrir et faire. */
export function RolesPanel() {
  const overrides = usePermissionOverrides()
  const [message, setMessage] = useState('')
  const customized = Object.keys(overrides).length > 0

  function update(role: (typeof editableRoles)[number], next: RolePermissions) {
    // Le module affiché à la connexion doit rester accessible.
    const access = accessFor(role, { ...overrides, [role]: next })
    const home = (access.home as ConfigurableView) ?? next.home
    const ok = permissionsActions.set(role, { ...next, home })
    setMessage(ok ? 'Droits enregistrés.' : 'Enregistrement impossible : la mémoire du navigateur est pleine.')
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <ShieldCheck className="size-5 text-ember" aria-hidden="true" />
            Rôles et accès
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Choisissez ce que chaque fonction peut ouvrir. Un employé ne voit que ses modules. Le gérant a toujours accès à tout.
          </p>
        </div>
        {customized && (
          <button
            type="button"
            onClick={() => {
              permissionsActions.reset()
              setMessage('Droits par défaut rétablis.')
            }}
            className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:border-ember hover:text-ember focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/30"
          >
            Rétablir les droits par défaut
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {editableRoles.map((role) => {
          const current: RolePermissions = overrides[role] ?? DEFAULT_PERMISSIONS[role]
          const toggleView = (view: ConfigurableView, on: boolean) => {
            const views = on ? [...new Set([...current.views, view])] : current.views.filter((v) => v !== view)
            update(role, { ...current, views })
          }
          return (
            <fieldset key={role} className="rounded-2xl border border-border bg-background p-4">
              <legend className="px-1 font-serif text-lg font-semibold">{roleLabels[role]}</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {configurableModules.map((m) => (
                  <Toggle key={m.view} id={`${role}-${m.view}`} checked={current.views.includes(m.view)} onChange={(on) => toggleView(m.view, on)} label={m.label} />
                ))}
              </div>
              <div className="mt-3 grid gap-2.5 border-t border-dashed border-border pt-3">
                <Toggle
                  id={`${role}-orders`}
                  checked={current.createOrders}
                  onChange={(v) => update(role, { ...current, createOrders: v })}
                  label="Prendre des commandes"
                  hint="Sans accès à l’encaissement (caisse)."
                />
                <Toggle id={`${role}-menu`} checked={current.editMenu} onChange={(v) => update(role, { ...current, editMenu: v })} label="Modifier le menu" hint="Ajouter, modifier, supprimer et rendre indisponible un plat." />
              </div>
            </fieldset>
          )
        })}
      </div>

      <p role="status" className={cn('mt-4 min-h-5 text-sm font-medium text-success', !message && 'invisible')}>
        {message || '.'}
      </p>
      <p className="text-xs text-muted-foreground">Tableau de bord, Commandes… : un module décoché disparaît du menu de la personne et reste inaccessible. L’aide est toujours disponible.</p>
    </Panel>
  )
}
