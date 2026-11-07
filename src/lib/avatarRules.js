/* Own profile photo (Profile page, every panel). Goes to the `avatars` bucket at `<uid>/avatar.<ext>` (the same path the app uses; the bucket's own policy lets
   an account write only inside its own folder, and allows JPEG / PNG / WebP up to 5 MB), then `profiles.avatar_url` is pointed at it. */
export const AVATAR_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

export const avatarExt = (name) => String(name || '').split('.').pop().toLowerCase()

/* null when the file is fine, else the words to show */
export function avatarProblem(file) {
  if (!file) return 'Choose a photo first'
  if (!TYPES[avatarExt(file.name)]) return 'Use a JPG, PNG or WebP photo'
  if (file.size > AVATAR_MAX_BYTES) return `That photo is ${(file.size / 1048576).toFixed(1)} MB; the limit is 5 MB`
  return null
}

export const avatarPath = (uid, file) => `${uid}/avatar.${avatarExt(file.name) === 'jpeg' ? 'jpg' : avatarExt(file.name)}`
export const avatarContentType = (file) => TYPES[avatarExt(file.name)]
/* a new query string so every screen shows the new photo instead of a cached copy of the same address */
export const bustedUrl = (url, now = Date.now()) => `${url}?v=${now}`
