// Données extraites du PDF officiel banque-verifications-23_01_2023.pdf.
// Les doublons sont aussi filtrés dans l’interface via normalizeQuestion().

export const permitVerificationQuestions = [
  {
    "id": "verif-001",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez la commande De réglage de hauteur des feux.",
    "answer": "Dispositif situé en général à gauche du volant."
  },
  {
    "id": "secu-001",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Pourquoi doit-on régler la hauteur des feux?",
    "answer": "Pour ne pas éblouir les autres usagers."
  },
  {
    "id": "secours-001",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Comment et pourquoi protéger une zone de danger en cas d’accident de la route?",
    "answer": "En délimitant clairement et largement la zone de danger de façon visible pour protéger les victimes et éviter un sur-accident."
  },
  {
    "id": "verif-002",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où s'effectue le remplissage du produit lave-glace.",
    "answer": "Le candidat ouvre le capot et montre le bocal. Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-002",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Pourquoi est-il préférable d'utiliser un liquide spécial en hiver?",
    "answer": "Pour éviter le gel du liquide."
  },
  {
    "id": "secours-002",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quels comportements adopter en cas de diffusion du signal d’alerte du Système d’Alerte et d’Information des Populations (SAIP)?",
    "answer": "- Se mettre en sécurité. - S'informer grâce aux médias et sites internet des autorités dès que leur consultation est possible. - Respecter les consignes des autorités."
  },
  {
    "id": "verif-003",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Mettez le rétroviseur intérieur en position \"nuit\".",
    "answer": "Si le rétroviseur de l'accompagnateur gène la manipulation du dispositif, l'explication suffit. Si le véhicule possède un système automatique de mise en position \"nuit\" du rétroviseur intérieur, le candidat l'indique."
  },
  {
    "id": "secu-003",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est l’intérêt de la position nuit?",
    "answer": "Ne pas être ébloui par les feux du véhicule suiveur."
  },
  {
    "id": "secours-003",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Comment est composé le signal d’alerte du Système d’Alerte et d’Information des Populations (SAIP) diffusé par les sirènes?",
    "answer": "Il se compose de deux codes distincts: - le Signal National d’Alerte (SNA), variation du signal sur trois cycles successifs. - Le signal de fin d’alerte, signal continu."
  },
  {
    "id": "verif-004",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état du flanc sur l'un des pneumatiques.",
    "answer": "En bon état (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-004",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Citez un endroit où l'on peut trouver les pressions préconisées pour les pneumatiques?",
    "answer": "Elles sont indiquées: - soit sur une plaque sur une portière. - soit dans la notice d'utilisation du véhicule. - soit au niveau de la trappe à carburant."
  },
  {
    "id": "secours-004",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Sur autoroute, comment indiquer avec précision les lieux de l’accident depuis un téléphone portable?",
    "answer": "En indiquant le numéro de l’autoroute, le sens de circulation et le point kilométrique."
  },
  {
    "id": "verif-005",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Faites fonctionner les essuie-glaces avants du véhicule sur la position la plus rapide.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-005",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Comment détecter leur usure en circulation?",
    "answer": "En cas de pluie, lorsqu'ils laissent des traces sur le pare brise."
  },
  {
    "id": "secours-005",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Comment vérifier la respiration d’une victime?",
    "answer": "Regarder si le ventre et la poitrine se soulèvent et sentir de l’air à l’expiration."
  },
  {
    "id": "verif-006",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Vérifiez l'état et la propreté des plaques d'immatriculation.",
    "answer": "Vérification des plaques à l'avant et à l'arrière, propres et en bon état (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-006",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les précautions à prendre en cas d'installation d'un porte vélo?",
    "answer": "La plaque d'immatriculation et les feux doivent être visibles."
  },
  {
    "id": "secours-006",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Qu’est ce qu’une perte de connaissance?",
    "answer": "C’est lorsque la victime ne répond pas et ne réagit pas mais respire."
  },
  {
    "id": "verif-007",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Vérifiez la présence du gilet de haute visibilité.",
    "answer": "Le candidat doit indiquer où il se trouve sans obligation de le sortir. Le terme \" gilet jaune\" peut être utilisé si le candidat ne comprend pas."
  },
  {
    "id": "secu-007",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "En cas de panne ou d'accident, quel autre accessoire de sécurité est obligatoire?",
    "answer": "Le triangle de pré-signalisation."
  },
  {
    "id": "secours-007",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Si un dégagement d'urgence de la victime est nécessaire, où doit- elle être déplacée?",
    "answer": "Dans un endroit suffisamment éloigné du danger et de ses conséquences."
  },
  {
    "id": "verif-008",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où s'effectue le contrôle du niveau du liquide de frein.",
    "answer": "Le candidat montre que le niveau est entre le mini et le maxi. Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-008",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la conséquence d'un niveau insuffisant du liquide de frein?",
    "answer": "Une perte d'efficacité du freinage."
  },
  {
    "id": "secours-008",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "En cas de panne ou d’accident, quel équipement de sécurité doit être porté avant de quitter le véhicule?",
    "answer": "Il faut porter le gilet de haute visibilité avant de sortir du véhicule. Le terme \" gilet jaune\" peut être utilisé par le candidat."
  },
  {
    "id": "verif-009",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Vérifiez la présence du certificat d'immatriculation du véhicule (ou carte grise).",
    "answer": "La photocopie est acceptée."
  },
  {
    "id": "secu-009",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quels sont les deux autres documents obligatoires à présenter en cas de contrôle par les forces de l'ordre?",
    "answer": "L’attestation d'assurance et le permis de conduire."
  },
  {
    "id": "secours-009",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Pourquoi l’alerte auprès des services de secours doit-elle être rapide et précise?",
    "answer": "Pour permettre aux services de secours d'apporter les moyens adaptés aux victimes dans le délai le plus court."
  },
  {
    "id": "verif-010",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état de tous les balais d'essuie-glace du véhicule.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-010",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le risque de circuler avec des balais d'essuie glace défectueux?",
    "answer": "Une mauvaise visibilité en cas d'intempéries."
  },
  {
    "id": "secours-010",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quels sont les numéros d’urgence à composer?",
    "answer": "- Le 18, numéro d'appel des sapeurs-pompiers. - Le 15, numéro d'appel des SAMU. – Le 112, numéro de téléphone réservé aux appels d’urgence et valide dans l’ensemble de l’Union Européenne."
  },
  {
    "id": "verif-011",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez l'indicateur de niveau de carburant.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-011",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les précautions à prendre lors du remplissage du réservoir?",
    "answer": "Arrêter le moteur, ne pas fumer, ne pas téléphoner."
  },
  {
    "id": "secours-011",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quels comportements adopter en présence d’une victime qui ne répond pas et ne réagit pas, mais respire?",
    "answer": "- La placer en position stable sur le côté ou position latérale de sécurité. - Alerter les secours. - Surveiller la respiration de la victime jusqu'à l'arrivée des secours."
  },
  {
    "id": "verif-012",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où s'effectue le remplissage du liquide de refroidissement.",
    "answer": "Le candidat ouvre le capot et montre le bocal. Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-012",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le danger si l'on complète le niveau du liquide lorsque le moteur est chaud?",
    "answer": "Un risque de brûlure."
  },
  {
    "id": "secours-012",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Comment arrêter une hémorragie?",
    "answer": "En appuyant fortement sur l’endroit qui saigne avec les doigts ou avec la paume de la main en mettant un tissu propre sur la plaie."
  },
  {
    "id": "verif-013",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Actionnez le dégivrage de la lunette arrière et montrez le voyant ou le repère correspondant.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-013",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle peut être la conséquence d'une panne de dégivrage de la lunette arrière?",
    "answer": "Une insuffisance ou une absence de visibilité vers l'arrière. Question 1 ers secours suivante"
  },
  {
    "id": "secours-013",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Hors autoroute ou endroit dangereux, en cas de panne ou d’accident, où doit être placé le triangle de pré-signalisation?",
    "answer": "Le triangle de pré-signalisation doit être placé à une distance d’environ 30 m de la panne ou de l’accident, ou avant un virage, ou un sommet de côte."
  },
  {
    "id": "verif-014",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état, la propreté et le fonctionnement de tous les clignotants côté trottoir.",
    "answer": "Vérification des clignotants propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-014",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la signification d'un clignotement plus rapide?",
    "answer": "Non fonctionnement de l'une des ampoules."
  },
  {
    "id": "secours-014",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quelles sont les conditions pour réaliser le dégagement d’urgence d’une victime en présence d’un danger réel, immédiat et non contrôlable?",
    "answer": "La victime doit être visible, facile à atteindre et rien ne doit gêner son dégagement. Il faut être sûr(e) de pouvoir réaliser le dégagement de la victime."
  },
  {
    "id": "verif-015",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez le voyant d'alerte signalant une pression insuffisante d'huile dans le moteur.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-015",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les conditions à respecter pour contrôler le niveau d'huile?",
    "answer": "Moteur froid et sur un terrain plat."
  },
  {
    "id": "secours-015",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quelles sont les trois informations à transmettre aux services de secours?",
    "answer": "Le numéro de téléphone à partir duquel l’appel est émis, la nature et la localisation la plus précise du problème."
  },
  {
    "id": "verif-016",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état, la propreté et le fonctionnement du ou des feux de brouillard arrière.",
    "answer": "Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-016",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Dans quels cas les utilise-t-on?",
    "answer": "Par temps de brouillard et neige."
  },
  {
    "id": "secours-016",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Par quels moyens doit être réalisée l’alerte des secours?",
    "answer": "L’alerte doit être donnée à l’aide d’un téléphone portable ou, à défaut, d’un téléphone fixe ou d’une borne d’appel d’urgence."
  },
  {
    "id": "verif-017",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Vérifiez la présence de l’éthylotest.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-017",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "A partir de quel taux d'alcoolémie, en période de permis probatoire, est-on en infraction?",
    "answer": "0,2 g /l, c'est à dire 0 verre, car dès le 1er verre ce seuil peut être dépassé."
  },
  {
    "id": "secours-017",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quel comportement doit-on adopter en présence d’une victime en arrêt cardiaque?",
    "answer": "- ALERTER: alerter immédiatement les secours. - MASSER: pratiquer une réanimation cardio-pulmonaire. - DEFIBRILLER: utiliser un défibrillateur automatique (DAE) si possible."
  },
  {
    "id": "verif-018",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état, la propreté et le fonctionnement des feux de détresse à l'avant et à l'arrière.",
    "answer": "Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-018",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Dans quels cas doit-on les utiliser?",
    "answer": "En cas de panne, d’accident ou de ralentissement important."
  },
  {
    "id": "secours-018",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Dans quel cas peut-on positionner une victime en Position Latérale de Sécurité (PLS)?",
    "answer": "Si la victime ne répond pas, ne réagit pas et respire. Question 1 ers secours suivante"
  },
  {
    "id": "verif-019",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez la commande de réglage du volant.",
    "answer": "Le candidat montre l'emplacement. Il ne lui est pas demandé de changer son réglage."
  },
  {
    "id": "secu-019",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Pourquoi est-il important de bien régler son volant?",
    "answer": "Citez deux exemples. - Le confort de conduite. - L’accessibilité aux commandes. - La visibilité du tableau de bord. - L’efficacité des airbags."
  },
  {
    "id": "secours-019",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Dans quelle situation peut-on déplacer une victime?",
    "answer": "En présence d’un danger réel, immédiat, non contrôlable. Le déplacement de la victime doit rester exceptionnel."
  },
  {
    "id": "verif-020",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état, la propreté et le fonctionnement des feux de route.",
    "answer": "Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-020",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Citez un cas d'utilisation de l’appel lumineux.",
    "answer": "- Pour avertir de son approche. - En cas de danger. - A la place de l'avertisseur sonore."
  },
  {
    "id": "verif-021",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Positionnez la commande pour diriger l'air vers le pare-brise.",
    "answer": "La position auto (désembuage automatique) peut être utilisée si le véhicule en est équipé."
  },
  {
    "id": "secu-021",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Citez deux éléments complémentaires permettant un désembuage efficace.",
    "answer": "- La commande de vitesse de ventilation. - La commande d'air chaud. - La climatisation."
  },
  {
    "id": "secours-021",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quel est l’objectif du Signal d’Alerte et d’Information des Populations (SAIP)?",
    "answer": "Avertir la population d’un danger imminent ou qu’un événement grave est en train de se produire."
  },
  {
    "id": "verif-022",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où doit s'effectuer le contrôle du niveau d'huile moteur.",
    "answer": "Le candidat montre la jauge. Pas de manipulation exigée. Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-022",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le principal risque d'un manque d'huile moteur?",
    "answer": "Un risque de détérioration ou de casse du moteur."
  },
  {
    "id": "secours-022",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Comment est diffusée l’alerte émise par le Signal d’Alerte et d’Information aux Populations (SAIP)?",
    "answer": "Grâce aux sirènes, aux médias tels que Radio France et France Télévision ou encore grâce à l’application SAIP."
  },
  {
    "id": "verif-023",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez le voyant d'alerte signalant un défaut de batterie.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-023",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Qu'est-ce qui peut provoquer la décharge de la batterie, moteur éteint?",
    "answer": "Les feux ou accessoires électriques en fonctionnement."
  },
  {
    "id": "secours-023",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "A partir de quel âge peut-on suivre une formation aux premiers secours?",
    "answer": "A partir de 10 ans."
  },
  {
    "id": "verif-024",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez l'emplacement de la batterie du véhicule.",
    "answer": "Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-024",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la solution en cas de panne de batterie pour démarrer le véhicule sans le déplacer?",
    "answer": "Brancher une deuxième batterie en parallèle (ou les \"+\" ensemble et les \"-\" ensemble) ou la remplacer."
  },
  {
    "id": "secours-024",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Pourquoi faut-il pratiquer immédiatement une réanimation cardio-pulmonaire sur une victime en arrêt cardiaque?",
    "answer": "Car les lésions du cerveau, surviennent dès les premières minutes."
  },
  {
    "id": "verif-025",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "De quelle couleur est le voyant qui indique une défaillance du système de freinage?",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-025",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le risque de circuler avec un frein de parking mal desserré?",
    "answer": "Une dégradation du système de freinage."
  },
  {
    "id": "verif-026",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état, la propreté et le fonctionnement des feux de croisement.",
    "answer": "Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-026",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les conséquences d'un mauvais réglage de ces feux?",
    "answer": "Une mauvaise vision vers l'avant et un risque d'éblouissement des autres usagers."
  },
  {
    "id": "verif-027",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez le voyant d'alerte signalant une température trop élevée du liquide de refroidissement.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-027",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la conséquence d'une température trop élevée de ce liquide?",
    "answer": "Une surchauffe ou une casse moteur."
  },
  {
    "id": "secours-027",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Lors d’un appel avec les services de secours, pourquoi devez-vous attendre que votre correspondant vous autorise à raccrocher?",
    "answer": "Car il peut nous conseiller ou nous guider dans la réalisation des gestes à faire, ou ne pas faire, jusqu’à l’arrivée des secours."
  },
  {
    "id": "verif-028",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Vérifiez l'état et la propreté des dispositifs réfléchissants.",
    "answer": "Vérification des dispositifs, propres et en bon état (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-028",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est l'utilité des dispositifs réfléchissants?",
    "answer": "Rendre visible le véhicule la nuit."
  },
  {
    "id": "secours-028",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "A quel moment pouvez-vous mettre fin à un appel avec les secours?",
    "answer": "Uniquement lorsque notre correspondant nous invite à le faire."
  },
  {
    "id": "verif-029",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez le voyant signalant la mauvaise fermeture d'une portière.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-029",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle précaution dois-je prendre pour que les enfants installés à l'arrière ne puissent pas ouvrir leur portière?",
    "answer": "Actionner la sécurité enfant sur les deux portières arrière."
  },
  {
    "id": "secours-029",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Citez les trois manières d’évaluer l’état de conscience d’une victime.",
    "answer": "Lui poser des questions simples, lui secouer doucement les épaules et lui prendre la main en lui demandant d’exécuter un geste simple."
  },
  {
    "id": "verif-030",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Contrôlez l'état, la propreté et le fonctionnement des feux de position à l'avant et à l'arrière du véhicule.",
    "answer": "Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-030",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Par temps clair, à quelle distance doivent-ils être visibles?",
    "answer": "A 150 mètres."
  },
  {
    "id": "secours-030",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quels sont les risques pour une personne en perte de connaissance qui est allongée sur le dos?",
    "answer": "L’arrêt respiratoire et l’arrêt cardiaque."
  },
  {
    "id": "verif-031",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Actionnez les feux de détresse.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-031",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quand les utilise-t-on?",
    "answer": "En cas de panne, d’accident ou de ralentissement important."
  },
  {
    "id": "verif-032",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Sur le flanc d’un pneumatique, désignez le repère du témoin d'usure de la bande de roulement.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-032",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Qu'est-ce que l'aquaplanage, et quelle peut être sa conséquence?",
    "answer": "La présence d'un film d'eau entre le pneumatique et la chaussée pouvant entraîner une perte de contrôle du véhicule."
  },
  {
    "id": "verif-033",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez la commande permettant d’actionner le régulateur de vitesse.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-033",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Sans actionner la commande du régulateur, comment le désactiver rapidement?",
    "answer": "En appuyant sur la pédale de frein ou d'embrayage."
  },
  {
    "id": "verif-034",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Ouvrez la trappe à carburant et/ou vérifiez la bonne fermeture du bouchon.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "verif-035",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Sans l'actionner, montrez la commande de l'avertisseur sonore.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-035",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Dans quel cas peut-on utiliser l'avertisseur sonore en agglomération?",
    "answer": "En cas de danger immédiat. 1ers secours Réponse 35 Pourquoi ne faut-il pas laisser une personne en perte de connaissance allongée sur le dos? Car elle risque un étouffement par: - Des liquides présents dans la gorge. - La chute de la langue en arrière."
  },
  {
    "id": "verif-036",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où s'effectue le remplissage de l'huile moteur.",
    "answer": "Le candidat montre le bouchon de remplissage. Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-036",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le risque d'un manque d'huile moteur?",
    "answer": "Un risque de détérioration ou de casse du moteur."
  },
  {
    "id": "secours-036",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "L’utilisation d’un Défibrillateur Automatisé (DAE) sur une victime qui n’est pas en arrêt cardiaque présente-t-elle un risque?",
    "answer": "Non, car le défibrillateur se déclenche uniquement quand la victime est en arrêt cardiaque."
  },
  {
    "id": "verif-037",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez la commande permettant de désactiver l'airbag du passager avant.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-037",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Dans quelle situation doit-on le désactiver?",
    "answer": "Lors du transport d'un enfant à l'avant dans un siège auto, dos à la route."
  },
  {
    "id": "verif-038",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "A l'aide de la plaque indicative, donnez la pression préconisée pour les pneumatiques arrières, véhicule chargé.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-038",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "A quelle fréquence est-il préconisé de vérifier la pression des pneus?",
    "answer": "Chaque mois, pour une utilisation normale de son véhicule, et avant chaque long trajet."
  },
  {
    "id": "verif-039",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez le voyant signalant l'absence de bouclage de la ceinture de sécurité du conducteur.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-039",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "En règle générale, à partir de quel âge un enfant peut-il être installé sur le siège passager avant du véhicule?",
    "answer": "10 ans."
  },
  {
    "id": "verif-040",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Vérifiez le fonctionnement de l'éclairage de la plaque d'immatriculation à l'arrière.",
    "answer": "Toute anomalie doit être signalée."
  },
  {
    "id": "secu-040",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Un défaut d'éclairage de la plaque lors du contrôle technique entraîne-t-il une contre-visite?",
    "answer": "Oui."
  },
  {
    "id": "verif-041",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Vérifiez la présence de l'attestation d'assurance du véhicule et de sa vignette sur le pare-brise.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secours-041",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Qu’est ce qu’une hémorragie?",
    "answer": "C’est une perte de sang prolongée qui ne s’arrête pas. Elle imbibe de sang un mouchoir en quelques secondes."
  },
  {
    "id": "verif-042",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Indiquez où se situe la sécurité enfant sur l'une des portières à l’arrière du véhicule.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-042",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Si la sécurité enfant est enclenchée, est-il possible d'ouvrir la portière arrière depuis l'extérieur?",
    "answer": "Oui."
  },
  {
    "id": "secours-042",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quels sont les risques pour une personne victime d’une hémorragie?",
    "answer": "Entraîner pour la victime une détresse circulatoire ou un arrêt cardiaque."
  },
  {
    "id": "verif-043",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Allumez le(s) feu(x) de brouillard arrière(s) et montrez le voyant correspondant.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-043",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Pouvez-vous les utiliser par forte pluie?",
    "answer": "Non."
  },
  {
    "id": "secours-043",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quels sont les signes d’un arrêt cardiaque?",
    "answer": "La victime ne répond pas, ne réagit pas et ne respire pas ou présente une respiration anormale."
  },
  {
    "id": "verif-044",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Avec l'assistance de l'accompagnateur, contrôlez l'état, la propreté et le fonctionnement du ou des feux de recul.",
    "answer": "Vérification des feux, propres, en bon état et qui fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-044",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont leurs deux utilités?",
    "answer": "- Éclairer la zone de recul la nuit. - Avertir les autres usagers de la manœuvre."
  },
  {
    "id": "secours-044",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Qu’est ce qu’un défibrillateur automatisé externe (DAE)?",
    "answer": "C’est un appareil qui peut permettre de rétablir une activité cardiaque normale à une victime en arrêt cardiaque."
  },
  {
    "id": "verif-045",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez comment régler la hauteur de l'appui-tête du siège conducteur.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-045",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est son utilité?",
    "answer": "Permet de retenir le mouvement de la tête en cas de choc et de limiter les blessures."
  },
  {
    "id": "verif-046",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Avec l'assistance de l'accompagnateur, contrôlez l'état, la propreté et le fonctionnement des feux de stop.",
    "answer": "Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-046",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la conséquence en cas de panne des feux de stop?",
    "answer": "Un manque d'information pour les usagers suiveurs et un risque de collision."
  },
  {
    "id": "verif-047",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "De quelle couleur est le voyant qui indique au conducteur que le feu de brouillard arrière est allumé?",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-047",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la différence entre un voyant orange et un voyant rouge?",
    "answer": "- Rouge: Une anomalie de fonctionnement ou un danger. - Orange: un élément important."
  },
  {
    "id": "secours-047",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Qu’est ce qu’un arrêt cardiaque?",
    "answer": "Le cœur ne fonctionne plus ou fonctionne d’une façon anarchique."
  },
  {
    "id": "verif-048",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Ouvrez et refermez le capot, puis vérifiez sa bonne fermeture.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-048",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "En roulant, quel est le risque d'une mauvaise fermeture du capot?",
    "answer": "Un risque d'ouverture du capot pouvant entraîner un accident."
  },
  {
    "id": "secours-048",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quel est le risque principal d’un arrêt cardiaque sans intervention des secours?",
    "answer": "La mort de la victime qui survient en quelques minutes."
  },
  {
    "id": "verif-049",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez la commande de recyclage de l'air.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-049",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel peut être le risque de maintenir le recyclage de l’air de manière prolongée?",
    "answer": "Un risque de mauvaise visibilité par l’apparition de buée sur les surfaces vitrées."
  },
  {
    "id": "verif-050",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez l'orifice de remplissage du produit lave-glace.",
    "answer": "Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-050",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le principal risque d'une absence de liquide lave-glace?",
    "answer": "Une mauvaise visibilité."
  },
  {
    "id": "verif-051",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Allumez les feux de route et montrez le voyant correspondant.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-051",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quel est le risque de maintenir les feux de route lors d'un croisement avec d'autres usagers?",
    "answer": "Un risque d'éblouissement des autres usagers."
  },
  {
    "id": "verif-052",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Vérifiez l'état, la propreté et le fonctionnement des feux diurnes.",
    "answer": "Vérification des feux, propres, en bon état et qui fonctionnent (toute anomalie doit être signalée)."
  },
  {
    "id": "secu-052",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est leur utilité?",
    "answer": "Rendre le véhicule plus visible le jour."
  },
  {
    "id": "verif-053",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Vérifiez la présence du constat amiable dans le véhicule.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-053",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "En cas d'accident, dans quel délai doit-il être transmis à l'assureur?",
    "answer": "5 jours."
  },
  {
    "id": "verif-054",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Vérifiez la présence du triangle de pré-signalisation.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-054",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Utilise-t-on le triangle de pré-signalisation sur autoroute?",
    "answer": "Non."
  },
  {
    "id": "verif-056",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où s'effectue le changement d'une ampoule à l'avant du véhicule.",
    "answer": "Si le candidat a des difficultés pour ouvrir le capot, l'accompagnateur peut lui indiquer comment procéder."
  },
  {
    "id": "secu-056",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les conséquences en cas de panne d'un feu de croisement?",
    "answer": "Une mauvaise visibilité et le risque d'être confondu avec un deux roues."
  },
  {
    "id": "secours-056",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Citez les trois manières d’évaluer l’état de conscience d’une victime?",
    "answer": "- Lui poser des questions simples (\"comment ça va?\", \"vous m'entendez?\"). - Lui secouer doucement les épaules. - Lui prendre la main en lui demandant d'exécuter un geste simple (\"serrez-moi la main\")."
  },
  {
    "id": "verif-057",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Si le véhicule en est équipé, montrez la commande du limiteur de vitesse.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-057",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est l'utilité d'un limiteur de vitesse?",
    "answer": "Ne pas dépasser la vitesse programmée par le conducteur. 1ers secours Réponse 57 Quels sont les numéros d’urgence à appeler? - Le 18, numéro d'appel des sapeurs-pompiers. - Le 15, numéro d'appel des SAMU. – Le 112, numéro de téléphone réservé aux appels d’urgence et valide dans l’ensemble de l’Union Européenne."
  },
  {
    "id": "verif-058",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où s'effectue le changement d'une ampoule à l'arrière du véhicule.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-058",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les conséquences en cas de panne d'un feu de position arrière?",
    "answer": "Être mal vu et un risque de collision."
  },
  {
    "id": "verif-059",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Faites fonctionner l’essuie-glace arrière du véhicule.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-059",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Pour une bonne visibilité vers l’arrière, en plus de l’utilisation de l’essuie-glace, quelle commande pouvez-vous actionner par temps de pluie?",
    "answer": "La commande de désembuage arrière. Le terme dégivrage peut remplacer celui de désembuage."
  },
  {
    "id": "verif-060",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Ouvrez et refermez le coffre, puis vérifiez sa bonne fermeture.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-060",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Lorsque vous transportez un poids important dans le coffre, quelles sont les précautions à prendre en ce qui concerne les pneumatiques et l'éclairage avant?",
    "answer": "Augmenter la pression des pneumatiques et régler la hauteur des feux avants."
  },
  {
    "id": "verif-061",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Indiquez où se situe les attaches de type Isofix dans le véhicule.",
    "answer": "Pour info: les attaches de type Isofix sont obligatoires sur les véhicules neufs depuis 2011."
  },
  {
    "id": "secu-061",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Peut-on fixer tous les sièges enfant sur des attaches de type Isofix?",
    "answer": "Non (uniquement ceux compatibles avec ce type d’attache). Question 1 ers secours suivante"
  },
  {
    "id": "secu-062",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quels sont les risques de circuler avec des objets sur la plage arrière?",
    "answer": "Une mauvaise visibilité vers l'arrière et un risque de projection en cas de freinage brusque ou de choc."
  },
  {
    "id": "verif-063",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez sur le tableau de bord le voyant indiquant une baisse de pression d’air d’un pneumatique.",
    "answer": "Pour info: obligatoire sur tous les véhicules neufs mis en circulation à compter du 01/11/2014."
  },
  {
    "id": "secu-063",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "A quelle fréquence est-il préconisé de vérifier la pression d’air des pneumatiques?",
    "answer": "Tous les mois."
  },
  {
    "id": "verif-064",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Procédez à l’ouverture du capot puis à sa fermeture en vous assurant de son verrouillage.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-064",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Pour un capot s’ouvrant depuis l’avant du véhicule, quelle est l’utilité du dispositif de sécurité?",
    "answer": "Empêcher l’ouverture du capot en circulation en cas de mauvais verrouillage."
  },
  {
    "id": "verif-066",
    "source": "VE",
    "category": "Vérifications extérieures",
    "question": "Montrez où se situent les gicleurs de lave-glace avant.",
    "answer": "Réponse à vérifier avec l’enseignant."
  },
  {
    "id": "secu-066",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelle est la principale conséquence d’un dispositif de lave-glace défaillant?",
    "answer": "Une mauvaise visibilité due à l’impossibilité de nettoyer le pare-brise."
  },
  {
    "id": "secu-069",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Comment détecte-t-on leur usure en circulation?",
    "answer": "En cas de pluie, lorsqu'ils laissent des traces sur le pare brise."
  },
  {
    "id": "secours-074",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "Quelles sont les précautions à prendre pour réaliser le dégagement d’urgence d’une victime en présence d’un danger réel, immédiat et non contrôlable?",
    "answer": "La victime doit être visible, facile à atteindre et rien ne doit gêner son dégagement. Il faut être sûr(e) de pouvoir réaliser le dégagement de la victime."
  },
  {
    "id": "secu-075",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Quelles sont les conditions à respecter pour compléter le niveau d'huile?",
    "answer": "Moteur froid et sur un terrain plat."
  },
  {
    "id": "secu-078",
    "source": "QSER",
    "category": "Questions en lien avec la sécurité routière",
    "question": "Citez un cas d'utilisation d'un appel lumineux.",
    "answer": "- Pour avertir de son approche. - En cas de danger. - A la place de l'avertisseur sonore."
  },
  {
    "id": "secours-081",
    "source": "Premiers secours",
    "category": "Premiers secours",
    "question": "En général, en cas de panne ou d’accident, où doit être placé le triangle de pré-signalisation?",
    "answer": "Le triangle de pré-signalisation doit être placé à une distance d’environ 30 m de la panne ou de l’accident, ou avant un virage ou un sommet de côte."
  },
  {
    "id": "verif-099",
    "source": "VI",
    "category": "Vérifications intérieures",
    "question": "Montrez le voyant indiquant une baisse de pression d’air d’un pneumatique?",
    "answer": "Pour info: obligatoire sur tous les véhicules neufs mis en circulation à compter du 01/11/2014."
  }
]
