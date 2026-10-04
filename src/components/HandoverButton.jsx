import { useState } from 'react'
import { Button, Modal, ConfirmDialog, useToast } from './ui.jsx'
import UserPicker from './UserPicker.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { HANDOVER_ROLES, listSeatHolders, listHandoverTargets, handoverSeat } from '../lib/handover.js'

/* "Hand over to a user" for one kind of panel account (Master only). Pick the
   account whose seat is moving, pick the user taking it, confirm. */
export default function HandoverButton({ role, onDone }) {
  const toast = useToast()
  const label = HANDOVER_ROLES[role]
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const { data: holders } = useAsyncData(() => (open ? listSeatHolders(role) : Promise.resolve([])), [open, role])
  const { data: targets } = useAsyncData(() => (open ? listHandoverTargets() : Promise.resolve([])), [open])

  const close = () => { setOpen(false); setFrom(''); setTo(''); setConfirming(false) }
  const fromOpt = (holders || []).find((h) => h.value === from)
  const toOpt = (targets || []).find((t) => t.value === to)

  const run = async () => {
    setBusy(true)
    try {
      const r = await handoverSeat(from, to)
      toast(`${label} account handed over${r?.coins ? ` · ${Number(r.coins).toLocaleString()} coins moved` : ''}`)
      close()
      onDone?.()
    } catch (e) {
      toast(e.message || 'Could not hand over the account')
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button icon="userCheck" onClick={() => setOpen(true)}>Hand {label} to a user</Button>
      {open && !confirming && (
        <Modal
          title={`Hand a ${label} account to a user`}
          onClose={close}
          footer={<>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={!from || !to} onClick={() => setConfirming(true)}>Continue</Button>
          </>}
        >
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
            The user you choose becomes this {label}, with everything the account owns (the sub admins,
            agencies and hosts under it, and its coin balance). The old account loses the role and becomes a normal user.
          </p>
          <div className="field full">
            <label>{label} account</label>
            <UserPicker options={holders || []} value={from} onChange={setFrom} />
          </div>
          <div className="field full" style={{ marginTop: 12 }}>
            <label>New holder (existing user)</label>
            <UserPicker options={(targets || []).filter((t) => t.value !== from)} value={to} onChange={setTo} />
          </div>
        </Modal>
      )}
      {open && confirming && (
        <ConfirmDialog
          danger
          busy={busy}
          title="Hand over this account?"
          confirmLabel="Hand over"
          message={`${toOpt?.label} will become the ${label} instead of ${fromOpt?.label}, taking everything it owns. Panel accounts can no longer use the Sabalive app, so ${toOpt?.label?.split(' (')[0]} will be signed out of the app. This can't be undone from here.`}
          onConfirm={run}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  )
}
