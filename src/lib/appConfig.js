import { supabase } from './supabase.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }

const NUM = ['coin_to_inr_rate', 'diamond_to_inr_rate', 'platform_fee_percent', 'gst_percent']
const INT = ['min_recharge_inr', 'min_withdrawal_inr', 'min_withdrawal_diamonds']
const BOOL = ['maintenance_mode', 'allow_registrations']

export async function getAppConfig() {
  return unwrap(await supabase.from('app_config').select('*').eq('id', true).single())
}

export async function updateAppConfig(patch) {
  const clean = {}
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'feature_flags') clean[k] = v && typeof v === 'object' ? v : {}
    else if (NUM.includes(k)) clean[k] = v === '' || v == null ? 0 : Number(v)
    else if (INT.includes(k)) clean[k] = v === '' || v == null ? 0 : Math.round(Number(v))
    else if (BOOL.includes(k)) clean[k] = !!v
    else clean[k] = v
  }
  return unwrap(await supabase.from('app_config').update(clean).eq('id', true).select().single())
}
