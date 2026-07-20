import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { CreateWorkPage } from './pages/CreateWorkPage/CreateWorkPage'
import { DashboardPage } from './pages/DashboardPage/DashboardPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { WorkListPage } from './pages/WorkListPage/WorkListPage'

const REPO = 'https://github.com/fowoco/client/issues'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      {
        path: '/workers',
        element: <PlaceholderPage title="근로자 목록 관리" issueUrl={`${REPO}/1`} />,
      },
      {
        path: '/workers/:workerId',
        element: (
          <PlaceholderPage title="근로자 상세 / 계약 및 체류 관리" issueUrl={`${REPO}/8`} />
        ),
      },
      {
        path: '/documents',
        element: <PlaceholderPage title="서류관리 / OCR" issueUrl={`${REPO}/1`} />,
      },
      { path: '/tasks', element: <WorkListPage /> },
      { path: '/tasks/new', element: <CreateWorkPage /> },
      {
        path: '/agent',
        element: <PlaceholderPage title="Agent 패널" issueUrl={`${REPO}/1`} />,
      },
      {
        path: '/tickets',
        element: <PlaceholderPage title="티켓 관리" issueUrl={`${REPO}/1`} />,
      },
      {
        path: '/settings',
        element: <PlaceholderPage title="설정" issueUrl={`${REPO}/1`} />,
      },
    ],
  },
  {
    path: '/worker-portal',
    element: <PlaceholderPage title="근로자 모바일 안내" issueUrl={`${REPO}/1`} />,
  },
])
