import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import { AgentLogPage } from './pages/AgentLogPage/AgentLogPage'
import { CaseDetailPage } from './pages/CaseDetailPage/CaseDetailPage'
import { CreateWorkPage } from './pages/CreateWorkPage/CreateWorkPage'
import { DashboardPage } from './pages/DashboardPage/DashboardPage'
import { DocumentListPage } from './pages/DocumentListPage/DocumentListPage'
import { LinkExpiredPage } from './pages/LinkExpiredPage/LinkExpiredPage'
import { LinkRequestPage } from './pages/LinkRequestPage/LinkRequestPage'
import { LinkUploadPage } from './pages/LinkUploadPage/LinkUploadPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ReviewWorkPage } from './pages/ReviewWorkPage/ReviewWorkPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { SignupPage } from './pages/SignupPage/SignupPage'
import { WorkerListPage } from './pages/WorkerListPage/WorkerListPage'
import { WorkListPage } from './pages/WorkListPage/WorkListPage'

const REPO = 'https://github.com/fowoco/client/issues'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage />, errorElement: <NotFoundPage /> },
  { path: '/signup', element: <SignupPage />, errorElement: <NotFoundPage /> },
  {
    element: <RequireAuth />,
    errorElement: <NotFoundPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/workers', element: <WorkerListPage /> },
          { path: '/workers/:workerId', element: <WorkerListPage /> },
          { path: '/documents', element: <DocumentListPage /> },
          { path: '/tasks', element: <WorkListPage /> },
          { path: '/tasks/new', element: <CreateWorkPage /> },
          { path: '/tasks/new/review', element: <ReviewWorkPage /> },
          { path: '/tasks/:caseId', element: <CaseDetailPage /> },
          { path: '/agent', element: <AgentLogPage /> },
          {
            path: '/tickets',
            element: <PlaceholderPage title="티켓 관리" issueUrl={`${REPO}/1`} />,
          },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '/worker-portal', element: <LinkRequestPage /> },
  { path: '/worker-portal/upload', element: <LinkUploadPage /> },
  { path: '/worker-portal/expired', element: <LinkExpiredPage /> },
  { path: '*', element: <NotFoundPage /> },
])
