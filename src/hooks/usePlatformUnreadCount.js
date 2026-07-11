import { useCallback, useEffect, useState } from 'react'
import { getPlatformUnreadCount } from '../services/platformNotifications'

const POLL_MS = 15_000

export function usePlatformUnreadCount(profileId) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const next = await getPlatformUnreadCount(profileId)
    setCount(next)
  }, [profileId])

  useEffect(() => {
    if (!profileId) {
      setCount(0)
      return undefined
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [profileId, refresh])

  return { count, refresh }
}
