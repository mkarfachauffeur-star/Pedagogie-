import { supabase } from '../lib/supabase'
import { assertOrgCanWrite } from '../lib/orgAccess'
import { toUserError } from '../lib/userFacingError'

const DEFAULT_FLEET_DETAILS = {
  mileage: 0,
  monthlyKm: 0,
  availability: 'Disponible',
  cleanliness: 'propre',
  gearbox: 'manuelle',
  tires: 'OK',
  oil: 'OK',
  coolant: 'OK',
  adblue: 'OK',
  fuelLevel: 100,
  averageConsumption: 0,
  estimatedRange: 0,
  generalState: 'Bon',
  interiorState: 'Propre',
  exteriorState: 'Bon',
  technicalControl: '',
  batteryLevel: 100,
  chargingStatus: 'Chargé',
}

export function createEmptyFleetVehicle() {
  return {
    id: null,
    brand: '',
    model: '',
    plate: '',
    energy: 'essence',
    ...DEFAULT_FLEET_DETAILS,
  }
}

export const VEHICLE_GEARBOX_OPTIONS = [
  { value: 'manuelle', label: 'Boîte manuelle' },
  { value: 'automatique', label: 'Boîte automatique' },
]

export function normalizeVehicleGearbox(value) {
  const normalized = String(value || 'manuelle').trim().toLowerCase()
  if (normalized === 'automatique' || normalized === 'auto') return 'automatique'
  return 'manuelle'
}

export function vehicleGearboxPlanningSuffix(gearbox) {
  return normalizeVehicleGearbox(gearbox) === 'automatique'
    ? '(boite automatique)'
    : '(boite manuel)'
}

export function formatVehiclePlanningLabel(vehicle) {
  if (!vehicle) return '—'
  const base = [vehicle.brand, vehicle.model, vehicle.plate].filter(Boolean).join(' · ') || 'Véhicule'
  return `${base} ${vehicleGearboxPlanningSuffix(vehicle.gearbox)}`
}

function mapDbToFleetVehicle(row) {
  const details = row.details || {}
  const fuelLogs = Array.isArray(details.fuelLogs) ? details.fuelLogs : []
  const maintenanceLogs = Array.isArray(details.maintenanceLogs) ? details.maintenanceLogs : []
  const { fuelLogs: _fuelLogs, maintenanceLogs: _maintenanceLogs, ...fleetDetails } = details

  return {
    id: row.id,
    brand: row.brand || '',
    model: row.model || '',
    plate: row.plate || '',
    energy: row.energy || 'essence',
    fuelLogs,
    maintenanceLogs,
    ...DEFAULT_FLEET_DETAILS,
    ...fleetDetails,
  }
}

function mapFleetToDb(vehicle, organizationId) {
  const {
    id,
    brand,
    model,
    plate,
    energy,
    ...details
  } = vehicle

  return {
    ...(id ? { id } : {}),
    organization_id: organizationId,
    brand: brand.trim(),
    model: model.trim(),
    plate: plate.trim().toUpperCase(),
    energy: energy || 'essence',
    details,
  }
}

export async function listFleetVehicles() {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, brand, model, plate, energy, details, created_at')
      .order('created_at', { ascending: true })
    if (error) throw error
    return { vehicles: (data || []).map(mapDbToFleetVehicle), error: null }
  } catch (error) {
    return { vehicles: [], error }
  }
}

export async function saveFleetVehicle(vehicle, organizationId) {
  try {
    await assertOrgCanWrite()
    const row = mapFleetToDb(vehicle, organizationId)
    if (vehicle.id) {
      const { id: _id, ...updateRow } = row
      const { data, error } = await supabase
        .from('vehicles')
        .update(updateRow)
        .eq('id', vehicle.id)
        .select('id, brand, model, plate, energy, details')
        .single()
      if (error) throw error
      return { vehicle: mapDbToFleetVehicle(data), error: null }
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert(row)
      .select('id, brand, model, plate, energy, details')
      .single()
    if (error) throw error
    const vehicle = mapDbToFleetVehicle(data)
    if (organizationId) {
      const { trackFirstVehicleMilestone } = await import('../lib/analytics')
      void trackFirstVehicleMilestone(organizationId)
    }
    return { vehicle, error: null }
  } catch (error) {
    return { vehicle: null, error: toUserError(error, 'save') }
  }
}
