import { useEffect, useState } from 'react'
import { Alert, Button, Card, DatePicker, Empty, Input, Segmented, Spin, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import {
  attendanceStatuses,
  statusLabel,
  type AttendanceRosterItem,
  type AttendanceStatus,
} from '@/features/attendance/attendanceApi'
import {
  AttendanceTimes,
  spanDraftsError,
  spanDraftsFrom,
  toApiSpans,
  type SpanDraft,
} from '@/features/attendance/components/AttendanceTimes'
import { useAttendanceDay, useSaveAttendanceDay } from '@/features/attendance/useAttendance'
import { useIsMobile } from '@/hooks/useIsMobile'

const statusOptions = attendanceStatuses.map((status) => ({ value: status, label: statusLabel(status) }))

function isStatus(value: string | number): value is AttendanceStatus {
  return attendanceStatuses.some((status) => status === value)
}

type EmployeeDraft = {
  status: AttendanceStatus
  spans: SpanDraft[]
}

function toDrafts(items: AttendanceRosterItem[]): Record<string, EmployeeDraft> {
  const drafts: Record<string, EmployeeDraft> = {}
  for (const item of items) {
    drafts[item.employee_id] = {
      status: item.status ?? 'present',
      spans: spanDraftsFrom(item.spans),
    }
  }
  return drafts
}

export function AttendancePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [date, setDate] = useState(() => {
    const requested = searchParams.get('date')
    const parsed = requested ? dayjs(requested) : dayjs()
    return parsed.isValid() ? parsed : dayjs()
  })
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, EmployeeDraft>>({})
  const [draftDate, setDraftDate] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const workDate = date.format('YYYY-MM-DD')
  const roster = useAttendanceDay(workDate)
  const saveDay = useSaveAttendanceDay(workDate)

  useEffect(() => {
    if (!roster.data || roster.data.work_date !== workDate) return
    setDrafts(toDrafts(roster.data.items))
    setDraftDate(workDate)
    setFormError(null)
  }, [roster.data, workDate])

  const ready = roster.isSuccess && !roster.isFetching && draftDate === workDate && roster.data.work_date === workDate
  const items = ready && roster.data ? roster.data.items : []
  const visible = items.filter((item) => item.employee_name.toLowerCase().includes(search.trim().toLowerCase()))

  function updateDraft(employeeId: string, update: (draft: EmployeeDraft) => EmployeeDraft) {
    saveDay.reset()
    setFormError(null)
    setDrafts((current) => {
      const draft = current[employeeId]
      if (!draft) return current
      return { ...current, [employeeId]: update(draft) }
    })
  }

  function markAllPresent() {
    saveDay.reset()
    setFormError(null)
    setDrafts((current) => {
      const next: Record<string, EmployeeDraft> = {}
      for (const [employeeId, draft] of Object.entries(current)) {
        next[employeeId] = { ...draft, status: 'present' }
      }
      return next
    })
  }

  function save() {
    if (items.length === 0) return
    for (const item of items) {
      const draft = drafts[item.employee_id]
      if (!draft) return
      const problem = draft.status === 'absent' ? null : spanDraftsError(draft.spans)
      if (problem) {
        setFormError(`${item.employee_name}: ${problem}`)
        return
      }
    }
    saveDay.mutate(
      items.map((item) => {
        const draft = drafts[item.employee_id]
        const absent = draft?.status === 'absent'
        return {
          employee_id: item.employee_id,
          status: draft?.status ?? 'present',
          spans: absent ? [] : toApiSpans(draft?.spans ?? []),
        }
      }),
    )
  }

  function changeDate(value: Dayjs | null) {
    if (!value) return
    setDate(value)
    setFormError(null)
  }

  function setStatus(employeeId: string, value: string | number) {
    if (!isStatus(value)) return
    updateDraft(employeeId, (current) => ({
      ...current,
      status: value,
      spans: value === 'absent' ? [] : current.spans,
    }))
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={3} className="!mb-0">
              Attendance
            </Typography.Title>
            <Typography.Text type="secondary">{date.format('dddd, D MMMM YYYY')}</Typography.Text>
          </div>
          <Button
            type="primary"
            className="w-full sm:w-auto"
            onClick={save}
            loading={saveDay.isPending}
            disabled={!ready || items.length === 0}
          >
            Save
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DatePicker value={date} onChange={changeDate} allowClear={false} className="w-full sm:w-44" />
          <Input
            allowClear
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Button className="w-full sm:w-auto" onClick={() => navigate('/attendance/calendar')}>
            Calendar
          </Button>
          <Button className="w-full sm:ml-auto sm:w-auto" onClick={markAllPresent} disabled={!ready || items.length === 0}>
            Mark all present
          </Button>
        </div>
      </div>
      {roster.isError ? <Alert type="error" title={roster.error.message} showIcon /> : null}
      {formError ? <Alert className="mb-4" type="error" title={formError} showIcon /> : null}
      {saveDay.isError ? <Alert className="mb-4" type="error" title={saveDay.error.message} showIcon /> : null}
      {saveDay.isSuccess ? <Alert className="mb-4" type="success" title="Saved" showIcon /> : null}
      {roster.isPending || roster.isFetching || (roster.isSuccess && draftDate !== workDate) ? <Spin /> : null}
      {ready && visible.length === 0 ? (
        <Empty description={items.length === 0 ? 'No employees yet' : 'No matching employees'} />
      ) : null}
      {ready && visible.length > 0 ? (
        <Card styles={{ body: { padding: 0 } }}>
          {visible.map((item) => {
            const draft = drafts[item.employee_id]
            if (!draft) return null
            return (
              <div
                key={item.employee_id}
                className="flex flex-col gap-3 border-0 border-b border-solid border-neutral-200 p-4 last:border-b-0"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Typography.Text strong>{item.employee_name}</Typography.Text>
                  <Segmented
                    block={isMobile}
                    size={isMobile ? 'small' : 'middle'}
                    options={statusOptions}
                    value={draft.status}
                    onChange={(value) => setStatus(item.employee_id, value)}
                  />
                </div>
                {draft.status === 'absent' ? null : (
                  <AttendanceTimes
                    spans={draft.spans}
                    onChange={(spans) => updateDraft(item.employee_id, (current) => ({ ...current, spans }))}
                  />
                )}
              </div>
            )
          })}
        </Card>
      ) : null}
    </AppShell>
  )
}
