import { reassignClientAction } from '@/app/(dashboard)/clients/actions'

export function ClientAssignedTo({
  clientId,
  currentAssignedTo,
  roster,
}: {
  clientId: string
  currentAssignedTo: string | null
  roster: { id: string; name: string; role: string }[]
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <label className="text-[10px] uppercase font-mono tracking-wide text-ink-soft">
        Assigned To
      </label>
      <form action={reassignClientAction} className="flex items-center gap-2">
        <input type="hidden" name="client_id" value={clientId} />
        <select
          name="assigned_to"
          defaultValue={currentAssignedTo || ''}
          className="text-xs bg-paper border border-stone-line rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-bronze"
        >
          <option value="" disabled>
            Select Staff
          </option>
          {roster.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name} ({tm.role})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-[10px] uppercase font-mono bg-stone-line/50 hover:bg-stone-line/80 px-2 py-1 rounded transition-colors"
        >
          Save
        </button>
      </form>
    </div>
  )
}
