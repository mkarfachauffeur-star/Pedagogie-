import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUnreadCount, subscribeToNotifications } from '../services/notifications'

// Compteur de messages non lus du profil courant, synchronisé en temps réel.
// Retourne 0 tant qu'aucune session réelle n'est active (mode transitoire).
export function useUnreadCount() {
  const { profileId } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const refresh = () => {
      // getUnreadCount renvoie 0 pour un profil absent -> remise à zéro propre.
      getUnreadCount(profileId).then((value) => {
        if (active) setCount(value)
      })
    }
    refresh()
    const unsubscribe = profileId ? subscribeToNotifications(profileId, refresh) : () => {}
    return () => {
      active = false
      unsubscribe()
    }
  }, [profileId])

  return count
}
