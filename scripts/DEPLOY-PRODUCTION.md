# Déploiement production — PEDAGOGIA DRIVE

## 1. Migrations Supabase (34/34)

SQL Editor → exécuter **dans l'ordre** (ou le fichier combiné) :

1. `scripts/sql/20260530120033_assessment_hours_response.sql`
2. `scripts/sql/20260612120000_commercial_readiness.sql`

Ou en une fois : `scripts/sql/apply-missing-migrations-production.sql`

Vérification locale :

```bash
npm run verify:post-migrations
npm run audit:production
```

Attendu : **34/34 migrations**, **4/4 Edge Functions**.

## 2. Edge Functions

```bash
supabase login
supabase link --project-ref watdeahravfccjdoseaf
npm run supabase:deploy:functions
```

Secrets Supabase (Dashboard → Edge Functions → Secrets) :

| Variable | Exemple |
|----------|---------|
| `APP_URL` | `https://pedagogia-drive.vercel.app` |
| `RESEND_API_KEY` | (optionnel — envoi identifiants élève) |
| `ACCESS_EMAIL_FROM` | `Pedagogia Drive <noreply@votredomaine.fr>` |

## 3. Variables Vercel

Dashboard Vercel → Project → Settings → Environment Variables :

| Variable | Production |
|----------|------------|
| `VITE_SUPABASE_URL` | `https://watdeahravfccjdoseaf.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé publishable (Dashboard Supabase → API) |

Ne **jamais** exposer la secret key côté Vercel.

## 4. Redéploiement Vercel

### Option A — Git (recommandé)

```bash
git add -A
git commit -m "Production: suppression mode démo, migrations, exports"
git push origin main
```

Vercel redéploie automatiquement si le projet est connecté au repo.

### Option B — CLI Vercel

```bash
npm install -g vercel   # si absent
vercel login
vercel --prod
```

Build local de contrôle :

```bash
npm run build
npm run preview
```

## 5. Checklist post-déploiement

- [ ] `/login` — pas d'« Accès démo rapide », e-mail + mot de passe obligatoires
- [ ] Connexion enseignant → élèves affectés visibles
- [ ] Finaliser une évaluation de départ (sans erreur Supabase)
- [ ] Exports gérant → Contrats CSV/Excel
- [ ] Exports gérant → Paiements CSV/Excel
- [ ] `npm run audit:production` → 34/34 + 4/4

## 6. P2 REMC (prochaine étape)

Persistance sous-compétences REMC, historique et statistiques en base — après validation de cette checklist.
