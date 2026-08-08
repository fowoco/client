import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkerImportResponse } from '../../api/workerImports'
import { OnboardingImportPage } from './OnboardingImportPage'
import { isOnboardingImportPending, markOnboardingImportPending } from './onboardingImportStorage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

const UPLOADED: WorkerImportResponse = {
  import_id: 'import-1',
  source_file_id: 'file-1',
  status: 'UPLOADED',
  source_headers: ['이름', '국적', '체류만료일'],
  mappings: {},
  total_rows: 2,
  valid_rows: 0,
  invalid_rows: 0,
  excluded_rows: 0,
  committed_rows: 0,
  source_file_expires_at: '2026-08-16T00:00:00Z',
  version: 0,
  rows: [],
  page: 0,
  size: 100,
}

const MAPPED: WorkerImportResponse = {
  ...UPLOADED,
  status: 'MAPPED',
  mappings: {
    이름: 'display_name',
    국적: 'nationality_code',
    체류만료일: 'stay_expiry_date',
  },
  version: 1,
}

const REVIEW_REQUIRED: WorkerImportResponse = {
  ...MAPPED,
  status: 'REVIEW_REQUIRED',
  valid_rows: 1,
  invalid_rows: 1,
  version: 2,
  rows: [
    {
      row_number: 2,
      source_values: { 이름: '응웬반A', 국적: 'VN', 체류만료일: '2026-10-10' },
      override_values: {},
      normalized_values: {
        display_name: '응웬반A',
        nationality_code: 'VN',
        stay_expiry_date: '2026-10-10',
      },
      status: 'VALID',
      errors: [],
      worker_id: null,
      version: 1,
    },
    {
      row_number: 3,
      source_values: { 이름: '쩐티B', 국적: 'VN', 체류만료일: '2026/11/01' },
      override_values: {},
      normalized_values: {
        display_name: '쩐티B',
        nationality_code: 'VN',
        stay_expiry_date: '2026/11/01',
      },
      status: 'INVALID',
      errors: [
        {
          field: 'stay_expiry_date',
          code: 'INVALID_DATE',
          message: '날짜는 YYYY-MM-DD 형식이어야 합니다.',
        },
      ],
      worker_id: null,
      version: 1,
    },
  ],
}

const PATCHED: WorkerImportResponse = {
  ...REVIEW_REQUIRED,
  status: 'MAPPED',
  valid_rows: 1,
  invalid_rows: 0,
  excluded_rows: 1,
  version: 3,
}

const READY: WorkerImportResponse = {
  ...PATCHED,
  status: 'READY',
  version: 4,
  rows: [REVIEW_REQUIRED.rows[0], { ...REVIEW_REQUIRED.rows[1], status: 'EXCLUDED', errors: [] }],
}

const COMMITTED: WorkerImportResponse = {
  ...READY,
  status: 'COMMITTED',
  valid_rows: 0,
  committed_rows: 1,
  version: 5,
  rows: [{ ...READY.rows[0], status: 'COMMITTED', worker_id: 'worker-1' }, READY.rows[1]],
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/onboarding/import']}>
      <Routes>
        <Route path="/onboarding/import" element={<OnboardingImportPage />} />
        <Route path="/dashboard" element={<p>dashboard screen</p>} />
        <Route path="/workers" element={<p>workers screen</p>} />
        <Route path="/tasks/new" element={<p>new task screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function moveToUpload(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /기존 데이터 이전/ }))
  await user.click(screen.getByRole('button', { name: '다음 →' }))
}

beforeEach(() => {
  markOnboardingImportPending()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OnboardingImportPage', () => {
  it('renders the three start options with "다음" disabled until one is chosen', async () => {
    const user = userEvent.setup()
    renderPage()

    const next = screen.getByRole('button', { name: '다음 →' })
    expect(next).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /직접 입력/ }))
    expect(next).toBeEnabled()
  })

  it('clears the pending flag and goes straight to the dashboard when "나중에 설정" is chosen', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /나중에 설정/ }))
    await user.click(screen.getByRole('button', { name: '다음 →' }))

    expect(await screen.findByText('dashboard screen')).toBeInTheDocument()
    expect(isOnboardingImportPending()).toBe(false)
  })

  it('sends "직접 입력" to the worker list instead of the import flow', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /직접 입력/ }))
    await user.click(screen.getByRole('button', { name: '다음 →' }))

    expect(await screen.findByText('workers screen')).toBeInTheDocument()
  })

  it('connects upload → mapping → validation → exclusion → commit with latest versions', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(UPLOADED, { status: 201 }))
      .mockResolvedValueOnce(jsonResponse(MAPPED))
      .mockResolvedValueOnce(jsonResponse(REVIEW_REQUIRED))
      .mockResolvedValueOnce(jsonResponse(PATCHED))
      .mockResolvedValueOnce(jsonResponse(READY))
      .mockResolvedValueOnce(jsonResponse(COMMITTED))
    const user = userEvent.setup()
    renderPage()
    await moveToUpload(user)

    const file = new File(['이름,국적,체류만료일'], 'workers.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    await user.upload(screen.getByLabelText('근로자 명단 파일'), file)
    await user.click(screen.getByRole('button', { name: '파일 확인 →' }))

    expect(await screen.findByText('파일의 열을 연결해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('3 / 5 · 열 연결')).toBeInTheDocument()
    expect(screen.getByDisplayValue('이름')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '저장하고 행 검증 →' }))

    expect(await screen.findByText('검증 결과를 확인해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('날짜는 YYYY-MM-DD 형식이어야 합니다.')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: '3행 등록 제외' }))
    await user.click(screen.getByRole('button', { name: '수정·제외 저장 후 재검증' }))

    expect(await screen.findByRole('button', { name: '정상 1명 등록 →' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '정상 1명 등록 →' }))

    expect(await screen.findByText('1명 등록을 완료했습니다.')).toBeInTheDocument()

    const calls = vi.mocked(fetch).mock.calls
    expect(calls).toHaveLength(6)
    expect(calls[0][1]?.body).toBeInstanceOf(FormData)
    expect(new Headers(calls[0][1]?.headers).get('Idempotency-Key')).toBeTruthy()
    expect(JSON.parse(calls[1][1]?.body as string)).toMatchObject({ expected_version: 0 })
    expect(JSON.parse(calls[2][1]?.body as string)).toEqual({ expected_version: 1 })
    expect(JSON.parse(calls[3][1]?.body as string)).toEqual({
      expected_version: 2,
      rows: [
        {
          row_number: 3,
          excluded: true,
          values: { stay_expiry_date: '2026/11/01' },
        },
      ],
    })
    expect(JSON.parse(calls[4][1]?.body as string)).toEqual({ expected_version: 3 })
    expect(JSON.parse(calls[5][1]?.body as string)).toEqual({
      expected_version: 4,
      selected_row_numbers: [],
    })
    expect(new Headers(calls[5][1]?.headers).get('Idempotency-Key')).toBeTruthy()
  })

  it('shows the Server upload error and keeps the selected file retryable', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        {
          timestamp: '2026-08-09T00:00:00Z',
          status: 415,
          code: 'IMPORT_FILE_TYPE_UNSUPPORTED',
          message: 'CSV 또는 XLSX 파일만 사용할 수 있습니다.',
          path: '/api/v1/imports',
          request_id: 'request-1',
          field_errors: [],
        },
        { status: 415 },
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await moveToUpload(user)

    const file = new File(['invalid'], 'workers.csv', { type: 'text/csv' })
    await user.upload(screen.getByLabelText('근로자 명단 파일'), file)
    await user.click(screen.getByRole('button', { name: '파일 확인 →' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'CSV 또는 XLSX 파일만 사용할 수 있습니다.',
    )
    expect(screen.getByText('workers.csv')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '파일 확인 →' })).toBeEnabled()
  })

  it('shows step progress in the header', () => {
    renderPage()
    expect(screen.getByText('1 / 5 · 시작 방식')).toBeInTheDocument()
  })
})
