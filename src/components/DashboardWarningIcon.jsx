import iconAbs from '../assets/lessons/voyants/voyant-09-abs.png'
import iconBattery from '../assets/lessons/voyants/voyant-02-batterie.png'
import iconEngine from '../assets/lessons/voyants/voyant-03-moteur.png'
import iconEngineTemp from '../assets/lessons/voyants/voyant-10-temperature.png'
import iconHighBeam from '../assets/lessons/voyants/voyant-07-feux-route.png'
import iconLowBeam from '../assets/lessons/voyants/voyant-08-feux-croisement.png'
import iconOilPressure from '../assets/lessons/voyants/voyant-01-pression-huile.png'
import iconParkingBrake from '../assets/lessons/voyants/voyant-04-frein.png'
import iconSeatbelt from '../assets/lessons/voyants/voyant-06-ceinture.png'
import iconTirePressure from '../assets/lessons/voyants/voyant-05-pneus.png'

export const voyantImagesById = {
  'oil-pressure': iconOilPressure,
  battery: iconBattery,
  engine: iconEngine,
  'parking-brake': iconParkingBrake,
  'tire-pressure': iconTirePressure,
  seatbelt: iconSeatbelt,
  'high-beam': iconHighBeam,
  'low-beam': iconLowBeam,
  abs: iconAbs,
  'engine-temperature': iconEngineTemp,
}

export const dashboardWarningLights = [
  {
    id: 'oil-pressure',
    number: 1,
    title: 'Pression d’huile',
    description: 'Signale un manque de pression d’huile moteur.',
    severity: 'danger',
    action: 'Arrêt immédiat dès que possible : risque grave pour le moteur.',
    image: iconOilPressure,
  },
  {
    id: 'battery',
    number: 2,
    title: 'Batterie / charge',
    description: 'Indique un problème du système de charge ou de la batterie.',
    severity: 'danger',
    action: 'Contrôler rapidement : alternateur, batterie ou câblage.',
    image: iconBattery,
  },
  {
    id: 'engine',
    number: 3,
    title: 'Voyant moteur',
    description: 'Signale un dysfonctionnement moteur ou du système antipollution.',
    severity: 'warning',
    action: 'Faire contrôler le véhicule : le moteur peut passer en mode dégradé.',
    image: iconEngine,
  },
  {
    id: 'parking-brake',
    number: 4,
    title: 'Frein de stationnement / freinage',
    description:
      'Indique que le frein de stationnement est activé ou qu’un problème de freinage est détecté.',
    severity: 'danger',
    action: 'Vérifier le frein à main et l’état du circuit de freinage.',
    image: iconParkingBrake,
  },
  {
    id: 'tire-pressure',
    number: 5,
    title: 'Pression des pneus',
    description: 'Indique une pression insuffisante dans un ou plusieurs pneus.',
    severity: 'warning',
    action: 'Contrôler et regonfler les pneus : adhérence et freinage en jeu.',
    image: iconTirePressure,
  },
  {
    id: 'seatbelt',
    number: 6,
    title: 'Ceinture de sécurité',
    description: 'Indique que la ceinture de sécurité n’est pas bouclée.',
    severity: 'danger',
    action: 'Boucler la ceinture avant de repartir.',
    image: iconSeatbelt,
  },
  {
    id: 'high-beam',
    number: 7,
    title: 'Feux de route',
    description: 'Indique que les feux de route sont allumés.',
    severity: 'info',
    action: 'Passer en croisement face aux usagers ou en agglomération.',
    image: iconHighBeam,
  },
  {
    id: 'low-beam',
    number: 8,
    title: 'Feux de croisement',
    description: 'Indique l’activation des feux de croisement.',
    severity: 'info',
    action: 'Éclairage courant de circulation : à utiliser dès la tombée de la nuit.',
    image: iconLowBeam,
  },
  {
    id: 'abs',
    number: 9,
    title: 'ABS',
    description: 'Signale un défaut du système antiblocage des roues.',
    severity: 'warning',
    action: 'Freinage classique conservé, mais faire vérifier l’ABS rapidement.',
    image: iconAbs,
  },
  {
    id: 'engine-temperature',
    number: 10,
    title: 'Température moteur',
    description: 'Indique une surchauffe du moteur.',
    severity: 'danger',
    action: 'Arrêt sécurisé : risque de casse moteur ou de surpression.',
    image: iconEngineTemp,
  },
]

const severityRing = {
  danger: 'ring-rose-200/90',
  warning: 'ring-amber-200/90',
  info: 'ring-sky-200/90',
}

/**
 * Conteneur 72×72 px : fond blanc, icône PNG centrée sans déformation.
 */
export default function DashboardWarningIcon({
  type,
  alt,
  interactive = true,
  pulse = false,
  className = '',
}) {
  const src = voyantImagesById[type]
  if (!src) return null

  const light = dashboardWarningLights.find((item) => item.id === type)
  const label = alt || light?.title || 'Témoin du tableau de bord'

  return (
    <div
      className={[
        'dashboard-voyant-icon grid shrink-0 place-items-center overflow-visible rounded-2xl bg-white p-[10px] shadow-sm ring-1',
        severityRing[light?.severity] || 'ring-slate-300/80',
        interactive ? 'transition duration-300 ease-out hover:shadow-md' : '',
        pulse ? 'motion-safe:animate-[voyant-pulse_2s_ease-in-out_infinite]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: 72, height: 72, minWidth: 72, minHeight: 72 }}
    >
      <img
        alt={label}
        className={[
          'block h-full w-full max-h-full max-w-full object-contain object-center',
          interactive ? 'transition-transform duration-300 ease-out hover:scale-105' : '',
        ].join(' ')}
        decoding="async"
        draggable={false}
        loading="lazy"
        src={src}
      />
    </div>
  )
}
