# Jeu de données de démonstration

Crée **2 auto-écoles** complètes pour valider l'application (RLS, rôles, exports, parcours métier).

## Prérequis

1. Migrations Supabase appliquées sur le projet
2. Fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> La clé **service role** est disponible dans Supabase Dashboard → Settings → API. Ne jamais l'exposer côté client.

## Commandes

```bash
# Créer le jeu de données (skip si déjà présent)
npm run seed:demo

# Supprimer puis recréer
npm run seed:demo:reset

# Vérifier les règles RLS
npm run verify:demo-rls
```

## Contenu créé (par auto-école)

| Rôle | Quantité |
|------|----------|
| Gérant | 1 |
| Secrétaire | 1 |
| Enseignant | 2 |
| Élève | 10 |

Données métier associées :
- Affectation élèves → enseignants (5 + 5)
- Contrats, paiements, évaluations de départ (trigger Permis B)
- Observations de leçons (6 élèves)
- 2 véhicules de flotte

## Comptes

Emails : `{alpha|beta}.{role}@demo.pedagogia.local`

Exemples :
- `alpha.gerant@demo.pedagogia.local`
- `alpha.enseignant1@demo.pedagogia.local`
- `alpha.eleve01@demo.pedagogia.local`

Les mots de passe temporaires sont générés aléatoirement et exportés dans :
- `scripts/output/demo-credentials.md`
- `scripts/output/demo-credentials.json`

## Vérifications RLS attendues

| Compte | Élèves visibles |
|--------|-----------------|
| Gérant | 10 (toute l'org) |
| Secrétaire | 10 |
| Enseignant | 5 (affectés) |
| Élève | 1 (soi) |

Isolation stricte entre Alpha et Beta.
