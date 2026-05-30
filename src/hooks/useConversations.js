import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listConversations } from '../services/messaging'
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
    const unsubscribe = profileId ? subscribeToNotifications(profileId, refresh) : () => {}
    return () => unsubscribe()
  }, [profileId, refresh])

  return { conversations, refresh, profileId }
}
