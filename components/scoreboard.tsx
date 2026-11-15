"use client"

import { useMemo, useState } from "react"
import { ArrowDownToLine, ChevronDown, CircleHelp, Columns3, Plus, Radio, Settings2, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type Probability = { label: string; probability: number }
export type ScoreEvent = {
  id: string
  timestamp?: string
  speaker: { id: string; label: string; confidence?: number; probabilities?: Probability[] }
  brutality_score?: { id: string; label: string; confidence?: number; probabilities?: Probability[]; expectedScore?: number }
  [key: string]: unknown
}
type ScoreColumn = { key: string; label: string; visible: boolean }
type ScoreboardProps = {
  rows?: ScoreEvent[]
  title?: string
  humanLabel?: string
  aiLabel?: string
  columns?: ScoreColumn[]
  onRowsChange?: (rows: ScoreEvent[]) => void
  onColumnsChange?: (columns: ScoreColumn[]) => void
}

const INITIAL_COLUMNS: ScoreColumn[] = [
  { key: "id", label: "Event ID", visible: true },
  { key: "timestamp", label: "Timestamp", visible: true },
  { key: "speaker", label: "Opponent", visible: true },
  { key: "brutality_score", label: "Score", visible: true },
  { key: "confidence", label: "Confidence", visible: true },
  { key: "turn_notes", label: "Turn notes", visible: true },
]

function percent(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return `${(value * 100).toFixed(1)}%`
}

function valueFor(row: ScoreEvent, key: string): unknown {
  if (key === "speaker") return row.speaker?.label ?? "Unknown"
  if (key === "brutality_score") return row.brutality_score?.label ?? "—"
  if (key === "confidence") return percent(row.speaker?.confidence)
  if (key === "turn_notes") return row.turn_notes ?? row.notes ?? "—"
  const value = row[key]
  if (value && typeof value === "object") return JSON.stringify(value)
  return value ?? "—"
}

export function Scoreboard({
  rows: incomingRows = [],
  title = "Live head-to-head",
  humanLabel: initialHumanLabel = "The Human",
  aiLabel: initialAiLabel = "The AI",
  columns: incomingColumns,
  onRowsChange,
  onColumnsChange,
}: ScoreboardProps) {
  const [addedRows, setAddedRows] = useState<ScoreEvent[]>([])
  const [columnsState, setColumnsState] = useState(incomingColumns ?? INITIAL_COLUMNS)
  const [humanLabel, setHumanLabel] = useState(initialHumanLabel)
  const [aiLabel, setAiLabel] = useState(initialAiLabel)
  const [jsonText, setJsonText] = useState("")
  const [rowError, setRowError] = useState("")
  const [newKey, setNewKey] = useState("")
  const [newColumnLabel, setNewColumnLabel] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)

  const rows = useMemo(() => [...incomingRows, ...addedRows], [incomingRows, addedRows])
  const columns = incomingColumns ?? columnsState
  const visibleColumns = columns.filter((column) => column.visible)
  const setColumns = (next: ScoreColumn[]) => {
    setColumnsState(next)
    onColumnsChange?.(next)
  }
  const normalizeLabel = (label: string) => label.trim().replace(/[_-]+/g, " ").replace(/\\s+/g, " ").toLocaleLowerCase()
  const labelFor = (speaker: string) => normalizeLabel(speaker) === normalizeLabel(initialHumanLabel) || normalizeLabel(speaker) === normalizeLabel(humanLabel) ? humanLabel : normalizeLabel(speaker) === normalizeLabel(initialAiLabel) || normalizeLabel(speaker) === normalizeLabel(aiLabel) ? aiLabel : speaker

  const summaries = useMemo(() => {
    return [humanLabel, aiLabel].map((label) => {
      const entries = rows.filter((row) => labelFor(row.speaker?.label ?? "") === label)
      const total = entries.reduce((sum, row) => {
        const score = Number(row.brutality_score?.label)
        return sum + (Number.isFinite(score) ? score : 0)
      }, 0)
      return { label, total, count: entries.filter((row) => row.brutality_score?.label !== undefined).length, average: entries.length ? total / entries.length : 0 }
    })
  }, [rows, humanLabel, aiLabel, initialHumanLabel, initialAiLabel])

  const receiveRow = () => {
    setRowError("")
    try {
      const parsed: unknown = JSON.parse(jsonText)
      const parsedRows = Array.isArray(parsed) ? parsed : [parsed]
      if (!parsedRows.length || parsedRows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
        throw new Error("Enter a JSON object or an array of row objects.")
      }
      const normalized = parsedRows.map((row, index) => {
        const item = row as Record<string, unknown>
        const speaker = item.speaker && typeof item.speaker === "object" ? item.speaker as Record<string, unknown> : null
        const score = item.brutality_score && typeof item.brutality_score === "object" ? item.brutality_score as Record<string, unknown> : null
        if (!speaker || typeof speaker.label !== "string") throw new Error("Each row needs a speaker.label.")
        return {
          ...item,
          id: String(item.id ?? `${Date.now()}-${index}`),
          speaker: { ...speaker, id: String(speaker.id ?? "speaker"), label: speaker.label },
          ...(score ? { brutality_score: { ...score, id: String(score.id ?? "score"), label: String(score.label ?? "0") } } : {}),
        } as ScoreEvent
      })
      const next = [...addedRows, ...normalized]
      setAddedRows(next)
      onRowsChange?.([...incomingRows, ...next])
      setJsonText("")
    } catch (error) {
      setRowError(error instanceof Error ? error.message : "Invalid JSON row.")
    }
  }

  const addColumn = () => {
    const key = newKey.trim().replace(/\s+/g, "_")
    const label = newColumnLabel.trim()
    if (!key || !label || columns.some((column) => column.key === key)) return
    setColumns([...columns, { key, label, visible: true }])
    setNewKey("")
    setNewColumnLabel("")
  }

  return (
    <main className="scoreboard-shell">
      <Card className="scoreboard-card">
        <CardHeader className="scoreboard-header">
          <div className="scoreboard-heading">
            <div className="eyebrow"><span className="live-dot" /> Live score feed</div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Event-by-event scoring, probability and confidence — updated as rows arrive.</CardDescription>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}><Settings2 data-icon="inline-start" /> Customize</DialogTrigger>
            <DialogContent className="settings-dialog">
              <DialogHeader><DialogTitle>Scoreboard settings</DialogTitle><DialogDescription>Rename opponents and control the columns shown in the feed.</DialogDescription></DialogHeader>
              <div className="settings-fields">
                <div className="field"><Label htmlFor="human-label">Human label</Label><Input id="human-label" value={humanLabel} onChange={(event) => setHumanLabel(event.target.value)} /></div>
                <div className="field"><Label htmlFor="ai-label">AI label</Label><Input id="ai-label" value={aiLabel} onChange={(event) => setAiLabel(event.target.value)} /></div>
              </div>
              <Separator />
              <div className="columns-title"><div><strong>Table columns</strong><span>Show, rename, or remove fields.</span></div><Columns3 /></div>
              <div className="column-list">{columns.map((column) => <div className="column-config" key={column.key}>
                <label className="column-toggle"><input type="checkbox" checked={column.visible} onChange={(event) => setColumns(columns.map((item) => item.key === column.key ? { ...item, visible: event.target.checked } : item))} /><Input aria-label={`Label for ${column.key}`} value={column.label} onChange={(event) => setColumns(columns.map((item) => item.key === column.key ? { ...item, label: event.target.value } : item))} /></label>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${column.label} column`} onClick={() => setColumns(columns.filter((item) => item.key !== column.key))}><Trash2 /></Button>
              </div>)}</div>
              <div className="add-column-form"><Input aria-label="Column key" placeholder="JSON key e.g. round" value={newKey} onChange={(event) => setNewKey(event.target.value)} /><Input aria-label="Column label" placeholder="Column label" value={newColumnLabel} onChange={(event) => setNewColumnLabel(event.target.value)} /><Button size="icon" aria-label="Add column" onClick={addColumn}><Plus /></Button></div>
              <DialogFooter><Button onClick={() => setSettingsOpen(false)}>Done</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="scoreboard-content">
          <section className="score-summary" aria-label="Opponent score summary">
            {summaries.map((summary, index) => <article className={`opponent-summary ${index === 1 ? "ai-summary" : "human-summary"}`} key={summary.label}>
              <div className="opponent-top"><span className="opponent-marker" />{summary.label}<Badge variant="outline">{summary.count} {summary.count === 1 ? "event" : "events"}</Badge></div>
              <div className="score-value">{summary.total}<span>pts</span></div>
              <div className="score-meta"><span>Total score</span><span>Average <strong>{summary.average.toFixed(2)}</strong></span></div>
              <div className="score-track"><span style={{ width: `${Math.min(100, Math.max(0, summary.total / Math.max(1, ...summaries.map((item) => item.total)) * 100))}%` }} /></div>
            </article>)}
          </section>

          <section className="probability-section" aria-label="Latest opponent probabilities">
            <div className="section-label"><span>Latest probabilities</span><span>Per event</span></div>
            <div className="probability-grid">{[humanLabel, aiLabel].map((label) => {
              const latest = [...rows].reverse().find((row) => row.speaker?.label === label || labelFor(row.speaker?.label ?? "") === label)
              const p = latest?.speaker?.probabilities?.find((item) => item.label === label || labelFor(item.label) === label)?.probability
              return <div className="probability-item" key={label}><div className="probability-label"><span>{label}</span><strong>{percent(p)}</strong></div><div className="probability-track"><span style={{ width: `${Math.max(0, Math.min(100, (p ?? 0) * 100))}%` }} /></div></div>
            })}</div>
            {!rows.length && <p className="probability-empty">Probabilities will appear when the first scored row arrives.</p>}
          </section>

          <div className="feed-toolbar"><div><div className="feed-title">Event feed <Badge variant="secondary">{rows.length}</Badge></div><p>New JSON rows roll into the totals automatically.</p></div><Badge className="connection-badge"><Radio data-icon="inline-start" /> Listening for rows</Badge></div>
          <div className="table-wrap"><Table>
            <TableHeader><TableRow>{visibleColumns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{rows.map((row, index) => <TableRow key={row.id || index}>{visibleColumns.map((column) => {
              const value = valueFor(row, column.key)
              if (column.key === "speaker") return <TableCell key={column.key}><Badge variant={labelFor(row.speaker.label) === humanLabel ? "secondary" : "outline"} className={`speaker-chip ${labelFor(row.speaker.label) === aiLabel ? "ai-chip" : "human-chip"}`}>{labelFor(row.speaker.label)}</Badge></TableCell>
              if (column.key === "brutality_score") return <TableCell className="score-cell" key={column.key}>{String(value)}</TableCell>
              if (column.key === "confidence") return <TableCell key={column.key}><span className="confidence-value">{percent(row.brutality_score?.confidence ?? row.speaker.confidence)}</span></TableCell>
              return <TableCell key={column.key} className={column.key === "id" ? "event-id" : ""}>{String(value)}</TableCell>
            })}</TableRow>)}
              {!rows.length && <TableRow><TableCell colSpan={Math.max(1, visibleColumns.length)}><div className="empty-feed"><div className="empty-icon"><ArrowDownToLine /></div><strong>No score rows yet</strong><span>Your scoreboard starts at zero. Incoming opponent rows will appear here.</span></div></TableCell></TableRow>}
            </TableBody>
          </Table></div>
          <section className="ingest-panel">
            <div className="ingest-heading"><div className="ingest-icon"><Upload /></div><div><strong>Receive score rows</strong><p>Paste one event object or an array of event objects in the incoming JSON shape.</p></div><CircleHelp className="help-icon" aria-hidden="true" /></div>
            <Textarea aria-label="Incoming score row JSON" placeholder={'{\n  "speaker": { "id": "speaker", "label": "The_Human", "confidence": 0.84, "probabilities": [...] },\n  "brutality_score": { "id": "brutality_score", "label": "1", "expectedScore": 2.19 }\n}'} value={jsonText} onChange={(event) => setJsonText(event.target.value)} className="json-input" />
            {rowError && <p role="alert" className="row-error">{rowError}</p>}
            <div className="ingest-footer"><span>Rows are parsed as received; absent score values count as zero.</span><Button onClick={receiveRow} disabled={!jsonText.trim()}><Upload data-icon="inline-start" /> Add incoming rows</Button></div>
          </section>
          <p className="embed-note">Designed to sit above or below your orb. Pass rows directly to <code>&lt;Scoreboard rows=&#123;events&#125; /&gt;</code> for live parent-driven updates.</p>
        </CardContent>
      </Card>
    </main>
  )
}
