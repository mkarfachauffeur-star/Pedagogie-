import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listMessagesWithReads,
  markConversationRead,
  subscribeToConversation,
} from '../services/messaging'

// Messages d'une conversation (avec accusés Envoyé/Reçu/Lu), synchronisés en
// temps réel. Marque la conversation lue à l'ouverture et à chaque évènement.
export function useConversationMessages(conversationId) {
  const { profileId } = useAuth()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) setMessages([])
    })

    if (!conversationId) {
      return () => {
        active = false
      }
    }

    const load = () => {
      listMessagesWithReads(conversationId, profileId).then((rows) => {
        if (active) setMessages(rows)
      })
    }

    load()
    if (profileId) markConversationRead(conversationId, profileId)

    const unsubscribe = subscribeToConversation(conversationId, () => {
      load()
      if (profileId) markConversationRead(conversationId, profileId)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [conversationId, profileId])

  return messages
}
