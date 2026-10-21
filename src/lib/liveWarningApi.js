import { supabase } from './supabase.js'
import { updateAppConfig } from './appConfig.js'
import { readLiveWarnings, checkLiveWarnings } from './liveWarning.js'

/* The welcome warnings' switches and texts (sabalive migration 20261020110000). { available: false } while the columns are not on this project, so
   the page can say so instead of failing; the apps keep showing the built-in warnings meanwhile. */
export async function getLiveWarnings() {
  const { data, error } = await supabase.from('app_config')
    .select('video_warning_enabled, video_warning_text, audio_warning_enabled, audio_warning_text').eq('id', true).maybeSingle()
  if (error) {
    if (/_warning_|column|schema cache/i.test(error.message || '')) return { available: false, value: readLiveWarnings(null) }
    throw error
  }
  return { available: true, value: readLiveWarnings(data) }
}

/* Saves both through the existing app_config update policy (Master / Super Admin); anyone else gets a sentence, not a stack trace. */
export async function saveLiveWarnings(form) {
  const checked = checkLiveWarnings(form)
  if (checked.error) throw new Error(checked.error)
  try {
    await updateAppConfig(checked.patch)
  } catch (e) {
    const m = e?.message || ''
    if (/_warning_|column|schema cache/i.test(m)) throw new Error('The live welcome warnings are not installed on this project yet (they need the database update 20261020110000).')
    if (e?.code === 'PGRST116' || /no rows|multiple \(or no\) rows/i.test(m)) throw new Error('Only a Master or Super Admin can change the live welcome warnings.')
    if (/check constraint/i.test(m)) throw new Error('The server refused that text (at most 600 characters each).')
    throw e
  }
}
