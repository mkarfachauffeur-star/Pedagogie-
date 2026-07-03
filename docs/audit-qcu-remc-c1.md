# Audit pédagogique — QCU Compétence 1 (REMC)

**Périmètre :** 88 questions dans `StudentLessonsPage.jsx` (SC1.1 à SC1.8)  
**Référentiel :** REMC — C1 « Maîtriser le maniement du véhicule »  
**Public cible :** élève en première heure de conduite (niveau débutant absolu)  
**Date :** 30 mai 2026

---

## Méthodologie

| Critère | Application |
|--------|-------------|
| Ambiguïté | Une seule bonne réponse sans interprétation possible |
| Complexité | Phrases courtes (≤ 15 mots), vocabulaire courant |
| REMC | Alignement avec les sous-compétences SC1.1–SC1.8 |
| Débutant | Pas de jargon non expliqué ; métaphores explicites (ex. « comme sur une montre ») |
| Style | Formulation directe, temps présent, « vous » implicite, pas de double négation |

**Légende :** 🔴 modification importante · 🟡 ajustement léger · 🟢 conserver (micro-corrections seulement)

---

## Synthèse par module

| Module | Questions | 🔴 | 🟡 | 🟢 |
|--------|-----------|----|----|-----|
| SC1.1 — Organes du véhicule | 18 | 12 | 4 | 2 |
| SC1.2 — Poste de conduite | 10 | 2 | 5 | 3 |
| SC1.3 — Volant | 10 | 3 | 4 | 3 |
| SC1.4 — Démarrer / s’arrêter | 10 | 1 | 4 | 5 |
| SC1.5 — Dosage pédales | 10 | 0 | 3 | 7 |
| SC1.6 — Boîte de vitesses | 10 | 4 | 4 | 2 |
| SC1.7 — Marche avant / arrière | 10 | 2 | 5 | 3 |
| SC1.8 — Observer / avertir | 10 | 1 | 4 | 5 |
| **Total C1** | **88** | **25** | **33** | **30** |

**Problèmes transversaux identifiés :**
1. Intitulé générique identique pour les 10 voyants (« Quelle est la signification de ce témoin ? ») — OK visuellement mais insuffisant sans l’icône (accessibilité, mémorisation).
2. Distracteurs trop techniques ou piégeurs (termes mécaniques, réponses partiellement vraies).
3. Incohérence ponctuelle ponctuation / formulation des bonnes réponses.
4. Termes REMC avancés pour un débutant : « dispositif de transmission secondaire », « correcteur électronique de trajectoire », « sous-régime / sur-régime » sans traduction simple.
5. Question clignotants avec 4 choix alors que les autres modules en ont 3 — à harmoniser.

---

## SC1.1 — Connaître les principaux organes du véhicule

### Voyants tableau de bord (10 questions)

**Problème commun 🔴** — Intitulé identique pour toutes les questions.

| # | Actuel | Proposé | Pourquoi |
|---|--------|---------|----------|
| **Tous** | Quelle est la signification de ce témoin ? | **Que signifie ce voyant ?** (ou « Que signifie le voyant de [nom] ? » en texte alternatif) | « Témoin » est moins courant que « voyant » pour un débutant ; formulation plus directe. Nommer le voyant dans l’accessibilité si l’icône seule ne suffit pas. |

#### V1 — Pression d’huile 🔴

**Actuel :** Quelle est la signification de ce témoin ?  
**Bonnes réponse :** Signale un manque de pression d’huile moteur.

**Proposé :** Que signifie ce voyant ?  
**Bonne réponse :** Il signale un manque d’huile moteur (danger pour le moteur).

**Pourquoi :** « Pression d’huile » est correct mais abstrait ; « manque d’huile » est plus concret pour un débutant. Distracteur « vidange périodique » piège (entretien ≠ urgence).

**Distracteurs proposés :** Il indique qu’il faut faire la vidange bientôt · Il signale que le moteur surchauffe · Il indique un manque de liquide lave-glace

---

#### V2 — Batterie 🟡

**Actuel :** Indique un problème du système de charge ou de la batterie.  
**Proposé :** Il signale un problème de batterie ou de charge.

**Pourquoi :** « Système de charge » est technique ; simplifier sans perdre le sens REMC.

---

#### V3 — Moteur / antipollution 🟡

**Actuel :** Signale un dysfonctionnement moteur ou du système antipollution.  
**Proposé :** Il signale un problème au moteur (injection, allumage ou antipollution).

**Pourquoi :** Parentheses explicatives aident le débutant ; « dysfonctionnement » → « problème ».

---

#### V4 — Frein / frein à main 🟢

**Actuel :** Indique que le frein de stationnement est activé ou qu’un problème de freinage est détecté.  
**Proposé :** Il indique que le frein à main est serré ou qu’il y a un problème de freinage.

**Pourquoi :** « Frein de stationnement » = « frein à main » (vocabulaire élève).

---

#### V5 — Pression pneus 🟢

Conserver. Distracteurs adaptés au niveau débutant.

---

#### V6 — Ceinture 🔴

**Actuel :** Indique qu’une des ceintures de sécurité n’est pas bouclée  
**Distracteur :** Indique que le passager n’a pas mis sa ceinture de sécurité

**Proposé :** Il signale qu’une ceinture de sécurité n’est pas bouclée.  
**Distracteurs :** Il signale un problème avec l’airbag · Le dossier du siège n’est pas verrouillé · Le passager n’a pas mis sa ceinture *(retirer ce distracteur : quasi-identique à la bonne réponse, piège injuste)*

**Pourquoi :** Deux réponses quasi synonymes créent une ambiguïté ; point final manquant sur la bonne réponse.

---

#### V7 — Feux de route 🟢

Conserver. Explication claire sur l’éblouissement.

---

#### V8 — Feux de croisement 🟢

Conserver.

---

#### V9 — ABS 🔴

**Actuel :** Signale un défaut du système antiblocage des roues.  
**Proposé :** Il signale un problème avec l’ABS (freinage antiblocage).

**Pourquoi :** Acronyme ABS doit être explicité une première fois pour un débutant.

**Distracteur à retirer :** « Indique que le véhicule va nécessairement déraper » — fausse certitude, anxiogène.

---

#### V10 — Température moteur 🟡

**Actuel :** Indique une surchauffe du moteur.  
**Proposé :** Il signale que le moteur surchauffe.

**Pourquoi :** Formulation active, plus directe.

---

### Organes — questions texte (8 questions)

#### O1 — Frein 🔴

**Actuel :** Quel élément permet principalement d’immobiliser le véhicule en sécurité ?  
**Distracteur :** Le dispositif de transmission secondaire / Le système de ventilation moteur

**Proposé :** Quelle commande sert surtout à arrêter le véhicule en sécurité ?  
**Réponses :** Le frein · La boîte de vitesses · Le système de refroidissement du moteur

**Pourquoi :** Distracteurs actuels utilisent un jargon mécanique incompréhensible pour un débutant ; la question doit tester la connaissance du frein, pas le vocabulaire technique.

---

#### O2 — Volant 🔴

**Actuel :** Quel équipement permet au conducteur d’adapter précisément la trajectoire du véhicule ?  
**Distracteur :** Avoir un bon regard

**Proposé :** Quelle commande sert à diriger le véhicule ?  
**Réponses :** Le volant · Le limiteur de vitesse · L’accélérateur

**Pourquoi :** « Avoir un bon regard » n’est pas un équipement — distracteur incohérent et source de confusion. « Adapter la trajectoire » → « diriger » (plus simple).

---

#### O3 — Embrayage 🟡

**Actuel :** Quels sont les principaux rôles de l’embrayage ?  
**Proposé :** À quoi sert l’embrayage ?

**Pourquoi :** Question au pluriel alors qu’une seule réponse est attendue ; formulation plus naturelle pour un débutant.

**Bonne réponse proposée :** À démarrer, s’arrêter, changer de vitesse et aider au frein moteur

---

#### O4 — Pneus 🟢

Conserver. Claire et alignée REMC.

---

#### O5 — Clignotants 🔴

**Actuel :** 4 choix (feux de position, clignotants, feux diurnes, avertisseur)  
**Proposé :** 3 choix harmonisés

**Question proposée :** Quel équipement indique un changement de direction aux autres usagers ?  
**Réponses :** Les clignotants · Les feux de position · L’avertisseur sonore

**Pourquoi :** 4 choix = exception dans le module ; « feux diurnes automatiques » peuvent induire en erreur un débutant.

---

#### O6 — Pneus / sécurité 🟢

Conserver.

---

#### O7 — Rétroviseurs 🔴

**Actuel :** Distracteur : Le correcteur électronique de trajectoire  
**Proposé :** Distracteur : Le GPS du véhicule

**Pourquoi :** « Correcteur électronique de trajectoire » (ESP) est hors programme C1 débutant et trop technique comme faux choix.

---

#### O8 — Essuie-glaces 🟢

Conserver.

---

## SC1.2 — S’installer au poste de conduite

#### P1 — Ordre d’installation 🟡

**Actuel :** Quel est le bon ordre d’installation au poste de conduite ?  
**Proposé :** Dans quel ordre faut-il s’installer au poste de conduite ?

**Pourquoi :** « Bon ordre » → formulation plus directe ; les 4 choix restent pertinents.

---

#### P2 — Réglage siège / embrayage 🟡

**Actuel :** Lors du réglage de l’avancement du siège sur une boîte manuelle, quel contrôle permet de vérifier la bonne distance ?  
**Proposé :** Comment vérifier que le siège est bien réglé (boîte manuelle) ?

**Pourquoi :** Phrase initiale trop longue (22 mots) ; le débutant doit identifier le geste (appuyer sur l’embrayage).

---

#### P3 — Dossier 🟢

Conserver.

---

#### P4 — Volant trop loin 🟢

Conserver.

---

#### P5 — Rétroviseur intérieur 🟡

**Actuel :** Lors du réglage du rétroviseur intérieur, le conducteur doit voir :  
**Proposé :** Que doit-on voir dans le rétroviseur intérieur ?

**Pourquoi :** Allègement de l’intitulé.

---

#### P6 — Main sur la vitre 🔴

**Actuel :** Pourquoi faut-il éviter de poser la main sur la vitre lors du réglage du rétroviseur intérieur ?  
**Distracteur :** Cela empêche le contact du véhicule

**Proposé :** Pourquoi ne faut-il pas poser la main sur la vitre pour régler le rétroviseur ?  
**Distracteur à remplacer :** Cela peut salir la vitre *(plus plausible pour un débutant que « empêcher le contact »)*

**Pourquoi :** Distracteur « empêche le contact du véhicule » est absurde et n’apprend rien.

---

#### P7 — Rétroviseur extérieur 🟢

Conserver.

---

#### P8 — Ceinture 🟢

Conserver.

---

#### P9 — Siège trop proche 🟡

**Actuel :** Quel risque existe si le siège est trop proche des pédales ?  
**Proposé :** Si le siège est trop près des pédales, que se passe-t-il ?

**Pourquoi :** Formulation plus concrète pour un débutant.

---

#### P10 — Importance installation 🟢

Conserver.

---

## SC1.3 — Tenir et tourner le volant

#### S1 — Position mains 🔴

**Actuel :** Quelle est la bonne position des mains sur le volant ? → 9h15 ou 10h10  
**Proposé :** Où placer les mains sur le volant ? → **À 9 h 15 ou 10 h 10 (comme sur une montre)**

**Pourquoi :** Un débutant peut ne pas comprendre la métaphore horlogère sans précision.

---

#### S2 — Courbe 🟡

**Actuel :** Dans une courbe, le conducteur : → Peut voir le bout de la route  
**Proposé :** Dans une courbe légère, que peut-on voir ? → **La sortie de la courbe**

**Pourquoi :** « Le bout de la route » est vague ; « sortie de la courbe » correspond au cours.

---

#### S3 — Technique courbe 🟢

Conserver (« maintien des mains »).

---

#### S4 — Tirer-glisser 🟡

**Actuel :** Le tirer-glisser est principalement utilisé :  
**Proposé :** La technique « tirer-glisser » sert surtout :

**Pourquoi :** Guillemets signalent un terme technique enseigné en cours ; « principalement » → « surtout » (plus courant).

---

#### S5 — Tirer-glisser / mains 🟢

Conserver.

---

#### S6 — Chevauchement 🟢

Conserver.

---

#### S7 — Chevauchement / mains 🟢

Conserver.

---

#### S8 — Pratique interdite 🟢

Conserver.

---

#### S9 — Regarder loin 🟢

Conserver.

---

#### S10 — Commandes 🟡

**Actuel :** Lors de l’utilisation des commandes (clignotants, essuie-glaces…), le conducteur doit :  
**Proposé :** Quand on utilise clignotants ou essuie-glaces, que faut-il faire avec le volant ?

**Pourquoi :** Question plus actionnable ; évite la parenthèse longue.

---

## SC1.4 — Démarrer et s’arrêter

#### D1 à D10 — Vue d’ensemble

| # | Statut | Modification |
|---|--------|--------------|
| D1 | 🟢 | Conserver |
| D2 | 🟡 | « point de patinage » — ajouter en cours : « moment où la voiture commence à avancer » |
| D3 | 🟢 | Conserver |
| D4 | 🟡 | Idem point de patinage |
| D5 | 🟢 | Conserver |
| D6 | 🟡 | « Freinage dégressif » — première occurrence : ajouter « (fort au début, puis on relâche) » |
| D7 | 🟢 | Conserver |
| D8 | 🟢 | Conserver |
| D9 | 🔴 | Distracteur « Véhicule moteur coupé » incohérent → remplacer par « Uniquement en parking » |
| D10 | 🟡 | « vitesse du moteur » → « le moteur au ralenti » |

**D9 détail :**  
**Actuel :** Le démarrage avec accélération est principalement utilisé : [Véhicule moteur coupé, Sur route…]  
**Proposé :** Quand utilise-t-on le démarrage avec accélération ? → **Sur route et dans la circulation**

**Pourquoi :** « Véhicule moteur coupé » n’est pas une situation d’usage — distracteur absurde.

---

## SC1.5 — Doser l’accélération et le freinage

Module globalement bien calibré pour débutants.

| # | Statut | Note |
|---|--------|------|
| A1–A10 | 🟢/🟡 | A5 : « puissance moteur » → « force du moteur » ; A4 : « perte de contrôle sur la vitesse » → « le véhicule peut avancer ou reculer involontairement » |

**A5 détail 🟡 :**  
**Actuel :** Quelle vitesse possède le plus de puissance moteur ?  
**Proposé :** Quel rapport de boîte donne le plus de force au démarrage ? → **La 1ère vitesse**

**Pourquoi :** « Puissance moteur » est abstrait ; « force au démarrage » relie à l’expérience vécue.

---

## SC1.6 — Utiliser la boîte de vitesse

#### B1 — Rôle boîte 🟢

Conserver.

---

#### B2 — 1ère vitesse 🔴

**Actuel :** Parce qu’elle possède le rapport le plus court et transmet plus de force aux roues  
**Proposé :** Parce que la 1ère vitesse envoie plus de force aux roues pour démarrer

**Pourquoi :** « Rapport le plus court » est jargon ; reformuler en langage vécu.

---

#### B3 — Usage 1ère 🟢

Conserver.

---

#### B4 — Ordre montée 🟡

**Actuel :** Embrayer → changer le rapport → relâcher progressivement l’embrayage → accélérer  
**Proposé :** Débrayer → changer de vitesse → embrayer progressivement → accélérer doucement

**Pourquoi :** Vocabulaire du lexique (débrayer/embrayer) plus cohérent avec le reste de l’app.

---

#### B5 — Relâchement embrayage 🟢

Conserver.

---

#### B6 — Moteur qui hurle 🔴

**Actuel :** Un sur-régime moteur  
**Proposé :** Le moteur tourne trop vite (il faut monter un rapport)

**Pourquoi :** « Sur-régime » est un terme technique ; le débutant doit comprendre le symptôme et l’action.

---

#### B7 — Rétrogradage 🟡

**Actuel :** D’utiliser le frein moteur et récupérer de la puissance  
**Proposé :** De ralentir avec le frein moteur et retrouver de la force

**Pourquoi :** « Récupérer de la puissance » est vague.

---

#### B8 — Sous-régime 🔴

**Actuel :** Un moteur qui manque de puissance par rapport à la vitesse engagée  
**Proposé :** Le moteur manque de force (il faut descendre un rapport)

**Pourquoi :** Même logique que B6 — traduire le concept, pas seulement le terme.

---

#### B9 — Pied sur embrayage 🟢

Conserver.

---

#### B10 — Regarder levier 🟢

Conserver.

---

## SC1.7 — Marche avant et marche arrière

#### M1 — Précision marche arrière 🟡

**Actuel :** Pourquoi la marche arrière demande-t-elle généralement plus de précision que la marche avant ?  
**Proposé :** Pourquoi la marche arrière est-elle plus difficile à diriger que la marche avant ?

**Pourquoi :** « Précision » est abstrait ; « difficile à diriger » parle l’expérience débutant.

---

#### M2 — Roues directrices 🟢

Conserver.

---

#### M3 — Petit mouvement volant 🔴

**Actuel :** Parce que le véhicule pivote autour des roues arrière  
**Proposé :** Parce qu’un petit tour de volant déplace beaucoup l’arrière du véhicule

**Pourquoi :** « Pivoter autour des roues arrière » est une explication mécanique ; le débutant doit retenir l’effet, pas la géométrie.

---

#### M4 — Vitesse / volant 🟡

**Actuel :** Plus précis et plus limités  
**Proposé :** Plus petits et plus doux

**Pourquoi :** « Limités » seul est ambigu ; préciser l’amplitude des gestes.

---

#### M5 — Regard 🟢

Conserver.

---

#### M6 — Marche arrière 🟢

Conserver.

---

#### M7 — Regard trop près 🟢

Conserver.

---

#### M8 — Allure faible 🟡

**Actuel :** De corriger plus facilement la trajectoire  
**Proposé :** D’avoir le temps de corriger la direction

**Pourquoi :** Relie vitesse lente → temps de réaction (logique débutant).

---

#### M9 — Véhicule suit le regard 🟡

**Actuel :** Le véhicule suit généralement : → Le regard du conducteur  
**Proposé :** Où regardez-vous pour guider le véhicule ? → **Loin, dans la direction où vous voulez aller**

**Pourquoi :** Formulation affirmative plus pédagogique que « le véhicule suit le regard » (formule abstraite).

---

#### M10 — Maîtrise trajectoire 🟢

Conserver.

---

## SC1.8 — Regarder autour de soi et avertir

| # | Statut | Modification |
|---|--------|--------------|
| R1 | 🟢 | Conserver |
| R2 | 🟡 | « Les angles morts correspondent : » → « Qu’est-ce qu’un angle mort ? » |
| R3 | 🟢 | Conserver |
| R4 | 🟢 | Conserver (Observer → avertir → agir) |
| R5 | 🟢 | Conserver |
| R6 | 🟡 | Reformuler sans guillemets piégeurs |
| R7 | 🟢 | Conserver |
| R8 | 🟢 | Conserver |
| R9 | 🟢 | Conserver |
| R10 | 🟢 | Conserver |

**R6 détail 🟡 :**  
**Actuel :** Pourquoi dit-on que “le clignotant n’est pas une priorité” ?  
**Proposé :** Le clignotant donne-t-il automatiquement la priorité ? → **Non : il informe les autres, sans leur imposer de céder le passage**

**Pourquoi :** Guillemets et formulation négative compliquent la lecture ; question directe oui/non plus claire pour un débutant.

---

## Annexe — Quiz lexique (`StudentLexiconPage.jsx`)

25 questions complémentaires (vocabulaire + panneaux). **Audit rapide :**

| # | Thème | Statut | Action |
|---|-------|--------|--------|
| L1 | Débrayer | 🟢 | Conserver |
| L2 | Angle mort | 🟡 | Distracteur « uniquement rétroviseurs » trop proche de la bonne réponse → « zone invisible même en tournant la tête » (faux) |
| L3–L5 | Voie insertion, rétrograder, clignotant | 🟢 | Conserver |
| L6 | **Décélérer** | 🔴 | **Actuel :** Relâcher l’accélérateur · **Proposé :** Réduire son allure (ralentir) — aligné sur la définition du lexique |
| L7–L9 | Frein moteur, freinages | 🟢 | Conserver |
| L10+ | Panneaux | 🟡 | Harmoniser : toujours commencer par « Que signifie… » ou « Que faut-il faire… » |

**L6 détail 🔴 :** La bonne réponse actuelle (« Relâcher l’accélérateur ») est un *moyen* de décélérer, pas la *définition*. Un débutant qui a lu le lexique sera pénalisé à tort.

---

## Règles de style proposées (uniformisation)

1. **Intitulé :** question directe, 8–14 mots, un seul objectif cognitif.
2. **Réponses :** 3 choix par défaut ; 4 choix seulement si indispensable (ex. ordre d’installation).
3. **Longueur réponses :** ≤ 12 mots ; même structure grammaticale entre distracteurs.
4. **Vocabulaire :** terme technique autorisé s’il est enseigné dans le module (tirer-glisser, point de patinage) avec rappel entre parenthèses la 1ère fois.
5. **Cohérence REMC :** chaque question mappe une sous-compétence ; pas de pièges hors objectif pédagogique.
6. **Explications :** phrase courte + conséquence concrète (« que faire »).

---

## Prochaines étapes recommandées

1. **Valider** cet audit avec l’équipe pédagogique (priorité 🔴 = 25 questions).
2. **Appliquer** les reformulations dans `StudentLessonsPage.jsx` et `StudentLexiconPage.jsx`.
3. **Ajouter** `aria-label` sur les QCU voyants nommant le témoin concerné.
4. **Harmoniser** le quiz lexique (L6 décélérer en priorité).
5. **Tester** avec 2–3 élèves première heure : taux de réussite sans aide du moniteur ≥ 70 % avant validation finale.

---

## Annexe B — Fiche complète question par question

Format : **Actuel** → **Proposé** → **Justification**

### SC1.4 — Démarrer et s’arrêter (détail)

**D1 🟢**  
Actuel : Le démarrage sans accélérateur est principalement utilisé : → Sur parking et en manœuvre  
Proposé : Identique  
Justification : Clair, vocabulaire adapté, aligné REMC SC1.4.

**D2 🟡**  
Actuel : Lors d’un démarrage avec accélération, le conducteur doit : → Trouver le point de patinage puis accélérer légèrement  
Proposé : Pour démarrer avec accélération, que faut-il faire ? → Trouver le point de patinage, puis accélérer un peu  
Justification : « Point de patinage » reste le terme enseigné ; « un peu » remplace « légèrement » (plus oral, niveau débutant).

**D3 🟢**  
Actuel : Le démarrage en côte permet principalement : → D’éviter le recul du véhicule  
Proposé : Identique  
Justification : Objectif concret, compréhensible immédiatement.

**D4 🟡**  
Actuel : Lors d’un démarrage en côte, le conducteur doit trouver : → Le point de patinage  
Proposé : En côte, quel « point » faut-il trouver avant de relâcher le frein ? → Le point de patinage  
Justification : Contextualise la question ; évite la répétition sèche « le conducteur doit trouver ».

**D5 🟢**  
Actuel : Le freinage progressif consiste à : → Freiner doucement au début puis augmenter progressivement la pression  
Proposé : Identique  
Justification : Définition exacte du cours ; distracteurs distincts.

**D6 🟡**  
Actuel : Le freinage dégressif consiste à : → Freiner fort au début puis relâcher progressivement la pression  
Proposé : Le freinage dégressif, c’est : → Freiner fort d’abord, puis relâcher petit à petit  
Justification : « Progressivement » → « petit à petit » ; même sens, langage plus accessible.

**D7 🟢**  
Actuel : Le freinage d’urgence est utilisé : → En cas de danger immédiat  
Proposé : Identique  
Justification : Formulation directe, pas d’ambiguïté.

**D8 🟢**  
Actuel : Lors d’un freinage d’urgence, le conducteur doit : → Appuyer à fond sur le frein et l’embrayage  
Proposé : Identique  
Justification : Aligné sécurité REMC ; distracteurs évidents.

**D9 🔴**  
Actuel : Le démarrage avec accélération est principalement utilisé : [dont « Véhicule moteur coupé »]  
Proposé : Le démarrage avec accélération sert surtout : → Sur route et dans la circulation  
Justification : Distracteur « moteur coupé » est une absurdité pédagogique — confond situation et usage.

**D10 🟡**  
Actuel : Lors d’un démarrage sans accélérateur, le véhicule avance grâce : → À la vitesse du moteur et au point de patinage  
Proposé : Sans accélérateur, le véhicule avance grâce : → Au moteur au ralenti et au point de patinage  
Justification : « Vitesse du moteur » prête à confusion avec vitesse du véhicule ; « ralenti » est le terme vécu en cabine.

---

### SC1.5 — Dosage pédales (détail)

**A1 🟢** — Actuel/Proposé identiques. Pédale = embrayage au démarrage : clair.

**A2 🟢** — Identique. Rôles embrayage bien listés.

**A3 🟢** — Identique. « Enfoncé à fond » = consigne REMC.

**A4 🟡**  
Actuel : Garder le pied sur l’embrayage peut : → Provoquer une perte de contrôle sur la vitesse  
Proposé : Garder le pied sur l’embrayage peut : → Faire avancer ou reculer le véhicule sans le vouloir  
Justification : Conséquence concrète vs formulation abstraite.

**A5 🟡** — Voir tableau module (puissance → force / 1ère vitesse).

**A6 🟢** — Identique.

**A7 🟢** — Identique.

**A8 🟢** — Identique.

**A9 🟢** — Identique.

**A10 🟢** — Identique.

---

### SC1.8 — Observer / avertir (détail)

**R1 🟢**  
Actuel : Pourquoi le conducteur doit-il contrôler régulièrement ses rétroviseurs ?  
Proposé : Identique  
Justification : Question claire, bonne réponse complète.

**R2 🟡**  
Actuel : Les angles morts correspondent : → Aux zones invisibles dans les rétroviseurs  
Proposé : Qu’est-ce qu’un angle mort ? → Une zone que les rétroviseurs ne montrent pas  
Justification : Formulation affirmative ; « invisibles dans les rétroviseurs » → langage plus simple.

**R3 🟢** — Identique.

**R4 🟢** — Identique. Séquence Observer → avertir → agir = REMC.

**R5 🟢** — Identique.

**R6 🟡** — Voir détail section SC1.8.

**R7 🟢** — Identique.

**R8 🟢** — Identique.

**R9 🟢** — Identique.

**R10 🟢** — Identique.

---

*Document généré à partir du code source — branche de travail mai 2026.*
