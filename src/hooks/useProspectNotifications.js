import { useCallback, useEffect, useState } from 'react'
import { countNewProspects } from '../services/prospects'

const POLL_MS = 15_000

export function useProspectNotifications() {
  const [newCount, setNewCount] = useState(0)

  const refresh = useCallback(async () => {
    const count = await countNewProspects()
    setNewCount(count)
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  return { newCount, refresh }
}
