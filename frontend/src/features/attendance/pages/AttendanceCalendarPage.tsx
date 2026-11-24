import { useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Segmented, Select, Spin, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import {
  attendanceStatuses,
  statusLabel,
  type AttendanceRangeItem,
  type AttendanceStatus,
} from '@/features/attendance/attendanceApi'
import { useAttendanceRange } from '@/features/attendance/useAttendance'
import { useIsMobile } from '@/hooks/useIsMobile'

type CalendarView = 'week' | 'month'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const tone: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-800',
  half_day: 'bg-amber-100 text-amber-800',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-blue-100 text-blue-800',
}

function startOfWeek(value: Dayjs): Dayjs {
  const offset = value.day() === 0 ? 6 : value.day() - 1
  return value.subtract(offset, 'day').startOf('day')
}

function periodFor(view: CalendarView, cursor: Dayjs): { start: Dayjs; end: Dayjs } {
  if (view === 'week') {
    const start = startOfWeek(cursor)
    return { start, end: start.add(6, 'day') }
  }
  const start = startOfWeek(cursor.startOf('month'))
  const end = startOfWeek(cursor.endOf('month')).add(6, 'day')
  return { start, end }
}

function daysBetween(start: Dayjs, end: Dayjs): Dayjs[] {
  const days: Dayjs[] = []
  let cursor = start
  while (!cursor.isAfter(end, 'day')) {
    days.push(cursor)
    cursor = cursor.add(1, 'day')
  }
  return days
}

function markOn(item: AttendanceRangeItem, date: string) {
  return item.days.find((day) => day.work_date === date) ?? null
}

function formatSpans(item: AttendanceRangeItem, date: string): string | null {
  const mark = markOn(item, date)
  if (!mark || mark.spans.length === 0) return null
  return mark.spans
    .map((span) => `${span.in_time.slice(0, 5)}–${span.out_time ? span.out_time.slice(0, 5) : '…'}`)
    .join(', ')
}

function periodLabel(view: CalendarView, cursor: Dayjs): string {
  if (view === 'month') return cursor.format('MMMM YYYY')
  const start = startOfWeek(cursor)
  const end = start.add(6, 'day')
  if (start.month() === end.month()) return `${start.format('D')}–${end.format('D MMM YYYY')}`
  return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`
}

function summary(person: AttendanceRangeItem, days: Dayjs[]): string {
  const counts = new Map<AttendanceStatus | 'none', number>()
  for (const day of days) {
    const mark = markOn(person, day.format('YYYY-MM-DD'))
    const key = mark?.status ?? 'none'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const parts = attendanceStatuses
    .filter((status) => (counts.get(status) ?? 0) > 0)
    .map((status) => `${counts.get(status)} ${statusLabel(status).toLowerCase()}`)
  const unmarked = counts.get('none') ?? 0
  if (unmarked > 0) parts.push(`${unmarked} not marked`)
  return parts.join(' · ')
}

export function AttendanceCalendarPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [view, setView] = useState<CalendarView>('week')
  const [cursor, setCursor] = useState(() => dayjs())
  const [selected, setSelected] = useState(() => dayjs())
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const period = periodFor(view, cursor)
  const start = period.start.format('YYYY-MM-DD')
  const end = period.end.format('YYYY-MM-DD')
  const range = useAttendanceRange(start, end)
  const days = daysBetween(period.start, period.end)
  const items = range.data?.start === start && range.data.end === end ? range.data.items : []
  const person = items.find((item) => item.employee_id === employeeId) ?? null
  const focusDays = view === 'week' ? days : days.filter((day) => day.isSame(cursor, 'month'))
  const selectedDate = selected.format('YYYY-MM-DD')

  useEffect(() => {
    if (items.length === 0) return
    if (employeeId && items.some((item) => item.employee_id === employeeId)) return
    setEmployeeId(items[0].employee_id)
  }, [items, employeeId])

  function chooseView(value: string | number) {
    if (value !== 'week' && value !== 'month') return
    setView(value)
    setCursor(selected)
  }

  function move(step: number) {
    const next = view === 'week' ? cursor.add(step, 'week') : cursor.add(step, 'month')
    setCursor(next)
    setSelected(view === 'week' ? startOfWeek(next) : next.startOf('month'))
  }

  function openDay(date: Dayjs) {
    navigate(`/attendance?date=${date.format('YYYY-MM-DD')}`)
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={3} className="!mb-0">
              Calendar
            </Typography.Title>
            <Typography.Text type="secondary">
              {person ? `${person.employee_name} · ${periodLabel(view, cursor)}` : periodLabel(view, cursor)}
            </Typography.Text>
          </div>
          <Segmented
            block={isMobile}
            options={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
            value={view}
            onChange={chooseView}
          />
        </div>
        <Select
          showSearch
          optionFilterProp="label"
          className="w-full sm:max-w-xs"
          placeholder="Choose a person"
          value={person ? person.employee_id : undefined}
          options={items.map((item) => ({ value: item.employee_id, label: item.employee_name }))}
          onChange={setEmployeeId}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={() => move(-1)}>
            Previous
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => move(1)}>
            Next
          </Button>
          <Button className="w-full sm:ml-auto sm:w-auto" type="primary" onClick={() => openDay(selected)}>
            Open day
          </Button>
        </div>
      </div>
      {range.isError ? <Alert type="error" title={range.error.message} showIcon /> : null}
      {range.isPending || range.isFetching ? <Spin /> : null}
      {range.isSuccess && !range.isFetching && items.length === 0 ? <Empty description="No employees yet" /> : null}
      {person ? (
        <Typography.Paragraph type="secondary" className="!mb-4">
          {summary(person, focusDays)}
        </Typography.Paragraph>
      ) : null}
      {person && view === 'week' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          {days.map((day) => {
            const date = day.format('YYYY-MM-DD')
            const mark = markOn(person, date)
            const times = formatSpans(person, date)
            const active = day.isSame(selected, 'day')
            return (
              <Card
                key={date}
                size="small"
                className={active ? 'border-blue-500' : undefined}
                hoverable
                onClick={() => setSelected(day)}
              >
                <Typography.Text type="secondary">{day.format('ddd')}</Typography.Text>
                <div className="text-base font-medium">{day.format('D MMM')}</div>
                <div className="mt-2">
                  <span className={`inline-block rounded px-2 py-1 text-xs ${mark ? tone[mark.status] : 'bg-neutral-100 text-neutral-500'}`}>
                    {mark ? statusLabel(mark.status) : 'Not marked'}
                  </span>
                </div>
                {times ? <div className="mt-2 text-sm text-neutral-600">{times}</div> : null}
              </Card>
            )
          })}
        </div>
      ) : null}
      {person && view === 'month' ? (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {weekDays.map((label) => (
                <div key={label} className="text-center text-xs text-neutral-500">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const date = day.format('YYYY-MM-DD')
                const mark = markOn(person, date)
                const active = day.isSame(selected, 'day')
                const inMonth = day.isSame(cursor, 'month')
                return (
                  <button
                    key={date}
                    type="button"
                    className={`flex h-12 cursor-pointer items-center justify-center rounded-md border border-solid text-sm ${active ? 'border-blue-500' : 'border-transparent'} ${mark ? tone[mark.status] : 'bg-white text-neutral-700'} ${inMonth ? '' : 'opacity-40'}`}
                    onClick={() => setSelected(day)}
                  >
                    {day.format('D')}
                  </button>
                )
              })}
            </div>
          </div>
          <Card size="small" title={selected.format('dddd, D MMM')}>
            {(() => {
              const mark = markOn(person, selectedDate)
              const times = formatSpans(person, selectedDate)
              return (
                <div className="flex flex-col gap-2">
                  <span className={`w-fit rounded px-2 py-1 text-xs ${mark ? tone[mark.status] : 'bg-neutral-100 text-neutral-500'}`}>
                    {mark ? statusLabel(mark.status) : 'Not marked'}
                  </span>
                  {times ? <Typography.Text>{times}</Typography.Text> : <Typography.Text type="secondary">No times</Typography.Text>}
                </div>
              )
            })()}
          </Card>
        </div>
      ) : null}
    </AppShell>
  )
}
