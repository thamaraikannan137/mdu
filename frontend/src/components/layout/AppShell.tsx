import { useState, type ReactNode } from 'react'
import { CalendarOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ScheduleOutlined, TeamOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Layout, Menu, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { authKeys } from '@/features/auth/authKeys'
import { useIsMobile } from '@/hooks/useIsMobile'
import { setAccessToken } from '@/services/token'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const selectedKey = location.pathname.startsWith('/attendance/calendar')
    ? '/attendance/calendar'
    : location.pathname.startsWith('/attendance')
      ? '/attendance'
      : location.pathname.startsWith('/employees')
        ? '/employees'
        : '/dashboard'

  function signOut() {
    setAccessToken(null)
    queryClient.removeQueries({ queryKey: authKeys.all })
    navigate('/login', { replace: true })
  }

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      onClick={({ key }) => {
        setMenuOpen(false)
        navigate(key)
      }}
      inlineCollapsed={!isMobile && collapsed}
      items={[
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/employees', icon: <TeamOutlined />, label: 'Employees' },
        { key: '/attendance', icon: <CalendarOutlined />, label: 'Attendance' },
        { key: '/attendance/calendar', icon: <ScheduleOutlined />, label: 'Calendar' },
      ]}
    />
  )

  return (
    <Layout className="min-h-screen">
      {isMobile ? (
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} placement="left" size={220} title="mdu">
          {menu}
        </Drawer>
      ) : (
        <Layout.Sider theme="light" width={220} collapsedWidth={72} collapsed={collapsed}>
          <div className={`flex items-center py-4 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            {collapsed ? null : (
              <Typography.Title level={4} className="!mb-0">
                mdu
              </Typography.Title>
            )}
            <Button
              type="text"
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
            />
          </div>
          {menu}
        </Layout.Sider>
      )}
      <Layout>
        <Layout.Header className="flex items-center gap-3 bg-white px-4 md:px-6">
          {isMobile ? <Button onClick={() => setMenuOpen(true)}>Menu</Button> : null}
          <Button className="ml-auto" onClick={signOut}>
            Sign out
          </Button>
        </Layout.Header>
        <Layout.Content className="p-4 md:p-6">{children}</Layout.Content>
      </Layout>
    </Layout>
  )
}
