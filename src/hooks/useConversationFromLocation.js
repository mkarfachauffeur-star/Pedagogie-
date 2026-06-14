import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useConversationFromLocation(setActiveId) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const conversationId = location.state?.conversationId
    if (!conversationId) return

    setActiveId(conversationId)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.conversationId, navigate, setActiveId])
}
