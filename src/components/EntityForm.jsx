import { useState } from 'react'
import { Drawer, Button, useToast } from './ui.jsx'

/* Schema-driven form rendered inside a Drawer.
   fields: [{ name, label, type: text|email|number|select|textarea|toggle, options?, required?, hint?, full?, placeholder? }] */
export default function EntityForm({ title, fields, initial = {}, onClose, submitLabel = 'Save', savedMessage }) {
  const [values, setValues] = useState(() => {
    const v = { ...initial }
    fields.forEach((f) => { if (v[f.name] === undefined) v[f.name] = f.type === 'toggle' ? false : '' })
    return v
  })
  const toast = useToast()
  const set = (n, val) => setValues((s) => ({ ...s, [n]: val }))

  const submit = () => {
    toast(savedMessage || `${title.replace(/^Add |^Edit /, '')} saved`)
    onClose()
  }

  return (
    <Drawer
      title={title}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={submit}>{submitLabel}</Button>
      </>}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <div className={`field${f.full ? ' full' : ''}`} key={f.name}>
            {f.type !== 'toggle' && (
              <label>{f.label} {f.required && <span className="req">*</span>}</label>
            )}
            {f.type === 'select' ? (
              <select className="select" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">Select…</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
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
