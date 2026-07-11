# Google Analytics 4 — Pedagogia Drive

Measurement ID : **`G-WJP7BG8917`** (`NEXT_PUBLIC_GA_MEASUREMENT_ID` / `VITE_GA_MEASUREMENT_ID`).

## Architecture

| Fichier | Rôle |
|---------|------|
| `src/lib/gtag.js` | Initialisation gtag.js, `page_view`, envoi brut `gtag('event', …)` |
| `src/lib/analytics.js` | Point d'entrée public (réexporte les helpers) |
| `src/lib/analytics/once.js` | Déduplication `first_*` via `localStorage` |
| `src/lib/analytics/events.js` | Helpers métier par nom d'événement GA4 |
| `src/lib/analytics/milestones.js` | Premiers événements par organisation (comptage Supabase) |
| `src/components/analytics/Analytics.jsx` | `page_view` à chaque changement de route React Router |

Les événements métier sont déclenchés **dans la couche services** (après succès Supabase) pour ne pas dupliquer la logique dans les pages.

## DebugView

Pour voir tous les événements en temps réel dans **Google Analytics → Admin → DebugView** :

1. **Production** : ajouter `?ga_debug=1` à l'URL, ou
2. **Local / preview** : définir `NEXT_PUBLIC_GA_DEBUG=true` ou `VITE_GA_DEBUG=true` dans `.env`

Le mode debug active `debug_mode: true` dans la config gtag et autorise l'envoi hors production.

## Déduplication des événements « premier »

Les événements `first_*` et tous les jalons « premier X » utilisent `trackOnce` / `trackOrgOnce` / `trackUserOnce` (`src/lib/analytics/once.js`).

Clés stockées : `pd_ga_once:…` dans `localStorage`. Un même événement n'est **jamais renvoyé deux fois** pour la même clé.

## Catalogue des événements

### Visite

| Événement | Déclencheur | Fichier |
|-----------|-------------|---------|
| `page_view` | Navigation React Router | `src/components/analytics/Analytics.jsx` |

`first_visit` est géré nativement par GA4.

### Inscription auto-école (tunnel de conversion)

Ordre logique :

`sign_up` → `ae_pending_validation` → `ae_approved` → `begin_trial` → `first_login` → `create_student` → `create_teacher` → `purchase` → `subscription_renewed` → `subscription_cancelled`

| Événement | Paramètres | Déclencheur | Fichier |
|-----------|------------|-------------|---------|
| `sign_up` | `organization_name`, `organization_id` (si dispo), `plan_selected` | L'auto-école soumet une pré-inscription ou une demande de démo | `src/services/organizationSignupRequests.js`, `src/services/demoRequests.js`, `src/services/organization.js` |
| `ae_pending_validation` | `organization_name`, `organization_id` (si dispo), `plan_selected` | Immédiatement après `sign_up`, compte en attente de validation Super Admin | Idem |
| `ae_approved` | `organization_id`, `organization_name`, `approved_by`, `approved_at`, `trial_days`, `plan_selected` | Super Admin accepte une demande (prospect ou création directe) | `src/services/prospects.js`, `src/services/platform.js` |
| `begin_trial` | `organization_id`, `plan`, `trial_days` (30) | Essai gratuit démarré **après** validation Super Admin | `src/services/prospects.js`, `src/services/platform.js`, `src/services/organization.js` (inscription auto-activée) |

### Connexion

| Événement | Déclencheur | Fichier |
|-----------|-------------|---------|
| `login` | Connexion réussie (conservé) | `src/pages/LoginPage.jsx` |
| `first_login` | Première connexion par utilisateur (`userId`) | `src/pages/LoginPage.jsx`, `src/pages/AcceptInvitePage.jsx` |

### Jalons produit (première fois par organisation)

| Événement | Paramètres | Service |
|-----------|------------|---------|
| `create_student` | `student_count` | `src/services/students.js`, `src/services/preRegistrations.js` |
| `create_student_file` | — | Idem (premier dossier élève) |
| `create_teacher` | `teacher_count` | `src/services/teachers.js` |
| `create_vehicle` | `vehicle_count` | `src/services/vehicles.js` |
| `create_lesson` | — | `src/services/appointments.js` |
| `create_exam` | — | `src/services/exams.js` |
| `send_message` | — | `src/services/messaging.js` |
| `upload_document` | — | `src/services/documents.js` |
| `export_csv` | `export_type` | `src/services/regulatoryExport.js` |
| `export_excel` | `export_type` | Idem |
| `export_pdf` | `export_type` | Idem |
| `automatic_notification_sent` | `sent`, `source` | `src/services/automatedReminders.js`, `expirationReminders.js`, `fleetMaintenanceReminders.js` |

Comptage : `src/lib/analytics/milestones.js` interroge Supabase (RLS = périmètre org) et n'envoie l'événement que si le total = **1**.

### Abonnement SaaS

| Événement | Paramètres | Déclencheur | Fichier |
|-----------|------------|-------------|---------|
| `purchase` | `organization_id`, `subscription_plan`, `amount`, `value`, `currency`, `billing_cycle` | Statut abonnement passé à `active` avec un plan payant (Premium, Starter, monthly) | `src/services/platform.js` → `updateSubscriptionBySuperAdmin` |
| `subscription_renewed` | `subscription_plan` | Prolongation de `current_period_end` | Idem |
| `subscription_cancelled` | `subscription_plan` | Résiliation | `src/services/platform.js` → `cancelSubscription` |

> **Note Stripe** : l'intégration Stripe n'est pas encore présente dans le dépôt. L'événement `purchase` est émis lors de l'activation manuelle d'un abonnement payant par le Super Admin. Brancher le webhook Stripe sur le même helper `trackPurchase` lors de l'ajout du paiement en ligne.

### Suppression de compte

| Événement | Déclencheur | Fichier |
|-----------|-------------|---------|
| `delete_account` | Suppression utilisateur ou organisation | `src/services/users.js`, `src/services/platform.js` |

### Marketing

| Événement | Déclencheur | Fichier |
|-----------|-------------|---------|
| `book_demo` | Formulaire démo soumis | `src/components/marketing/DemoRequestForm.jsx` |
| `demo_form_submit` | Idem (conservé, compatibilité) | Idem |
| `demo_request_click` | CTA démo | `ProfileSelection.jsx`, `MarketingFinalCta.jsx` |
| `contact_form_submit` | — | **Non branché** : la page Contact n'a pas de formulaire (mailto uniquement) |

### Événements historiques

| Événement | Statut |
|-----------|--------|
| `organization_created` | Déprécié — remplacé par `sign_up` |

## Variables d'environnement

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-WJP7BG8917
# Optionnel — DebugView en local
# NEXT_PUBLIC_GA_DEBUG=true
# VITE_GA_DEBUG=true
```

## Vérification

1. Ouvrir https://www.pedagogia-drive.fr?ga_debug=1 (ou activer `GA_DEBUG` en local).
2. Ouvrir **Google Analytics → DebugView**.
3. Naviguer, se connecter, ou déclencher une action métier.
4. Confirmer l'apparition de l'événement avec ses paramètres.
