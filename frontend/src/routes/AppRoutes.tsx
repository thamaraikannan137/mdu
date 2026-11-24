import { Navigate, Route, Routes } from 'react-router-dom'
import { AddAttendancePage } from '@/features/attendance/pages/AddAttendancePage'
import { AttendanceCalendarPage } from '@/features/attendance/pages/AttendanceCalendarPage'
import { AttendancePage } from '@/features/attendance/pages/AttendancePage'
import { AttendanceRecordPage } from '@/features/attendance/pages/AttendanceRecordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { AddEmployeePage } from '@/features/employees/pages/AddEmployeePage'
import { EmployeePage } from '@/features/employees/pages/EmployeePage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'
import { getAccessToken } from '@/services/token'
import { GuestOnly, RequireAuth } from '@/routes/guards'

export function AppRoutes() {
  const home = getAccessToken() ? '/dashboard' : '/login'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/employees"
        element={
          <RequireAuth>
            <EmployeesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/employees/new"
        element={
          <RequireAuth>
            <AddEmployeePage />
          </RequireAuth>
        }
      />
      <Route
        path="/employees/:employeeId"
        element={
          <RequireAuth>
            <EmployeePage />
          </RequireAuth>
        }
      />
      <Route
        path="/attendance"
        element={
          <RequireAuth>
            <AttendancePage />
          </RequireAuth>
        }
      />
      <Route
        path="/attendance/new"
        element={
          <RequireAuth>
            <AddAttendancePage />
          </RequireAuth>
        }
      />
      <Route
        path="/attendance/calendar"
        element={
          <RequireAuth>
            <AttendanceCalendarPage />
          </RequireAuth>
        }
      />
      <Route
        path="/attendance/:attendanceId"
        element={
          <RequireAuth>
            <AttendanceRecordPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}
