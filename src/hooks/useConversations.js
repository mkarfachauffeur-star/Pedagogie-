import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listConversations, subscribeToConversationList } from '../services/messaging'
import { subscribeToNotifications } from '../services/notifications'

// Liste des conversations du profil courant, rafraîchie en temps réel à chaque
// nouvelle notification. Retourne [] tant qu'aucune session réelle (mode démo).
export function useConversations() {
  const { profileId } = useAuth()
  const [conversations, setConversations] = useState([])

  const refresh = useCallback(() => {
    // listConversations renvoie [] pour un profil absent (pas de setState sync).
    listConversations(profileId).then(setConversations)
  }, [profileId])

  useEffect(() => {
    refresh()
    if (!profileId) return undefined
    const unsubNotifications = subscribeToNotifications(profileId, refresh, 'conversations')
    const unsubList = subscribeToConversationList(profileId, refresh)
    return () => {
      unsubNotifications()
      unsubList()
    }
  }, [profileId, refresh])

  return { conversations, refresh, profileId }
}
