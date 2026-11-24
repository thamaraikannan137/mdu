import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, TimePicker } from 'antd'
import dayjs from 'dayjs'
import type { AttendanceSpan } from '@/features/attendance/attendanceApi'

export type SpanDraft = {
  key: string
  inTime: string | null
  outTime: string | null
}

type AttendanceTimesProps = {
  spans: SpanDraft[]
  onChange: (spans: SpanDraft[]) => void
}

function clock(value: string | null): dayjs.Dayjs | null {
  return value ? dayjs(value, 'HH:mm') : null
}

export function spanDraftsFrom(spans: AttendanceSpan[]): SpanDraft[] {
  return spans.map((span) => ({
    key: crypto.randomUUID(),
    inTime: span.in_time.slice(0, 5),
    outTime: span.out_time ? span.out_time.slice(0, 5) : null,
  }))
}

export function spanDraftsError(spans: SpanDraft[]): string | null {
  const filled = spans.filter((span) => span.inTime || span.outTime)
  for (const span of filled) {
    if (!span.inTime) return 'Enter an in time for every out time'
    if (span.outTime && span.outTime <= span.inTime) return 'Out time must be after in time'
  }
  const ordered = [...filled].sort((left, right) => (left.inTime ?? '').localeCompare(right.inTime ?? ''))
  const seen = new Set<string>()
  let previousEnd: string | null = null
  for (const span of ordered) {
    if (!span.inTime) continue
    if (seen.has(span.inTime)) return 'Each in time can be used once'
    seen.add(span.inTime)
    if (previousEnd && span.inTime < previousEnd) return 'In and out times overlap'
    previousEnd = span.outTime ?? span.inTime
  }
  return null
}

export function toApiSpans(spans: SpanDraft[]): AttendanceSpan[] {
  return spans
    .filter((span): span is SpanDraft & { inTime: string } => Boolean(span.inTime))
    .sort((left, right) => left.inTime.localeCompare(right.inTime))
    .map((span) => ({
      in_time: `${span.inTime}:00`,
      out_time: span.outTime ? `${span.outTime}:00` : null,
    }))
}

export function AttendanceTimes({ spans, onChange }: AttendanceTimesProps) {
  function changeSpan(key: string, patch: Partial<SpanDraft>) {
    onChange(spans.map((span) => (span.key === key ? { ...span, ...patch } : span)))
  }

  return (
    <div className="flex max-w-md flex-col gap-2">
      {spans.map((span) => (
        <div key={span.key} className="flex items-center gap-2">
          <TimePicker
            className="min-w-0 flex-1"
            format="HH:mm"
            needConfirm={false}
            minuteStep={1}
            value={clock(span.inTime)}
            placeholder="In"
            onChange={(value) => changeSpan(span.key, { inTime: value ? value.format('HH:mm') : null })}
          />
          <span className="text-neutral-400">–</span>
          <TimePicker
            className="min-w-0 flex-1"
            format="HH:mm"
            needConfirm={false}
            minuteStep={1}
            value={clock(span.outTime)}
            placeholder="Out"
            onChange={(value) => changeSpan(span.key, { outTime: value ? value.format('HH:mm') : null })}
          />
          <Button
            type="text"
            danger
            aria-label="Remove time"
            icon={<DeleteOutlined />}
            onClick={() => onChange(spans.filter((item) => item.key !== span.key))}
          />
        </div>
      ))}
      <Button
        type="link"
        className="w-fit !px-0"
        icon={<PlusOutlined />}
        onClick={() => onChange([...spans, { key: crypto.randomUUID(), inTime: null, outTime: null }])}
      >
        Add time
      </Button>
    </div>
  )
}
