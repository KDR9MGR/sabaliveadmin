import { useState } from 'react'
import { Drawer, Button, useToast } from './ui.jsx'

/* Schema-driven form rendered inside a Drawer.
   fields: [{ name, label, type: text|email|number|select|textarea|toggle, options?, required?, hint?, full?, placeholder? }]
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
        {fields.map((f) => (
          <div className={`field${f.full ? ' full' : ''}`} key={f.name}>
            {f.type !== 'toggle' && (
              <label>{f.label} {f.required && <span className="req">*</span>}</label>
            )}
            {f.type === 'select' ? (
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
                className="input" type={f.type || 'text'} placeholder={f.placeholder}
                value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}
              />
            )}
            {f.hint && f.type !== 'toggle' && <span className="hint">{f.hint}</span>}
          </div>
        ))}
      </div>
    </Drawer>
  )
}
