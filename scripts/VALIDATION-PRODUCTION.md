# Validation fonctionnelle production — checklist manuelle

**URL :** https://pedagogia-drive.vercel.app  
**Automatisé :** `npm run validate:production` (requiert `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`)

---

## A. Déjà validé automatiquement (12/06/2026)

| Contrôle | Résultat |
|----------|----------|
| Migrations Supabase 1–34 | ✅ 34/34 |
| Migrations 33 + commercial (exports) | ✅ `verify:post-migrations` |
| Schéma exports / évaluation | ✅ `verify:exports-schema` |
| Edge Functions (4/4) | ✅ déployées |
| RLS (anon → 0 ligne) | ✅ |
| Front : pages accessibles | ✅ accueil, login, routes SPA |
| Redirection routes protégées | ✅ `/manager/dashboard` → `/login` |
| Page login sans accès démo | ✅ |
| Migration P2 (35) | ⏳ non appliquée (volontaire) |

---

## B. Checklist manuelle par rôle (à cocher)

### Connexion

| # | Test | Gérant | Secrétaire | Enseignant | Élève |
|---|------|:------:|:----------:|:----------:|:-----:|
| 1 | Login email + mot de passe | ☐ | ☐ | ☐ | ☐ |
| 2 | Redirection dashboard correct | ☐ | ☐ | ☐ | ☐ |
| 3 | Menu latéral visible | ☐ | ☐ | ☐ | ☐ |
| 4 | Déconnexion fonctionne | ☐ | ☐ | ☐ | ☐ |

### Affectation enseignant ↔ élève

| # | Test | Enseignant |
|---|------|:----------:|
| 5 | Mes élèves → liste non vide | ☐ |
| 6 | Salma (ou élève assigné) visible | ☐ |
| 7 | Fiche élève : onglets REMC / évaluation | ☐ |

### Évaluation de départ

| # | Test | Enseignant | Élève |
|---|------|:----------:|:-----:|
| 8 | Onglet « Évaluation de départ » ouvre le wizard | ☐ | — |
| 9 | Sauvegarde / relecture des réponses | ☐ | — |
| 10 | Page élève : résultats + proposition d'heures | — | ☐ |
| 11 | Accepter / refuser les heures recommandées | — | ☐ |

### Contrats

| # | Test | Gérant | Secrétaire |
|---|------|:------:|:----------:|
| 12 | Contrats staff : liste / upload (gérant) | ☐ | — |
| 13 | Inscriptions : montant contrat élève visible | — | ☐ |

### Paiements

| # | Test | Secrétaire | Gérant |
|---|------|:----------:|:------:|
| 14 | Liste paiements charge | ☐ | ☐ |
| 15 | Créer un paiement test (optionnel) | ☐ | — |
| 16 | Numéro de reçu visible après migration 34 | ☐ | ☐ |

### Planning

| # | Test | Gérant | Secrétaire | Enseignant |
|---|------|:------:|:----------:|:----------:|
| 17 | Planning gérant : liste / création RDV | ☐ | — | — |
| 18 | Planning secrétaire | — | ☐ * | — |
| 19 | Planning enseignant | — | — | ☐ * |

\* Attendu **partiel** : secrétaire/enseignant = coquilles UI (données locales vides). Seul le **gérant** est branché Supabase `appointments`.

### Messagerie

| # | Test | Enseignant | Élève | Secrétaire | Gérant |
|---|------|:----------:|:-----:|:----------:|:------:|
| 20 | Liste conversations | ☐ | ☐ | ☐ | ☐ |
| 21 | Envoi message | ☐ | ☐ | ☐ | ☐ |
| 22 | Réception / compteur non-lus | ☐ | ☐ | ☐ | ☐ |

### Export réglementaire

| # | Test | Gérant |
|---|------|:------:|
| 23 | Page Exports accessible | ☐ |
| 24 | Téléchargement CSV élèves | ☐ |
| 25 | Téléchargement XLSX paiements | ☐ |
| 26 | PDF bundle sans erreur | ☐ |

---

## C. Commande audit données (optionnel)

```bash
# Dans .env.local (ne pas committer) :
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

npm run validate:production
npm run audit:production-admin
```

---

## D. Critère GO pour migration 35

**GO** si :
- Tous les tests B des rôles **gérant, secrétaire, enseignant, élève** passent (connexion + parcours principal)
- Affectation enseignant confirmée
- Paiements + exports OK
- Aucune régression bloquante sur messagerie / évaluation

**Reporté (non bloquant P2)** :
- Planning secrétaire / enseignant (hors scope stabilisation actuelle)
- Pages élève contrat / paiements (placeholders)
