/**
 * Travel Optimization Service
 * Handles location management and travel time calculations
 *
 * @module services/travel-optimization
 */
import { getDbClient } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('travel-optimization-service');

interface ClientLocationData {
  clientId: string;
  addressType?: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state?: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  accessInstructions?: string;
  parkingNotes?: string;
  gateCode?: string;
}

interface CaregiverLocationData {
  caregiverId: string;
  streetAddress: string;
  city: string;
  state?: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  maxTravelDistanceMiles?: number;
  preferredAreas?: string[];
  hasReliableTransportation?: boolean;
  transportationType?: string;
}

class TravelOptimizationService {
  // Earth's radius in miles for Haversine calculation
  private readonly EARTH_RADIUS_MILES = 3959;

  /**
   * Get client location
   */
  async getClientLocation(clientId: string): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT cl.*,
        c.first_name || ' ' || c.last_name AS client_name
      FROM client_locations cl
      JOIN clients c ON c.id = cl.client_id
      WHERE cl.client_id = $1 AND cl.is_active = TRUE
      ORDER BY
        CASE cl.address_type WHEN 'primary' THEN 1 WHEN 'secondary' THEN 2 ELSE 3 END
      LIMIT 1
    `,
      [clientId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all client locations for an organization
   */
  async getClientLocations(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT cl.*,
        c.first_name || ' ' || c.last_name AS client_name
      FROM client_locations cl
      JOIN clients c ON c.id = cl.client_id
      WHERE c.organization_id = $1 AND cl.is_active = TRUE
      ORDER BY c.last_name, c.first_name
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Create or update client location
   */
  async upsertClientLocation(data: ClientLocationData): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO client_locations (
        client_id,
        address_type,
        street_address,
        apartment,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        access_instructions,
        parking_notes,
        gate_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (client_id) WHERE address_type = $2
      DO UPDATE SET
        street_address = EXCLUDED.street_address,
        apartment = EXCLUDED.apartment,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        access_instructions = EXCLUDED.access_instructions,
        parking_notes = EXCLUDED.parking_notes,
        gate_code = EXCLUDED.gate_code,
        updated_at = NOW()
      RETURNING *
    `,
      [
        data.clientId,
        data.addressType || 'primary',
        data.streetAddress,
        data.apartment,
        data.city,
        data.state || 'OH',
        data.zipCode,
        data.latitude,
        data.longitude,
        data.accessInstructions,
        data.parkingNotes,
        data.gateCode,
      ]
    );

    // Invalidate travel cache for this client
    await this.invalidateTravelCache('client', data.clientId);

    return result.rows[0];
  }

  /**
   * Get caregiver location
   */
  async getCaregiverLocation(caregiverId: string): Promise<any | null> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT cl.*,
        c.first_name || ' ' || c.last_name AS caregiver_name
      FROM caregiver_locations cl
      JOIN caregivers c ON c.id = cl.caregiver_id
      WHERE cl.caregiver_id = $1 AND cl.is_active = TRUE
    `,
      [caregiverId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all caregiver locations for an organization
   */
  async getCaregiverLocations(organizationId: string): Promise<any[]> {
    const db = await getDbClient();

    const result = await db.query(
      `
      SELECT cl.*,
        c.first_name || ' ' || c.last_name AS caregiver_name
      FROM caregiver_locations cl
      JOIN caregivers c ON c.id = cl.caregiver_id
      WHERE c.organization_id = $1 AND cl.is_active = TRUE
      ORDER BY c.last_name, c.first_name
    `,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Create or update caregiver location
   */
  async upsertCaregiverLocation(data: CaregiverLocationData): Promise<any> {
    const db = await getDbClient();

    const result = await db.query(
      `
      INSERT INTO caregiver_locations (
        caregiver_id,
        street_address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        max_travel_distance_miles,
        preferred_areas,
        has_reliable_transportation,
        transportation_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (caregiver_id)
      DO UPDATE SET
        street_address = EXCLUDED.street_address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        max_travel_distance_miles = EXCLUDED.max_travel_distance_miles,
        preferred_areas = EXCLUDED.preferred_areas,
        has_reliable_transportation = EXCLUDED.has_reliable_transportation,
        transportation_type = EXCLUDED.transportation_type,
        updated_at = NOW()
      RETURNING *
    `,
      [
        data.caregiverId,
        data.streetAddress,
        data.city,
        data.state || 'OH',
        data.zipCode,
        data.latitude,
        data.longitude,
        data.maxTravelDistanceMiles || 25,
        JSON.stringify(data.preferredAreas || []),
        data.hasReliableTransportation !== false,
        data.transportationType || 'car',
      ]
    );

    // Invalidate travel cache for this caregiver
    await this.invalidateTravelCache('caregiver_home', data.caregiverId);

    return result.rows[0];
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(this.EARTH_RADIUS_MILES * c * 100) / 100;
  }

  /**
   * Estimate travel time based on distance
   */
  estimateTravelTime(distanceMiles: number, routeType: string = 'driving'): number {
    // Average speeds in MPH
    const speeds: Record<string, number> = {
      driving: 25, // Urban driving average
      transit: 15, // Public transit with stops
      walking: 3, // Walking
    };

    const speed = speeds[routeType] || speeds.driving;
    return Math.ceil((distanceMiles / speed) * 60); // Minutes
  }

  /**
   * Get or calculate travel time between two locations
   */
  async getTravelTime(
    fromType: string,
    fromId: string,
    toType: string,
    toId: string
  ): Promise<{ travelTimeMinutes: number; distanceMiles: number } | null> {
    const db = await getDbClient();

    // Check cache first
    const cacheResult = await db.query(
      `
      SELECT travel_time_minutes, distance_miles
      FROM travel_time_cache
      WHERE from_location_type = $1
        AND from_location_id = $2
        AND to_location_type = $3
        AND to_location_id = $4
        AND expires_at > NOW()
    `,
      [fromType, fromId, toType, toId]
    );

    if (cacheResult.rows.length > 0) {
      return {
        travelTimeMinutes: cacheResult.rows[0].travel_time_minutes,
        distanceMiles: parseFloat(cacheResult.rows[0].distance_miles),
      };
    }

    // Calculate from coordinates
    let fromLat: number | null = null;
    let fromLon: number | null = null;
    let toLat: number | null = null;
    let toLon: number | null = null;

    if (fromType === 'caregiver_home') {
      const loc = await this.getCaregiverLocation(fromId);
      if (loc) {
        fromLat = loc.latitude;
        fromLon = loc.longitude;
      }
    } else if (fromType === 'client') {
      const loc = await this.getClientLocation(fromId);
      if (loc) {
        fromLat = loc.latitude;
        fromLon = loc.longitude;
      }
    }

    if (toType === 'caregiver_home') {
      const loc = await this.getCaregiverLocation(toId);
      if (loc) {
        toLat = loc.latitude;
        toLon = loc.longitude;
      }
    } else if (toType === 'client') {
      const loc = await this.getClientLocation(toId);
      if (loc) {
        toLat = loc.latitude;
        toLon = loc.longitude;
      }
    }

    if (fromLat === null || fromLon === null || toLat === null || toLon === null) {
      return null;
    }

    const distanceMiles = this.calculateDistance(fromLat, fromLon, toLat, toLon);
    const travelTimeMinutes = this.estimateTravelTime(distanceMiles);

    // Cache the result
    await db.query(
      `
      INSERT INTO travel_time_cache (
        from_location_type, from_location_id,
        to_location_type, to_location_id,
        travel_time_minutes, distance_miles,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')
      ON CONFLICT (from_location_type, from_location_id, to_location_type, to_location_id)
      DO UPDATE SET
        travel_time_minutes = EXCLUDED.travel_time_minutes,
        distance_miles = EXCLUDED.distance_miles,
        calculated_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days'
    `,
      [fromType, fromId, toType, toId, travelTimeMinutes, distanceMiles]
    );

    return { travelTimeMinutes, distanceMiles };
  }

  /**
   * Find caregivers within range of a client
   */
  async findCaregiversInRange(
    organizationId: string,
    clientId: string,
    maxDistanceMiles?: number
  ): Promise<any[]> {
    const db = await getDbClient();

    const clientLoc = await this.getClientLocation(clientId);
    if (!clientLoc || !clientLoc.latitude || !clientLoc.longitude) {
      return [];
    }

    const result = await db.query(
      `
      SELECT
        c.id AS caregiver_id,
        c.first_name || ' ' || c.last_name AS caregiver_name,
        cl.latitude,
        cl.longitude,
        cl.max_travel_distance_miles,
        calculate_distance_miles($3, $4, cl.latitude, cl.longitude) AS distance_miles
      FROM caregivers c
      JOIN caregiver_locations cl ON cl.caregiver_id = c.id
      WHERE c.organization_id = $1
        AND c.status = 'active'
        AND cl.is_active = TRUE
        AND cl.latitude IS NOT NULL
        AND cl.longitude IS NOT NULL
        AND calculate_distance_miles($3, $4, cl.latitude, cl.longitude) <=
            COALESCE($2, cl.max_travel_distance_miles, 25)
      ORDER BY distance_miles
    `,
      [organizationId, maxDistanceMiles, clientLoc.latitude, clientLoc.longitude]
    );

    return result.rows;
  }

  /**
   * Calculate total travel for a route (series of visits)
   */
  async calculateRouteTravel(
    caregiverId: string,
    clientIds: string[]
  ): Promise<{
    totalMiles: number;
    totalMinutes: number;
    segments: Array<{ from: string; to: string; miles: number; minutes: number }>;
  }> {
    const segments: Array<{ from: string; to: string; miles: number; minutes: number }> = [];
    let totalMiles = 0;
    let totalMinutes = 0;

    // First segment: caregiver home to first client
    if (clientIds.length > 0) {
      const firstTravel = await this.getTravelTime('caregiver_home', caregiverId, 'client', clientIds[0]);
      if (firstTravel) {
        segments.push({
          from: 'home',
          to: clientIds[0],
          miles: firstTravel.distanceMiles,
          minutes: firstTravel.travelTimeMinutes,
        });
        totalMiles += firstTravel.distanceMiles;
        totalMinutes += firstTravel.travelTimeMinutes;
      }
    }

    // Middle segments: between clients
    for (let i = 0; i < clientIds.length - 1; i++) {
      const travel = await this.getTravelTime('client', clientIds[i], 'client', clientIds[i + 1]);
      if (travel) {
        segments.push({
          from: clientIds[i],
          to: clientIds[i + 1],
          miles: travel.distanceMiles,
          minutes: travel.travelTimeMinutes,
        });
        totalMiles += travel.distanceMiles;
        totalMinutes += travel.travelTimeMinutes;
      }
    }

    // Last segment: last client back to home
    if (clientIds.length > 0) {
      const lastTravel = await this.getTravelTime(
        'client',
        clientIds[clientIds.length - 1],
        'caregiver_home',
        caregiverId
      );
      if (lastTravel) {
        segments.push({
          from: clientIds[clientIds.length - 1],
          to: 'home',
          miles: lastTravel.distanceMiles,
          minutes: lastTravel.travelTimeMinutes,
        });
        totalMiles += lastTravel.distanceMiles;
        totalMinutes += lastTravel.travelTimeMinutes;
      }
    }

    return {
      totalMiles: Math.round(totalMiles * 100) / 100,
      totalMinutes,
      segments,
    };
  }

  /**
   * Find optimal order for visiting clients (simple nearest neighbor)
   */
  async optimizeRoute(
    caregiverId: string,
    clientIds: string[]
  ): Promise<{
    optimizedOrder: string[];
    originalMiles: number;
    optimizedMiles: number;
    savingsMiles: number;
    savingsMinutes: number;
  }> {
    if (clientIds.length <= 2) {
      const original = await this.calculateRouteTravel(caregiverId, clientIds);
      return {
        optimizedOrder: clientIds,
        originalMiles: original.totalMiles,
        optimizedMiles: original.totalMiles,
        savingsMiles: 0,
        savingsMinutes: 0,
      };
    }

    // Calculate original route
    const original = await this.calculateRouteTravel(caregiverId, clientIds);

    // Simple nearest neighbor algorithm
    const optimizedOrder: string[] = [];
    const remaining = [...clientIds];

    // Start from caregiver home, find nearest client
    let currentLoc = { type: 'caregiver_home', id: caregiverId };

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const travel = await this.getTravelTime(
          currentLoc.type,
          currentLoc.id,
          'client',
          remaining[i]
        );
        if (travel && travel.distanceMiles < nearestDistance) {
          nearestDistance = travel.distanceMiles;
          nearestIdx = i;
        }
      }

      optimizedOrder.push(remaining[nearestIdx]);
      currentLoc = { type: 'client', id: remaining[nearestIdx] };
      remaining.splice(nearestIdx, 1);
    }

    // Calculate optimized route
    const optimized = await this.calculateRouteTravel(caregiverId, optimizedOrder);

    return {
      optimizedOrder,
      originalMiles: original.totalMiles,
      optimizedMiles: optimized.totalMiles,
      savingsMiles: Math.round((original.totalMiles - optimized.totalMiles) * 100) / 100,
      savingsMinutes: original.totalMinutes - optimized.totalMinutes,
    };
  }

  /**
   * Get travel statistics for organization
   */
  async getTravelStats(organizationId: string): Promise<any> {
    const db = await getDbClient();

    // Locations with geocoding
    const locationStats = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM client_locations cl
         JOIN clients c ON c.id = cl.client_id
         WHERE c.organization_id = $1 AND cl.is_active = TRUE) AS total_client_locations,
        (SELECT COUNT(*) FROM client_locations cl
         JOIN clients c ON c.id = cl.client_id
         WHERE c.organization_id = $1 AND cl.is_active = TRUE AND cl.latitude IS NOT NULL) AS geocoded_clients,
        (SELECT COUNT(*) FROM caregiver_locations cl
         JOIN caregivers cg ON cg.id = cl.caregiver_id
         WHERE cg.organization_id = $1 AND cl.is_active = TRUE) AS total_caregiver_locations,
        (SELECT COUNT(*) FROM caregiver_locations cl
         JOIN caregivers cg ON cg.id = cl.caregiver_id
         WHERE cg.organization_id = $1 AND cl.is_active = TRUE AND cl.latitude IS NOT NULL) AS geocoded_caregivers
    `,
      [organizationId]
    );

    // Cache stats
    const cacheStats = await db.query(
      `
      SELECT
        COUNT(*) AS cached_routes,
        COUNT(*) FILTER (WHERE expires_at > NOW()) AS valid_cache_entries,
        AVG(travel_time_minutes) AS avg_travel_minutes,
        AVG(distance_miles) AS avg_distance_miles
      FROM travel_time_cache ttc
      WHERE EXISTS (
        SELECT 1 FROM client_locations cl
        JOIN clients c ON c.id = cl.client_id
        WHERE c.organization_id = $1
          AND (
            (ttc.from_location_type = 'client' AND ttc.from_location_id = cl.client_id)
            OR (ttc.to_location_type = 'client' AND ttc.to_location_id = cl.client_id)
          )
      )
    `,
      [organizationId]
    );

    return {
      locations: locationStats.rows[0],
      cache: cacheStats.rows[0],
    };
  }

  /**
   * Invalidate travel cache for a location
   */
  private async invalidateTravelCache(locationType: string, locationId: string): Promise<void> {
    const db = await getDbClient();

    await db.query(
      `
      DELETE FROM travel_time_cache
      WHERE (from_location_type = $1 AND from_location_id = $2)
         OR (to_location_type = $1 AND to_location_id = $2)
    `,
      [locationType, locationId]
    );
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const travelOptimizationService = new TravelOptimizationService();
