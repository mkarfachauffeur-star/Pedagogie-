import { useLayoutEffect, useMemo, useRef } from 'react'
import { useInternalLinks } from '../hooks/useInternalLinks'

export default function ArchivePage({ html }) {
  const containerRef = useRef(null)
  useInternalLinks(containerRef)
  const safeHtml = useMemo(
    () =>
      html
        .replaceAll('className=', 'class=')
        .replaceAll('classname=', 'class=')
        .replaceAll('htmlFor=', 'for=')
        .replaceAll('strokeWidth=', 'stroke-width=')
        .replaceAll('strokeLinecap=', 'stroke-linecap=')
        .replaceAll('strokeLinejoin=', 'stroke-linejoin=')
        .replaceAll('fillRule=', 'fill-rule=')
        .replaceAll('clipRule=', 'clip-rule='),
    [html],
  )

  useLayoutEffect(() => {
    const root = containerRef.current
    if (!root) return undefined

    root.querySelectorAll('[className], [classname]').forEach((element) => {
      const className =
        element.getAttribute('className') || element.getAttribute('classname')
      element.setAttribute('class', className)
      element.removeAttribute('className')
      element.removeAttribute('classname')
    })

    root.querySelectorAll('.modal, .dialog').forEach((element) => {
      if (
        !element.classList.contains('open') &&
        !element.classList.contains('active')
      ) {
        element.style.display = 'none'
      }
    })

    const replaceWithGraphicCard = (element, label = 'Visuel indisponible') => {
      const card = document.createElement('div')
      card.className = 'pd-replacement-card'
      card.innerHTML = `
        <div class="pd-replacement-icon">🚗</div>
        <div>
          <strong>${label}</strong>
          <span>Remplacé par une carte moderne</span>
        </div>
      `
      element.replaceWith(card)
    }

    root
      .querySelectorAll(
        '.pie-segment, .segment-1, .segment-2, .segment-3, .segment-4',
      )
      .forEach((element) => element.remove())

    root.querySelectorAll('.pie-chart').forEach((element) => {
      element.classList.add('pd-modern-chart-card')
      element.innerHTML = `
        <div class="pd-chart-bars">
          <span style="height: 58%"></span>
          <span style="height: 82%"></span>
          <span style="height: 44%"></span>
          <span style="height: 68%"></span>
        </div>
        <div class="pd-chart-label">Répartition des données</div>
      `
    })

    root.querySelectorAll('img').forEach((image) => {
      const source = image.getAttribute('src')
      if (!source || source === '#') {
        replaceWithGraphicCard(image, 'Image indisponible')
        return
      }

      image.addEventListener(
        'error',
        () => replaceWithGraphicCard(image, 'Image indisponible'),
        { once: true },
      )
    })

    root
      .querySelectorAll('[style*="background: black"], [style*="background:black"]')
      .forEach((element) => {
        element.style.background = 'transparent'
      })

    root
      .querySelectorAll(
        '.header-progress .progress-circle, [classname="header-progress"] [classname="progress-circle"], [classname="progress-circle"]',
      )
      .forEach((element) => {
        if (element.textContent?.trim() === '65%') {
          const replacement = document.createElement('div')
          replacement.className = 'remc-progress-card'
          replacement.innerHTML = `
            <div class="remc-progress-value">65%</div>
            <div class="remc-progress-track"><span style="width: 65%;"></span></div>
          `
          element.replaceWith(replacement)
        } else {
          element.remove()
        }
      })

    return undefined
  }, [safeHtml])

  return (
    <div
      ref={containerRef}
      className="archive-page-content animate-slide-up"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
