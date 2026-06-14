import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

const DEFAULT_FLEET_DETAILS = {
  mileage: 0,
  monthlyKm: 0,
  availability: 'Disponible',
  cleanliness: 'propre',
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
    return { vehicle: mapDbToFleetVehicle(data), error: null }
  } catch (error) {
    return { vehicle: null, error: toUserError(error, 'save') }
  }
}
