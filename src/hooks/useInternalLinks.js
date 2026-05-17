import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useInternalLinks(ref) {
  const navigate = useNavigate()

  useEffect(() => {
    const root = ref.current
    if (!root) return undefined

    const onClick = (event) => {
      const anchor = event.target.closest('a[href]')
      if (!anchor || !root.contains(anchor)) return

      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return

      event.preventDefault()
      navigate(href)
    }

    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [navigate, ref])
}
