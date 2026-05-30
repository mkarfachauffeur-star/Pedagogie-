# PEDAGOGIA DRIVE — Base de données Supabase (multi-tenant)

Architecture **définitive V1** : multi-auto-écoles, isolation totale par
organisation, authentification Supabase Auth, sécurité par **RLS** (Row Level
Security). Aucune donnée fictive : la base démarre vide et n'est alimentée que
par des données réelles.

## Fichiers de migration (à exécuter dans l'ordre)

| Ordre | Fichier | Contenu |
|------|---------|---------|
| 1 | `migrations/20260530_0001_core_and_security.sql` | `organizations`, `profiles`, `teachers`, `secretaries`, `students`, `student_assignments`, enums, fonctions de sécurité, RLS cœur, trigger de provisioning des comptes |
| 2 | `migrations/20260530_0002_business_domains.sql` | `vehicles`, `documents`, `contracts`, `payments`, `appointments`, `exams` + RLS |
| 3 | `migrations/20260530_0003_messaging.sql` | `conversations`, `conversation_participants`, `messages`, `message_attachments`, `message_reads`, `notifications`, `can_converse`, triggers, Realtime + RLS |

### Tables (18 au total)
Identité/rôles : `organizations`, `profiles`, `teachers`, `secretaries`, `students`, `student_assignments`.
Métier : `vehicles`, `documents`, `contracts`, `payments`, `appointments`, `exams`.
Messagerie : `conversations`, `conversation_participants`, `messages`, `message_attachments`, `message_reads`, `notifications`.

### Comment appliquer
- **Dashboard Supabase** : SQL Editor → coller/exécuter chaque fichier dans l'ordre.
- **CLI Supabase** : placer les fichiers dans `supabase/migrations/` puis `supabase db push`.

## Modèle multi-tenant
Chaque table métier porte `organization_id` (auto-école). Toute requête est
filtrée par RLS via `app.current_org_id()` → **une auto-école ne voit jamais les
données d'une autre** (élèves, staff, documents, paiements, examens, planning,
véhicules, messagerie).

## Identités & rôles
- Un compte = une ligne `auth.users` + un `profiles` (`role`, `organization_id`).
- Rôles : `manager` (gérant), `secretary` (secrétariat), `teacher` (enseignant), `student` (élève).
- Provisioning : à la création du compte Auth, fournir dans les `user_metadata` :
  `organization_id`, `role`, `full_name` → le profil est créé automatiquement
  (trigger `app.handle_new_user`). Flux conseillé : invitations gérées par le
  gérant / secrétariat.

## Matrice de visibilité (RLS)
| Donnée | Gérant | Secrétariat | Enseignant | Élève |
|--------|:------:|:-----------:|:----------:|:-----:|
| Données de l'auto-école | tout | tout | élèves affectés | les siennes |
| Élèves / dossiers | ✅ | ✅ | affectés | soi |
| Documents / paiements / examens | ✅ | ✅ | élèves affectés (lecture) | les siens |
| Planning / leçons | ✅ | ✅ | les siennes + élèves affectés | les siennes |
| Véhicules | ✅ | ✅ | lecture | ❌ |

Helpers SQL : `app.current_org_id()`, `app.current_role()`, `app.is_staff()`,
`app.is_admin_staff()`, `app.is_teacher_of_student()`, `app.can_access_student()`.
Ils sont `SECURITY DEFINER` pour éviter toute récursion de politiques.

## Messagerie — règles de mise en relation (`app.can_converse`)
| | Gérant | Enseignant | Secrétariat | Élève |
|---|:---:|:---:|:---:|:---:|
| Gérant | — | ✅ | ✅ | ❌ |
| Enseignant | ✅ | ⚙️ (réglage org) | ✅ | ✅ affecté |
| Secrétariat | ✅ | ✅ | — | ✅ |
| Élève | ❌ | ✅ référent | ✅ | ❌ |

- `organizations.allow_teacher_to_teacher` (défaut `false`) active l'échange enseignant↔enseignant.
- Validation appliquée à l'ajout de participants (trigger `app.validate_participant`).

## Statuts & accusés de lecture
- **Envoyé** : ligne créée dans `messages`.
- **Reçu** : `message_reads.delivered_at` (posé automatiquement pour chaque destinataire à l'insertion du message).
- **Lu** : `message_reads.read_at` (posé à l'ouverture de la conversation) + `conversation_participants.last_read_at`.
- **Compteur non-lus / badge** : table `notifications` (`is_read=false`) — alimentée automatiquement par trigger à chaque message.

## Temps réel (Realtime)
Tables publiées : `messages`, `notifications`, `message_reads`, `conversations`.
Le client s'abonne à :
- `notifications` filtré sur `profile_id = <moi>` → badge cloche en direct.
- `messages` filtré sur `conversation_id` → fil de discussion en direct.
La RLS s'applique aussi aux abonnements (aucune fuite inter-organisation).

## Scalabilité (milliers d'élèves)
- Index sur `(organization_id, …)`, `(conversation_id, created_at desc)`, `(profile_id, is_read)`.
- Compteur non-lus O(1) via `notifications` ; pagination des messages en keyset (`created_at < curseur`).
- Helpers `SECURITY DEFINER` `STABLE` pour des plans de requête efficaces.

## Compatibilité mobile (iOS / Android)
Même backend Supabase : les SDK mobiles utilisent les mêmes tables, RLS et
Realtime. Aucune logique de sécurité côté client → cohérence web + mobile.

## Intégration front (phase suivante, non incluse ici)
1. Activer Supabase Auth + écran de connexion réel (remplacer le rôle démo de `AuthContext`).
2. `src/services/messaging.js` : `listConversations`, `listMessages`, `sendMessage`, `markConversationRead`, `subscribeToMessages`, `subscribeToNotifications`.
3. Hooks `useConversations`, `useConversation`, `useUnreadCount`.
4. Recâbler les pages `*MessagesPage.jsx` (design inchangé) + le badge cloche du `DashboardLayout`.
5. Brancher progressivement les autres écrans (élèves, paiements, examens, planning, documents) sur ces tables.

> Aucune donnée fictive, aucun utilisateur de démonstration. Schéma prêt pour
> plusieurs auto-écoles et plusieurs milliers d'élèves.
