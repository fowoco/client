import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import styles from './PdfPreviewCanvas.module.css'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

interface PdfPreviewCanvasProps {
  url: string
  title: string
}

export function PdfPreviewCanvas({ url, title }: PdfPreviewCanvasProps) {
  const pagesRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const loadingTask = getDocument(url)
    setStatus('loading')

    async function renderPages() {
      try {
        const pdf = await loadingTask.promise
        const pages = pagesRef.current
        if (cancelled || !pages) return
        pages.replaceChildren()

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return
          const page = await pdf.getPage(pageNumber)
          const viewport = page.getViewport({ scale: 1.45 })
          const canvas = document.createElement('canvas')
          canvas.width = Math.ceil(viewport.width)
          canvas.height = Math.ceil(viewport.height)
          canvas.setAttribute('role', 'img')
          canvas.setAttribute('aria-label', `${title} ${pageNumber}페이지`)
          canvas.className = styles.page
          pages.append(canvas)
          await page.render({ canvas, viewport }).promise
        }

        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void renderPages()
    return () => {
      cancelled = true
      void loadingTask.destroy()
    }
  }, [title, url])

  return (
    <section className={styles.viewer} aria-label={title}>
      {status === 'loading' && <p className={styles.status}>PDF 페이지를 그리는 중입니다.</p>}
      {status === 'error' && (
        <p className={styles.error}>PDF 화면을 그리지 못했습니다. 원본 다운로드를 이용해 주세요.</p>
      )}
      <div ref={pagesRef} className={styles.pages} hidden={status === 'error'} />
    </section>
  )
}
