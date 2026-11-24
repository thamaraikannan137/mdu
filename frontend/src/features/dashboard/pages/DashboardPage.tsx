import { useState } from 'react'
import { Alert, Button, Card, Empty, Input, Spin, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import {
  statusLabel,
  type AttendanceRosterItem,
  type AttendanceSpan,
  type AttendanceStatus,
} from '@/features/attendance/attendanceApi'
import { useAttendanceDay } from '@/features/attendance/useAttendance'
import { useIsMobile } from '@/hooks/useIsMobile'

type AttendanceFilter = AttendanceStatus | 'unmarked'

const tone: Record<AttendanceStatus, string> = {
  present: 'text-green-700',
  half_day: 'text-amber-700',
  absent: 'text-red-700',
  leave: 'text-blue-700',
}

function timesLabel(spans: AttendanceSpan[]): string {
  if (spans.length === 0) return '—'
  return spans
    .map((span) => `${span.in_time.slice(0, 5)}–${span.out_time ? span.out_time.slice(0, 5) : '…'}`)
    .join(', ')
}

function matches(item: AttendanceRosterItem, filter: AttendanceFilter | null, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term && !item.employee_name.toLowerCase().includes(term)) return false
  if (filter === 'unmarked') return item.status === null
  if (filter) return item.status === filter
  return true
}

export function DashboardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const today = dayjs().format('YYYY-MM-DD')
  const roster = useAttendanceDay(today)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AttendanceFilter | null>(null)
  const items = roster.data?.work_date === today ? roster.data.items : []
  const visible = items.filter((item) => matches(item, filter, search))
  const counts = {
    employees: items.length,
    present: items.filter((item) => item.status === 'present').length,
    half_day: items.filter((item) => item.status === 'half_day').length,
    absent: items.filter((item) => item.status === 'absent').length,
    leave: items.filter((item) => item.status === 'leave').length,
    unmarked: items.filter((item) => item.status === null).length,
  }
  const stillIn = items.filter((item) => item.spans.some((span) => span.out_time === null)).map((item) => item.employee_name)

  function toggle(next: AttendanceFilter) {
    setFilter((current) => (current === next ? null : next))
  }

  function openToday() {
    navigate(`/attendance?date=${today}`)
  }

  const stats: { key: AttendanceFilter | 'employees'; label: string; value: number; className?: string }[] = [
    { key: 'employees', label: 'Employees', value: counts.employees },
    { key: 'present', label: 'Present', value: counts.present, className: tone.present },
    { key: 'half_day', label: 'Half day', value: counts.half_day, className: tone.half_day },
    { key: 'absent', label: 'Absent', value: counts.absent, className: tone.absent },
    { key: 'leave', label: 'Leave', value: counts.leave, className: tone.leave },
    { key: 'unmarked', label: 'Not marked', value: counts.unmarked },
  ]

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={3} className="!mb-0">
              Dashboard
            </Typography.Title>
            <Typography.Text type="secondary">{dayjs().format('dddd, D MMMM YYYY')}</Typography.Text>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={() => navigate('/attendance/calendar')}>
              Calendar
            </Button>
            <Button type="primary" className="w-full sm:w-auto" onClick={openToday}>
              Mark attendance
            </Button>
          </div>
        </div>
      </div>
      {roster.isError ? <Alert type="error" title={roster.error.message} showIcon /> : null}
      {roster.isPending || roster.isFetching ? <Spin /> : null}
      {roster.isSuccess && !roster.isFetching && items.length === 0 ? <Empty description="No employees yet" /> : null}
      {roster.isSuccess && !roster.isFetching && items.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {stats.map((stat) => {
              const selected = stat.key !== 'employees' && filter === stat.key
              return (
                <Card
                  key={stat.key}
                  size="small"
                  hoverable={stat.key !== 'employees'}
                  className={selected ? 'border-blue-500' : undefined}
                  onClick={() => {
                    if (stat.key === 'employees') {
                      setFilter(null)
                      return
                    }
                    toggle(stat.key)
                  }}
                >
                  <div className="text-sm text-neutral-500">{stat.label}</div>
                  <div className={`text-2xl font-semibold ${stat.className ?? ''}`}>{stat.value}</div>
                </Card>
              )
            })}
          </div>
          {stillIn.length > 0 ? <Alert type="info" showIcon title={`Still in: ${stillIn.join(', ')}`} /> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Typography.Title level={4} className="!mb-0">
              Today
            </Typography.Title>
            <Input
              allowClear
              placeholder="Search employees"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
          {visible.length === 0 ? <Empty description="No matching employees" /> : null}
          {visible.length > 0 && isMobile ? (
            <div className="flex flex-col gap-3">
              {visible.map((item) => (
                <Card key={item.employee_id} size="small" hoverable onClick={openToday}>
                  <div className="flex items-start justify-between gap-3">
                    <Typography.Text strong>{item.employee_name}</Typography.Text>
                    <Typography.Text className={item.status ? tone[item.status] : undefined}>
                      {item.status ? statusLabel(item.status) : 'Not marked'}
                    </Typography.Text>
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">{timesLabel(item.spans)}</div>
                </Card>
              ))}
            </div>
          ) : null}
          {visible.length > 0 && !isMobile ? (
            <Table
              rowKey="employee_id"
              pagination={false}
              dataSource={visible}
              onRow={() => ({ onClick: openToday, className: 'cursor-pointer' })}
              columns={[
                { title: 'Employee', dataIndex: 'employee_name' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (status: AttendanceStatus | null) => (status ? statusLabel(status) : 'Not marked'),
                },
                {
                  title: 'Times',
                  dataIndex: 'spans',
                  render: (spans: AttendanceSpan[]) => timesLabel(spans),
                },
              ]}
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  )
}
