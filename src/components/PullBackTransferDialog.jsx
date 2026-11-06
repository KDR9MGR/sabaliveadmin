import { useState } from 'react'
import { Button, KV, Modal, useToast } from './ui.jsx'
import { pullBackCoinTransfer } from '../lib/coins.js'
import { reasonOk, pullBackSummary, pullBackError } from '../lib/pullBackRules.js'

/* Pull a coin transfer back (history row = { transferId, coins, recipient, from, idShort, note, date }). The coins go from the recipient back to the sender, all or
   nothing; the database refuses when the recipient has already spent them. A reason is required and kept in the ledger note and the audit log; the recipient is
   told by push that an admin reclaimed the coins. */
export default function PullBackTransferDialog({ row, onClose, onDone }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = reasonOk(reason)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await pullBackCoinTransfer(row.transferId, reason.trim())
      toast(`${Number(row.coins).toLocaleString()} coins pulled back from ${row.recipient}`)
      onDone?.()
      onClose()
    } catch (e) {
      setError(pullBackError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Pull back this transfer"
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'coins'} disabled={busy || !ready} onClick={submit}>
          {busy ? 'Pulling back…' : `Pull back ${Number(row.coins).toLocaleString()} coins`}
        </Button>
      </>}
    >
      {error && (
        <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14, whiteSpace: 'normal' }}>{error}</div>
      )}
      <KV rows={[
        ['Ref', <span className="mono">{row.idShort}</span>],
        ['From', row.from || row.by || '—'],
        ['To', row.recipient || '—'],
        ['Coins', <b>{Number(row.coins).toLocaleString()}</b>],
        ['Date', row.date || '—'],
        ['Note', row.note || '—'],
      ]} />
      <div className="hint" style={{ margin: '12px 0 16px' }}>
        {pullBackSummary(row)} It is all or nothing: if the recipient has already spent some of it, nothing moves. A transfer can be pulled back once. The
        recipient is told that an admin reclaimed the coins, and the action is written to the audit log with your name.
      </div>
      <div className="field">
        <label>Reason (internal, at least 3 characters)</label>
        <textarea className="textarea" placeholder="Why — kept in the audit log" value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
      </div>
    </Modal>
  )
}
