# Rappels automatiques

Architecture extensible pour les rappels périodiques (code de la route, permis, documents, visite médicale, etc.).

## V1 — Code de la route manquant

### Déclenchement
- À l'inscription (ou mise à jour) : si `code_status <> 'Obtenu'` et dossier actif (`status <> 'Archivé'`), un abonnement `code_missing` est créé dans `student_automated_reminders`.
- Chaque **lundi à 08h00 (Europe/Paris)** : le job envoie une notification aux **secrétaires** de l'auto-école.
- **Maximum 1 notification par élève et par semaine** (clé ISO `IYYY-Www` en fuseau Paris).
- Si `code_status` passe à **Obtenu** ou le dossier est **archivé** : l'abonnement est désactivé automatiquement.

### Notification
- Type : `automated_reminder`
- Kind : `code_missing`
- Titre : `📋 Élève sans Code de la route`
- Destinataires : profils `secretary` actifs de l'organisation
- Action UI : **➡️ Ouvrir le dossier élève** → `/secretary/inscriptions?student={id}`

## Tables

| Table | Rôle |
|-------|------|
| `automated_reminder_kinds` | Catalogue des types de rappels |
| `student_automated_reminders` | Abonnements actifs par élève |
| `automated_reminder_sent_log` | Anti-doublon hebdomadaire |
| `notifications` | Colonne `reminder_kind` |

## Déploiement

### 1. Migration SQL
```bash
supabase db push
```

### 2. Edge Function
```bash
supabase functions deploy check-automated-reminders
```

Variables d'environnement (Secrets Supabase) :
- `CRON_SECRET` — secret partagé pour sécuriser l'appel planifié

### 3. Planification (lundi 08h Paris)

**Option A — Supabase Dashboard → Edge Functions → Schedules**

- Function : `check-automated-reminders`
- Cron : `0 6 * * 1` (06:00 UTC ≈ 08:00 Paris en heure d'été ; ajuster à `0 7 * * 1` en hiver si besoin)
- Header : `x-cron-secret: <CRON_SECRET>`

**Option B — pg_cron + pg_net** (si extension activée)

```sql
select cron.schedule(
  'pedagogia-automated-reminders',
  '0 6 * * 1',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/check-automated-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 4. Test manuel
```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/check-automated-reminders" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

Ou depuis le SQL Editor :
```sql
select public.run_automated_reminders();
```

## Ajouter un nouveau type de rappel

1. Insérer une ligne dans `automated_reminder_kinds`.
2. Créer une fonction `app.send_<kind>_reminder(...)` + branche dans `app.run_automated_reminders()`.
3. Ajouter un trigger ou sync pour `student_automated_reminders`.
4. Étendre `getAutomatedReminderRoute()` côté front si une action dédiée est nécessaire.
