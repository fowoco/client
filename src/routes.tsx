import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage/DashboardPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { WorkerListPage } from './pages/WorkerListPage/WorkerListPage'

const REPO = 'https://github.com/fowoco/client/issues'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/workers', element: <WorkerListPage /> },
      {
        path: '/workers/:workerId',
        element: (
          <PlaceholderPage title="근로자 상세 / 계약 및 체류 관리" issueUrl={`${REPO}/8`} />
        ),
      },
      {
        path: '/documents',
        element: <PlaceholderPage title="서류관리 / OCR" issueUrl={`${REPO}/9`} />,
      },
      {
        path: '/tasks',
        element: <PlaceholderPage title="업무 카드 보드" issueUrl={`${REPO}/10`} />,
      },
      {
        path: '/agent',
        element: <PlaceholderPage title="Agent 패널" issueUrl={`${REPO}/11`} />,
      },
      {
        path: '/tickets',
        element: <PlaceholderPage title="티켓 관리" issueUrl={`${REPO}/12`} />,
      },
    ],
  },
  {
    path: '/worker-portal',
    element: <PlaceholderPage title="근로자 모바일 안내" issueUrl={`${REPO}/13`} />,
  },
])
