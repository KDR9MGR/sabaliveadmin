import { useEffect, useState } from 'react'
import EntityForm from './EntityForm.jsx'
import { Drawer } from './ui.jsx'
import { getStaffProfile, updateStaffProfile, updateStaffCredentials } from '../lib/accounts.js'
import { uploadMedia } from '../lib/storage.js'

const PROFILE_KEYS = ['name', 'username', 'phone', 'location', 'bio', 'avatar_url']
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'

/* Master edits another staff account: profile fields via the
   admin_update_staff_profile RPC, then login email / password via the
   admin-update-staff-auth Edge Function — only the parts that changed. */
export default function EditStaffProfile({ account, onClose, onSaved }) {
  const [initial, setInitial] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    getStaffProfile(account.id).then(setInitial).catch((e) => setLoadError(e?.message || 'Could not load this profile'))
  }, [account.id])

  if (!initial) {
    return (
      <Drawer title={`Edit profile — ${account.name}`} onClose={onClose}>
        <div className="muted" style={{ fontSize: 13 }}>{loadError || 'Loading…'}</div>
      </Drawer>
    )
  }

  const save = async (v) => {
    const profileChanged = PROFILE_KEYS.some((k) => (v[k] ?? '') !== (initial[k] ?? ''))
    const newEmail = String(v.email || '').trim().toLowerCase()
    const emailChanged = !!newEmail && newEmail !== String(initial.email || '').toLowerCase()
    const password = v.password || ''

    if (password || v.confirm_password) {
      if (password !== v.confirm_password) throw new Error('Passwords do not match')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
    }
    if (!profileChanged && !emailChanged && !password) throw new Error('No changes to save')

    if (profileChanged) await updateStaffProfile(account.id, v)
    if (emailChanged || password) {
      try {
        await updateStaffCredentials(account.id, { email: emailChanged ? newEmail : undefined, password })
      } catch (e) {
        if (profileChanged) onSaved?.()
        throw new Error(profileChanged ? `Profile saved, but the login change failed: ${e.message}` : e.message)
      }
    }
    onSaved?.()
  }

  return (
    <EntityForm
      title={`Edit profile — ${account.name}`}
      onClose={onClose}
      onSubmit={save}
      savedMessage="Profile updated"
      initial={{ ...initial, bio: initial.bio || '', avatar_url: initial.avatar_url || '', password: '', confirm_password: '' }}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'username', label: 'Username', required: true, hint: '3-30 characters: letters, numbers, underscore (no spaces)' },
        { name: 'email', label: 'Login email', type: 'email', hint: 'Changing this changes how they sign in to the admin panel' },
        { name: 'phone', label: 'Phone' },
        { name: 'location', label: 'Location / Country', required: true },
        { name: 'bio', label: 'Bio', type: 'textarea', full: true },
        { name: 'avatar_url', label: 'Profile photo', type: 'image', full: true, accept: AVATAR_ACCEPT, onUpload: (file) => uploadMedia('avatars', account.id, file) },
        { name: 'password', label: 'New password', type: 'password', hint: 'Leave blank to keep the current password (min 8 characters)' },
        { name: 'confirm_password', label: 'Confirm new password', type: 'password' },
      ]}
    />
  )
}
