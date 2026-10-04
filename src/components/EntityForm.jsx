import { useState } from 'react'
import { Drawer, Button, useToast } from './ui.jsx'
import { mediaKind } from '../lib/storage.js'
import SvgaPlayer from './SvgaPlayer.jsx'

/* type: 'image' field — uploads immediately on file pick via f.onUpload(file) =>
   url, then stores the returned URL as the field's value (same as any other
   field). Shows an image/video preview once a value exists; f.accept sets the
   file picker filter (defaults to plain images). */
function ImageUploadField({ value, onChange, onUpload, accept = 'image/*' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onChange(await onUpload(file))
    } catch (err) {
      setError(err?.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }
  const kind = mediaKind(value)
  return (
    <div className="vstack" style={{ gap: 8 }}>
      {value && kind === 'video' && (
        <video src={value} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
      )}
      {value && kind === 'image' && (
        <img src={value} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
      )}
      {value && kind === 'svga' && (
        <div style={{ display: 'grid', placeItems: 'center', background: 'var(--surface-2, #0001)', borderRadius: 8, padding: 8 }}>
          <SvgaPlayer url={value} size={140} fallback={<span className="muted" style={{ fontSize: 12.5 }}>SVGA uploaded (preview unavailable).</span>} />
        </div>
      )}
      {value && kind === 'other' && (
        <div className="muted" style={{ fontSize: 12.5 }}>File uploaded (no in-browser preview for this format).</div>
      )}
      <label className="btn" style={{ cursor: busy ? 'default' : 'pointer', textAlign: 'center' }}>
        {busy ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}
        <input type="file" accept={accept} onChange={pick} disabled={busy} style={{ display: 'none' }} />
      </label>
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
    </div>
  )
}

/* Schema-driven form rendered inside a Drawer.
   fields: [{ name, label, type: text|email|number|select|textarea|toggle|image, options?, required?, hint?, full?, placeholder?, autoComplete?, onUpload? }]
   type: 'image' needs onUpload: (file) => Promise<url>.
   onSubmit(values): optional async persister. If given, its result drives success/error;
   without it the form just toasts (used by screens still on mock data). */
export default function EntityForm({ title, fields, initial = {}, onClose, onSubmit, onChange, submitLabel = 'Save', savedMessage }) {
  const [values, setValues] = useState(() => {
    const v = { ...initial }
    fields.forEach((f) => { if (v[f.name] === undefined) v[f.name] = f.type === 'toggle' ? false : '' })
    return v
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (n, val) => { setValues((s) => ({ ...s, [n]: val })); onChange?.(n, val) }

  const submit = async () => {
    setError('')
    const missing = fields.find((f) => f.required && !String(values[f.name] ?? '').trim())
    if (missing) { setError(`${missing.label} is required`); return }
    if (!onSubmit) {
      toast(savedMessage || `${title.replace(/^Add |^Edit /, '')} saved`)
      onClose()
      return
    }
    setBusy(true)
    try {
      await onSubmit(values)
      toast(savedMessage || 'Saved')
      onClose()
    } catch (e) {
      setError(e?.message || 'Could not save — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      title={title}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'check'} onClick={submit} disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </>}
    >
      {error && (
        <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>
      )}
      <div className="form-grid">
        {fields.map((f) => (f.type === 'section' ? (
          <div className="field full" key={f.name}>
            <h4 style={{ margin: '10px 0 0', fontSize: 13.5 }}>{f.label}</h4>
            {f.hint && <span className="hint">{f.hint}</span>}
          </div>
        ) : (
          <div className={`field${f.full ? ' full' : ''}`} key={f.name}>
            {f.type !== 'toggle' && (
              <label>{f.label} {f.required && <span className="req">*</span>}</label>
            )}
            {f.type === 'image' ? (
              <ImageUploadField value={values[f.name]} onChange={(url) => set(f.name, url)} onUpload={f.onUpload} accept={f.accept} />
            ) : f.type === 'select' ? (
              <select className="select" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">Select…</option>
                {f.options.map((o) => {
                  const val = typeof o === 'object' ? o.value : o
                  const lbl = typeof o === 'object' ? o.label : o
                  return <option key={val} value={val}>{lbl}</option>
                })}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea className="textarea" placeholder={f.placeholder} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === 'toggle' ? (
              <div className="toggle-row" style={{ padding: 0, border: 0 }}>
                <div>
                  <div className="t-title">{f.label}</div>
                  {f.hint && <div className="t-desc">{f.hint}</div>}
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                  <span className="track" /><span className="thumb" />
                </label>
              </div>
            ) : (
              <input
                className="input" type={f.type || 'text'} placeholder={f.placeholder} autoComplete={f.autoComplete}
                value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}
              />
            )}
            {f.hint && f.type !== 'toggle' && <span className="hint">{f.hint}</span>}
          </div>
        )))}
      </div>
    </Drawer>
  )
}
