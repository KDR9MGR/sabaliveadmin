import { supabase } from './supabase.js'
import { updateAppConfig } from './appConfig.js'
import { readLiveWarning, checkLiveWarning } from './liveWarning.js'

/* The welcome warning's switch and text (sabalive migration 20261020110000). { available: false } while the columns are not on this
   project, so the page can say so instead of failing; the apps keep showing the built-in warning meanwhile. */
export async function getLiveWarning() {
  const { data, error } = await supabase.from('app_config').select('video_warning_enabled, video_warning_text').eq('id', true).maybeSingle()
  if (error) {
    if (/video_warning|column|schema cache/i.test(error.message || '')) return { available: false, value: readLiveWarning(null) }
    throw error
  }
  return { available: true, value: readLiveWarning(data) }
}

/* Saves it through the existing app_config update policy (Master / Super Admin); anyone else gets a sentence, not a stack trace. */
export async function saveLiveWarning(form) {
  const checked = checkLiveWarning(form)
  if (checked.error) throw new Error(checked.error)
  try {
    await updateAppConfig(checked.patch)
  } catch (e) {
    const m = e?.message || ''
    if (/video_warning|column|schema cache/i.test(m)) throw new Error('The live welcome warning is not installed on this project yet (it needs the database update 20261020110000).')
    if (e?.code === 'PGRST116' || /no rows|multiple \(or no\) rows/i.test(m)) throw new Error('Only a Master or Super Admin can change the live welcome warning.')
    if (/check constraint/i.test(m)) throw new Error('The server refused that text (at most 600 characters).')
    throw e
  }
}
