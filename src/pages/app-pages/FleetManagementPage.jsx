import { useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'

const initialVehicles = []

const initialFuelLogs = []

const initialMaintenanceLogs = []

const teachers = []
const fuelTypes = ['SP95', 'SP98', 'Diesel', 'Recharge électrique', 'Hybride']
const maintenanceTypes = [
  'Lavage intérieur',
  'Lavage extérieur',
  'Contrôle pneus',
  'Contrôle huile/liquides',
  'Vidange',
  'Réparations',
  'Dégâts signalés',
]

const emptyFuelForm = {
  vehicleId: '',
  teacher: '',
  date: new Date().toISOString().slice(0, 10),
  mileage: '',
  fuelType: 'SP95',
  liters: '',
  kwh: '',
  price: '',
  station: '',
  observations: '',
  ticketPhoto: '',
}

const emptyMaintenanceForm = {
  vehicleId: '',
  type: 'Lavage extérieur',
  date: new Date().toISOString().slice(0, 10),
  reporter: '',
  observations: '',
  photo: '',
}

export default function FleetManagementPage({ role = 'secretary' }) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [fuelLogs, setFuelLogs] = useState(initialFuelLogs)
  const [maintenanceLogs, setMaintenanceLogs] = useState(initialMaintenanceLogs)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [modal, setModal] = useState(null)
  const [fuelForm, setFuelForm] = useState(emptyFuelForm)
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenanceForm)
  const [vehicleForm, setVehicleForm] = useState(null)

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || vehicles[0]

  const stats = useMemo(() => {
    const thermalVehicleIds = vehicles.filter((vehicle) => !isElectric(vehicle)).map((vehicle) => vehicle.id)
    const thermalFuelLogs = fuelLogs.filter((log) => thermalVehicleIds.includes(log.vehicleId))
    const totalFuelCost = thermalFuelLogs.reduce((sum, log) => sum + Number(log.price || 0), 0)
    const totalKm = vehicles.reduce((sum, vehicle) => sum + vehicle.monthlyKm, 0)
    const vehicleCosts = vehicles.map((vehicle) => ({
      label: `${vehicle.brand} ${vehicle.model}`,
      value: isElectric(vehicle)
        ? 0
        : fuelLogs
            .filter((log) => log.vehicleId === vehicle.id)
            .reduce((sum, log) => sum + Number(log.price || 0), 0),
    }))
    const teacherCosts = teachers.map((teacher) => ({
      label: teacher,
      value: thermalFuelLogs
        .filter((log) => log.teacher === teacher)
        .reduce((sum, log) => sum + Number(log.price || 0), 0),
    }))
    const mostUsed = [...vehicles].sort((a, b) => b.monthlyKm - a.monthlyKm)[0]
    const highestConsumption = [...vehicles]
      .filter((vehicle) => !isElectric(vehicle))
      .sort((a, b) => b.averageConsumption - a.averageConsumption)[0]

    return {
      totalFuelCost,
      totalKm,
      costPerKm: totalKm ? totalFuelCost / totalKm : 0,
      vehicleCosts,
      teacherCosts,
      mostUsed,
      highestConsumption,
    }
  }, [fuelLogs, vehicles])

  const selectedFuelLogs = fuelLogs.filter((log) => log.vehicleId === selectedVehicle?.id)
  const selectedMaintenanceLogs = maintenanceLogs.filter((log) => log.vehicleId === selectedVehicle?.id)
  const fuelFormVehicle = vehicles.find((vehicle) => vehicle.id === fuelForm.vehicleId) || selectedVehicle
  const fuelFormIsElectric = isElectric(fuelFormVehicle)

  const openVehicleModal = () => {
    if (!selectedVehicle) return
    setVehicleForm(selectedVehicle)
    setModal('vehicle')
  }

  const openFuelModal = (vehicleId = selectedVehicle?.id) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId) || selectedVehicle
    setFuelForm({ ...emptyFuelForm, vehicleId: vehicle?.id ?? '', mileage: vehicle ? String(vehicle.mileage) : '' })
    setModal('fuel')
  }

  const openMaintenanceModal = (vehicleId = selectedVehicle?.id) => {
    setMaintenanceForm({ ...emptyMaintenanceForm, vehicleId: vehicleId ?? '' })
    setModal('maintenance')
  }

  const saveVehicle = (event) => {
    event.preventDefault()
    setVehicles((current) =>
      current.map((vehicle) => (vehicle.id === vehicleForm.id ? vehicleForm : vehicle)),
    )
    setModal(null)
  }

  const saveFuel = (event) => {
    event.preventDefault()
    const vehicle = vehicles.find((item) => item.id === fuelForm.vehicleId)
    const electric = vehicle ? isElectric(vehicle) : false
    const mileage = Number(fuelForm.mileage || vehicle?.mileage || 0)
    const kmDelta = Math.max(1, mileage - Number(vehicle?.mileage || mileage - 1))
    const liters = Number(fuelForm.liters || 0)
    const kwh = Number(fuelForm.kwh || 0)
    const nextLog = {
      ...fuelForm,
      id: Date.now(),
      mileage,
      liters,
      kwh,
      price: electric ? 0 : Number(fuelForm.price || 0),
      kmDelta,
      ticketPhoto: fuelForm.ticketPhoto || (electric ? 'justificatif-recharge.jpg' : 'ticket-simule.jpg'),
    }

    setFuelLogs((current) => [nextLog, ...current])
    setVehicles((current) =>
      current.map((item) => {
        if (item.id !== fuelForm.vehicleId) return item
        const nextConsumption = liters ? Number(((liters / kmDelta) * 100).toFixed(1)) : item.averageConsumption
        if (isElectric(item)) {
          return {
            ...item,
            mileage,
            batteryLevel: 100,
            chargingStatus: 'Chargé',
            estimatedRange: Math.max(item.estimatedRange, Math.round(kmDelta * 0.9)),
            monthlyKm: item.monthlyKm + kmDelta,
          }
        }
        return {
          ...item,
          mileage,
          fuelLevel: 100,
          estimatedRange: Math.round((100 / Math.max(nextConsumption, 1)) * 55),
          averageConsumption: nextConsumption,
          monthlyKm: item.monthlyKm + kmDelta,
        }
      }),
    )
    setSelectedVehicleId(fuelForm.vehicleId)
    setModal(null)
  }

  const saveMaintenance = (event) => {
    event.preventDefault()
    const nextLog = {
      ...maintenanceForm,
      id: Date.now(),
      photo: maintenanceForm.photo || '',
    }

    setMaintenanceLogs((current) => [nextLog, ...current])
    setVehicles((current) =>
      current.map((vehicle) => {
        if (vehicle.id !== maintenanceForm.vehicleId) return vehicle
        if (maintenanceForm.type.includes('Lavage')) return { ...vehicle, cleanliness: 'propre', interiorState: 'Propre', exteriorState: 'Bon' }
        if (maintenanceForm.type.includes('pneus')) return { ...vehicle, tires: 'OK' }
        if (maintenanceForm.type.includes('huile')) return { ...vehicle, oil: 'OK', coolant: 'OK', adblue: 'OK' }
        if (maintenanceForm.type.includes('Dégâts')) return { ...vehicle, generalState: 'À surveiller', availability: 'Maintenance' }
        return vehicle
      }),
    )
    setSelectedVehicleId(maintenanceForm.vehicleId)
    setModal(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Hero role={role} onFuel={() => openFuelModal()} onMaintenance={() => openMaintenanceModal()} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Véhicules suivis" value={vehicles.length} />
        <Kpi label="Coût carburant mois" value={`${stats.totalFuelCost.toFixed(2)} EUR`} tone="amber" />
        <Kpi label="Kilomètres mois" value={`${stats.totalKm} km`} tone="emerald" />
        <Kpi label="Coût moyen/km" value={`${stats.costPerKm.toFixed(2)} EUR`} tone="cyan" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Flotte auto-école</h2>
              <p className="mt-1 text-sm text-slate-500">Cliquez un véhicule pour ouvrir sa fiche complète.</p>
            </div>
            <button
              className="rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
              onClick={openVehicleModal}
              type="button"
            >
              Modifier la fiche
            </button>
          </div>

          {!vehicles.length ? (
            <EmptyState
              className="mt-5"
              title="Aucun véhicule enregistré"
              message="Aucun véhicule enregistré pour le moment. Ajoutez un véhicule pour suivre votre flotte."
              icon="🚗"
            />
          ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <button
                className={`rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                  selectedVehicleId === vehicle.id
                    ? 'border-cyan-300 bg-cyan-50 shadow-lg ring-4 ring-cyan-100'
                    : 'border-slate-200 bg-white'
                }`}
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{vehicle.brand} {vehicle.model}</h3>
                    <p className="text-sm font-bold text-slate-500">{vehicle.plate}</p>
                  </div>
                  <StatusBadge value={vehicle.availability} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniInfo label="Km" value={`${vehicle.mileage.toLocaleString('fr-FR')}`} />
                  {isElectric(vehicle) ? (
                    <>
                      <MiniInfo label="Batterie" value={`${vehicle.batteryLevel}%`} />
                      <MiniInfo label="Recharge" value={vehicle.chargingStatus} />
                    </>
                  ) : (
                    <>
                      <FuelLevelBar value={vehicle.fuelLevel} compact />
                      <MiniInfo label="Conso" value={`${vehicle.averageConsumption} L/100`} />
                    </>
                  )}
                  <MiniInfo label="Propreté" value={vehicle.cleanliness} />
                </div>
              </button>
            ))}
          </div>
          )}
        </div>

        <aside className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Fiche véhicule</p>
          {!selectedVehicle ? (
            <EmptyState
              className="mt-4"
              title="Aucun véhicule sélectionné"
              message="Ajoutez un véhicule pour afficher sa fiche détaillée."
              icon="🚗"
            />
          ) : (
          <>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            {selectedVehicle.brand} {selectedVehicle.model}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{selectedVehicle.plate}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="État général" value={selectedVehicle.generalState} />
            <Info label="Intérieur" value={selectedVehicle.interiorState} />
            <Info label="Extérieur" value={selectedVehicle.exteriorState} />
            <Info label="Pneus" value={selectedVehicle.tires} />
            {isElectric(selectedVehicle) ? (
              <>
                <Info label="Batterie" value={`${selectedVehicle.batteryLevel}%`} />
                <Info label="État de recharge" value={selectedVehicle.chargingStatus} />
              </>
            ) : (
              <>
                <FuelLevelBar value={selectedVehicle.fuelLevel} />
                <Info label="Consommation moyenne" value={`${selectedVehicle.averageConsumption} L/100`} />
                <Info label="Huile" value={selectedVehicle.oil} />
                <Info label="Liquide refroidissement" value={selectedVehicle.coolant} />
                {selectedVehicle.energy === 'diesel' && <Info label="AdBlue" value={selectedVehicle.adblue} />}
              </>
            )}
            <Info label="Autonomie" value={`${selectedVehicle.estimatedRange} km`} />
            <Info label="Contrôle technique" value={formatDate(selectedVehicle.technicalControl)} />
          </div>

          <div className="mt-5 grid gap-2">
            <button className="rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700" onClick={() => openFuelModal(selectedVehicle.id)} type="button">
              {isElectric(selectedVehicle) ? 'Ajouter une recharge' : 'Ajouter un plein'}
            </button>
            <button className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-100" onClick={() => openMaintenanceModal(selectedVehicle.id)} type="button">
              Ajouter entretien / dégât
            </button>
          </div>
          </>
          )}
        </aside>
      </section>

      <section>
        <HistoryPanel fuelLogs={selectedFuelLogs} maintenanceLogs={selectedMaintenanceLogs} selectedVehicle={selectedVehicle} vehicles={vehicles} />
      </section>

      <ManagerStats stats={stats} vehicles={vehicles} fuelLogs={fuelLogs} />

      {modal === 'fuel' && (
        <Modal title={fuelFormIsElectric ? 'Ajouter une recharge' : 'Ajouter un plein carburant'} onClose={() => setModal(null)}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveFuel}>
            <Select label="Véhicule" onChange={(value) => setFuelForm((current) => ({ ...current, vehicleId: value }))} options={vehicles.map((vehicle) => ({ label: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`, value: vehicle.id }))} value={fuelForm.vehicleId} />
            <Select label="Enseignant" onChange={(value) => setFuelForm((current) => ({ ...current, teacher: value }))} options={teachers} value={fuelForm.teacher} />
            <Field label="Date" onChange={(value) => setFuelForm((current) => ({ ...current, date: value }))} type="date" value={fuelForm.date} />
            <Field label="Kilométrage" onChange={(value) => setFuelForm((current) => ({ ...current, mileage: value }))} type="number" value={fuelForm.mileage} />
            {fuelFormIsElectric ? (
              <>
                <Field label="kWh ajoutés" onChange={(value) => setFuelForm((current) => ({ ...current, kwh: value, fuelType: 'Recharge électrique' }))} type="number" value={fuelForm.kwh} />
                <Field label="Borne de recharge" onChange={(value) => setFuelForm((current) => ({ ...current, station: value }))} value={fuelForm.station} />
                <FileField label="Photo du justificatif de recharge" onChange={(value) => setFuelForm((current) => ({ ...current, ticketPhoto: value }))} value={fuelForm.ticketPhoto} />
              </>
            ) : (
              <>
                <Select label="Type carburant" onChange={(value) => setFuelForm((current) => ({ ...current, fuelType: value }))} options={fuelTypes.filter((type) => type !== 'Recharge électrique')} value={fuelForm.fuelType} />
                <Field label="Litres ajoutés" onChange={(value) => setFuelForm((current) => ({ ...current, liters: value }))} type="number" value={fuelForm.liters} />
                <Field label="Prix total payé (EUR)" onChange={(value) => setFuelForm((current) => ({ ...current, price: value }))} type="number" value={fuelForm.price} />
                <Field label="Station service" onChange={(value) => setFuelForm((current) => ({ ...current, station: value }))} value={fuelForm.station} />
                <FileField label="Photo du ticket carburant" onChange={(value) => setFuelForm((current) => ({ ...current, ticketPhoto: value }))} value={fuelForm.ticketPhoto} />
              </>
            )}
            <Field className="md:col-span-2" label="Observations" onChange={(value) => setFuelForm((current) => ({ ...current, observations: value }))} value={fuelForm.observations} />
            <SubmitButton label={fuelFormIsElectric ? 'Enregistrer la recharge' : 'Enregistrer le plein'} />
          </form>
        </Modal>
      )}

      {modal === 'maintenance' && (
        <Modal title="Ajouter entretien ou dégât" onClose={() => setModal(null)}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveMaintenance}>
            <Select label="Véhicule" onChange={(value) => setMaintenanceForm((current) => ({ ...current, vehicleId: value }))} options={vehicles.map((vehicle) => ({ label: `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`, value: vehicle.id }))} value={maintenanceForm.vehicleId} />
            <Select label="Type intervention" onChange={(value) => setMaintenanceForm((current) => ({ ...current, type: value }))} options={maintenanceTypes} value={maintenanceForm.type} />
            <Field label="Date intervention" onChange={(value) => setMaintenanceForm((current) => ({ ...current, date: value }))} type="date" value={maintenanceForm.date} />
            <Select label="Signalé par" onChange={(value) => setMaintenanceForm((current) => ({ ...current, reporter: value }))} options={teachers} value={maintenanceForm.reporter} />
            <FileField label="Photos dégâts / intervention" onChange={(value) => setMaintenanceForm((current) => ({ ...current, photo: value }))} value={maintenanceForm.photo} />
            <Field className="md:col-span-2" label="Observations" onChange={(value) => setMaintenanceForm((current) => ({ ...current, observations: value }))} value={maintenanceForm.observations} />
            <SubmitButton label="Enregistrer intervention" />
          </form>
        </Modal>
      )}

      {modal === 'vehicle' && vehicleForm && (
        <Modal title="Modifier la fiche véhicule" onClose={() => setModal(null)}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveVehicle}>
            <Field label="Marque" onChange={(value) => setVehicleForm((current) => ({ ...current, brand: value }))} value={vehicleForm.brand} />
            <Field label="Modèle" onChange={(value) => setVehicleForm((current) => ({ ...current, model: value }))} value={vehicleForm.model} />
            <Field label="Immatriculation" onChange={(value) => setVehicleForm((current) => ({ ...current, plate: value }))} value={vehicleForm.plate} />
            <Field label="Kilométrage actuel" onChange={(value) => setVehicleForm((current) => ({ ...current, mileage: Number(value) }))} type="number" value={String(vehicleForm.mileage)} />
            <Select label="Disponibilité véhicule" onChange={(value) => setVehicleForm((current) => ({ ...current, availability: value }))} options={['Disponible', 'En leçon', 'Maintenance', 'Indisponible']} value={vehicleForm.availability} />
            <Select label="Propreté" onChange={(value) => setVehicleForm((current) => ({ ...current, cleanliness: value }))} options={['propre', 'à nettoyer', 'urgent lavage']} value={vehicleForm.cleanliness} />
            <Select label="État pneus" onChange={(value) => setVehicleForm((current) => ({ ...current, tires: value }))} options={['OK', 'À vérifier', 'À remplacer']} value={vehicleForm.tires} />
            {isElectric(vehicleForm) ? (
              <>
                <Field label="Niveau batterie (%)" onChange={(value) => setVehicleForm((current) => ({ ...current, batteryLevel: Number(value) }))} type="number" value={String(vehicleForm.batteryLevel || 0)} />
                <Field label="État de recharge" onChange={(value) => setVehicleForm((current) => ({ ...current, chargingStatus: value }))} value={vehicleForm.chargingStatus || ''} />
              </>
            ) : (
              <Field label="Niveau carburant (%)" onChange={(value) => setVehicleForm((current) => ({ ...current, fuelLevel: Number(value) }))} type="number" value={String(vehicleForm.fuelLevel)} />
            )}
            <Field label="Contrôle technique" onChange={(value) => setVehicleForm((current) => ({ ...current, technicalControl: value }))} type="date" value={vehicleForm.technicalControl} />
            <SubmitButton label="Sauvegarder la fiche" />
          </form>
        </Modal>
      )}
    </div>
  )
}

function Hero({ onFuel, onMaintenance, role }) {
  const roleLabel = role === 'manager' ? 'Gérant' : role === 'teacher' ? 'Enseignant' : 'Secrétariat'

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
        <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          {roleLabel}
        </span>
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Gestion des véhicules</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50">
              Suivi complet de flotte auto-école : état, carburant, entretien, alertes et coûts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-navy-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white" onClick={onFuel} type="button">
              + Ajouter un plein
            </button>
            <button className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15" onClick={onMaintenance} type="button">
              + Entretien / dégâts
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function HistoryPanel({ fuelLogs, maintenanceLogs, selectedVehicle, vehicles }) {
  const electric = isElectric(selectedVehicle)

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-2xl font-extrabold text-slate-950">Historique du véhicule sélectionné</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="font-black text-slate-900">{electric ? 'Historique de recharge' : 'Pleins carburant'}</h3>
          <div className="mt-3 space-y-3">
            {fuelLogs.map((log) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={log.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-slate-950">{formatDate(log.date)} · {log.teacher}</p>
                    <p className="text-sm text-slate-500">{log.station} · {log.fuelType} · {log.ticketPhoto}</p>
                  </div>
                  {!electric && <p className="font-black text-cyan-700">{Number(log.price).toFixed(2)} EUR</p>}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {electric
                    ? `${log.kwh || 0} kWh · ${log.kmDelta} km parcourus`
                    : `${log.liters} L · ${log.kmDelta} km · ${log.liters ? ((log.liters / log.kmDelta) * 100).toFixed(1) : '0'} L/100`}
                </p>
              </article>
            ))}
            {!fuelLogs.length && <InlineNotice label={electric ? 'Aucune recharge enregistrée pour ce véhicule.' : 'Aucun plein enregistré pour ce véhicule.'} />}
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Entretien et dégâts</h3>
          <div className="mt-3 space-y-3">
            {maintenanceLogs.map((log) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={log.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-slate-950">{log.type}</p>
                    <p className="text-sm text-slate-500">{formatDate(log.date)} · {log.reporter}</p>
                  </div>
                  {log.photo && <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">photo</span>}
                </div>
                <p className="mt-2 text-sm text-slate-600">{log.observations}</p>
              </article>
            ))}
            {!maintenanceLogs.length && <InlineNotice label="Aucune intervention enregistrée." />}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-400">
        Flotte suivie : {vehicles.map((vehicle) => vehicle.plate).join(', ')}
      </p>
    </section>
  )
}

function ManagerStats({ fuelLogs, stats, vehicles }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-950">Statistiques Gérant</h2>
          <p className="mt-1 text-sm text-slate-500">Coûts, kilométrage, utilisation et historique enseignant/véhicule.</p>
        </div>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
          {fuelLogs.length} opérations carburant
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Info label="Véhicule le plus utilisé" value={stats.mostUsed ? `${stats.mostUsed.brand} ${stats.mostUsed.model} · ${stats.mostUsed.monthlyKm} km` : '—'} />
        <Info label="Consomme le plus" value={stats.highestConsumption ? `${stats.highestConsumption.brand} ${stats.highestConsumption.model} · ${stats.highestConsumption.averageConsumption} L/100` : '—'} />
        <Info label="Historique flotte" value={`${vehicles.reduce((sum, vehicle) => sum + vehicle.mileage, 0).toLocaleString('fr-FR')} km cumulés`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <BarChart title="Coût par véhicule" items={stats.vehicleCosts} suffix="EUR" />
        <BarChart title="Coût par enseignant" items={stats.teacherCosts} suffix="EUR" />
      </div>
    </section>
  )
}

function BarChart({ items, suffix, title }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-black text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-bold text-slate-600">{item.label}</span>
              <span className="font-black text-slate-900">{item.value.toFixed(2)} {suffix}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
      <div className="pointer-events-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Gestion flotte</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">{title}</h2>
          </div>
          <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50" onClick={onClose} type="button">
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Kpi({ label, tone = 'cyan', value }) {
  const color = tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-cyan-600'
  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </article>
  )
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function FuelLevelBar({ compact = false, value = 0 }) {
  const level = Math.max(0, Math.min(100, Number(value) || 0))
  const status =
    level <= 20
      ? { label: 'Critique', bar: 'from-rose-600 to-red-400', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' }
      : level <= 40
        ? { label: 'Faible', bar: 'from-amber-500 to-orange-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' }
        : { label: 'Correct', bar: 'from-emerald-600 to-green-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' }

  return (
    <div className={`rounded-2xl border ${status.border} ${status.bg} ${compact ? 'px-3 py-2' : 'p-3'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Carburant</p>
        <span className={`rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black ${status.text}`}>
          {status.label}
        </span>
      </div>
      <div className={`${compact ? 'mt-2 h-2' : 'mt-3 h-3'} overflow-hidden rounded-full bg-white/80 shadow-inner`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${status.bar} transition-all duration-500`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function StatusBadge({ value }) {
  const style = value === 'Disponible' ? 'bg-emerald-50 text-emerald-700' : value === 'Maintenance' || value === 'Indisponible' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>{value}</span>
}

function Field({ className = '', label, onChange, type = 'text', value }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  )
}

function FileField({ label, onChange, value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="mt-2 min-h-12 w-full rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-navy-950 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.files?.[0]?.name || '')} type="file" />
      {value && <span className="mt-2 block text-xs font-bold text-cyan-700">Fichier sélectionné : {value}</span>}
    </label>
  )
}

function Select({ label, onChange, options, value }) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option,
  )

  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} value={value}>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function SubmitButton({ label }) {
  return (
    <div className="md:col-span-2 flex justify-end">
      <button className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700" type="submit">
        {label}
      </button>
    </div>
  )
}

function InlineNotice({ label }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">{label}</p>
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function isElectric(vehicle) {
  return vehicle?.energy === 'électrique'
}
