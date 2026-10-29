import { getSupabase } from './client'

/**
 * Écritures vers la base. Chaque fonction renvoie la réponse Supabase ({ error }) : l'appelant décide quoi en faire.
 * Les droits sont vérifiés par la base (RLS) : ces appels échouent proprement si la fonction n'a pas le droit.
 */
export const BUCKET = 'restaurant-media'

export const publicUrl = (path: string | null | undefined) =>
  path ? getSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl : undefined

/** Envoie une image (data URL réduite par `photoToDataUrl`) et renvoie son chemin dans le stockage. */
export async function uploadDataUrl(restaurantId: string, folder: string, id: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${restaurantId}/${folder}/${id}-${Date.now()}.${ext}`
  const { error } = await getSupabase().storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: true })
  if (error) throw new Error(error.message)
  return path
}

export const api = {
  updateRestaurant: (rid: string, v: { name: string; site_url: string; address: string; phone: string; receipt_footer: string }) =>
    getSupabase().from('restaurants').update(v).eq('id', rid),

  updatePaymentMethod: (rid: string, method: string) => getSupabase().from('restaurants').update({ payment_method: method }).eq('id', rid),

  insertStaff: (row: Record<string, unknown>) => getSupabase().from('staff').insert(row),
  updateStaff: (id: string, row: Record<string, unknown>) => getSupabase().from('staff').update(row).eq('id', id),
  deleteStaff: (id: string) => getSupabase().from('staff').delete().eq('id', id),

  upsertPermissions: (rows: Record<string, unknown>[]) => getSupabase().from('role_permissions').upsert(rows, { onConflict: 'restaurant_id,role' }),

  changePlan: (rid: string, plan: string, billing: string) => getSupabase().rpc('change_plan', { p_restaurant: rid, p_plan: plan, p_billing: billing }),
}
