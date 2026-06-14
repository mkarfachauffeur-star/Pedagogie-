# Déploiement P2 REMC — migration production

Migration **35/35** : persistance des sous-compétences REMC, historique horodaté, statistiques et realtime.

---

## Prérequis

- Migrations **1 à 34** déjà appliquées (`npm run audit:production` → 34/34 ou 35/35).
- Migration **13** (`student_competency_validations`) obligatoire — les triggers P2 s’y branchent.
- Front déployé avec le code P2 (build contenant `remcItems.js`, `useStudentRemcProgress`, etc.).

---

## 1. Guide pas à pas

### Étape A — Sauvegarde (recommandé)

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → projet **watdeahravfccjdoseaf**.
2. **Database → Backups** : vérifier qu’un backup récent existe (ou lancer un backup manuel si disponible sur votre plan).

### Étape B — Exécuter la migration SQL

1. **SQL Editor** → **New query**.
2. Copier **intégralement** le contenu de :
   ```
   scripts/sql/20260612130000_remc_sub_competencies.sql
   ```
3. Cliquer **Run**.
4. Attendu : message **Success**, sans erreur rouge.

> En cas d’erreur `schema "app" does not exist` : les migrations core (001) ne sont pas appliquées — ne pas continuer.

> En cas d’erreur `relation "student_competency_validations" does not exist` : appliquer d’abord la migration 13.

### Étape C — Vérification SQL (Dashboard)

1. Nouvelle requête dans SQL Editor.
2. Copier le contenu de :
   ```
   scripts/sql/verify-remc-p2-production.sql
   ```
3. Exécuter section par section (ou tout d’un coup).
4. Contrôler :
   - `remc_item_progress_ok` = **true**
   - `remc_history_ok` = **true**
   - 2 triggers listés
   - 3 tables dans `supabase_realtime` (item_progress, history, competency_validations)
   - RPC présentes

### Étape D — Vérification CLI (local)

```bash
npm run audit:production    # attendu : 35/35 migrations
npm run verify:remc-p2      # 6/6 checks ✅
```

### Étape E — Redéploiement front (si pas déjà fait)

```bash
npm run build
vercel --prod
```

### Étape F — Test fonctionnel (5 min)

| Acteur | Action | Résultat attendu |
|--------|--------|------------------|
| Enseignant | Mes élèves → ouvrir un élève → Suivi REMC → passer une sous-compétence en « En cours » | Enregistrement immédiat, barre de progression mise à jour |
| SQL Editor | `select * from student_remc_item_progress order by updated_at desc limit 5` | Ligne avec `item_id`, `status`, `updated_by` |
| SQL Editor | `select * from student_remc_history order by changed_at desc limit 5` | Événement `record_type = item` |
| Élève | Bilans de compétences | Progression + historique visible |
| Enseignant + Élève (2 onglets) | Modifier une sous-compétence | L’autre onglet se met à jour sans rechargement (realtime) |

### Étape G — Migration localStorage (si données legacy)

Si des navigateurs avaient encore des données REMC en local :

1. Se connecter en enseignant ou élève concerné.
2. Ouvrir une page REMC (Mes élèves ou Bilans).
3. Le service `migrateLocalStorageRemcIfNeeded` importe automatiquement vers Supabase.
4. Vérifier dans DevTools → Application → Local Storage :
   - Clés `pedagogia-drive-student-tracking*` absentes après migration
   - Marqueur `pedagogia:remc-db-migrated:{studentId}` = `"1"`

---

## 2. Script SQL à appliquer

**Fichier unique à exécuter :**

| Fichier | Description |
|---------|-------------|
| [`scripts/sql/20260612130000_remc_sub_competencies.sql`](./sql/20260612130000_remc_sub_competencies.sql) | Migration complète P2 |

Contenu créé :

- `student_remc_item_progress` — état courant (34 sous-compétences max par élève)
- `student_remc_history` — journal horodaté (items + validations C1–C4)
- Triggers sur `student_remc_item_progress` et `student_competency_validations`
- RLS + Realtime
- RPC `get_remc_student_stats`, `get_remc_organization_stats`

---

## 3. Vérifications après migration

### Automatiques

```bash
npm run audit:production   # 35/35
npm run verify:remc-p2     # tables + RPC
```

### SQL Editor (résumé rapide)

```sql
select
  to_regclass('public.student_remc_item_progress') is not null as p2_items_ok,
  to_regclass('public.student_remc_history') is not null as p2_history_ok,
  to_regprocedure('public.get_remc_student_stats(uuid)') is not null as p2_rpc_ok;
```

### Realtime

Dashboard → **Database → Publications** → `supabase_realtime` doit inclure :

- `student_remc_item_progress`
- `student_remc_history`
- `student_competency_validations`

---

## 4. Confirmation : REMC en base, plus en localStorage

| Donnée REMC | Avant P2 | Après P2 |
|-------------|----------|----------|
| Sous-compétences (C1a…C4g) | `studentTrackingStore` (mémoire) + localStorage legacy | **`student_remc_item_progress`** |
| Validations C1–C4 | `student_competency_validations` | Inchangé (+ historique dans `student_remc_history`) |
| Historique modifications | Aucun | **`student_remc_history`** (triggers auto) |
| Catalogue REMC (libellés) | Code (`remcTemplate.js`) | Code (référentiel statique — normal) |
| Statistiques | Calcul local | **RPC Supabase** + services `remcStats.js` |

**localStorage REMC :**

- Plus lu ni écrit par l’application métier REMC.
- Import one-shot au premier chargement si clés legacy présentes.
- Purge automatique des clés `pedagogia-drive-student-tracking*` et `pedagogia:remc-competency:*` après import.

**Hors périmètre REMC (toujours en localStorage) :**

- Progression QCU leçons théoriques (`StudentLessonsPage`)
- Objectifs familiaux AAC (`StudentAccompaniedDrivingPage`)
- Email mémorisé sur la page de connexion

---

## 5. Prochaine étape

Une fois cette checklist validée → **page Statistiques gérant / enseignant** dans le dashboard manager.
