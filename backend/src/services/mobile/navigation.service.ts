/**
 * Navigation Service
 * Integrates with Google Maps API for turn-by-turn navigation
 *
 * Features:
 * - Route calculation with traffic
 * - Turn-by-turn directions
 * - ETA updates
 * - Distance matrix for batch calculations
 * - Geocoding for addresses
 */

import axios from 'axios';
import { pool } from '../../config/database';


import { createLogger } from '../../utils/logger';

const logger = createLogger('navigation');
interface NavigationRoute {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  durationInTraffic?: {
    text: string;
    value: number; // seconds
  };
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  polyline: string; // Encoded polyline
  steps: NavigationStep[];
}

interface NavigationStep {
  instruction: string;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  maneuver?: string;
}

interface GeocodedAddress {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
  addressComponents: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export class NavigationService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('[Navigation] Google Maps API key not configured. Navigation features will be disabled.');
    }
  }

  /**
   * Get route from caregiver's current location to client's home
   */
  async getRouteToClient(
    caregiverLat: number,
    caregiverLng: number,
    clientLat: number,
    clientLng: number,
    departureTime?: Date
  ): Promise<NavigationRoute | null> {
    if (!this.apiKey) {
      logger.error('[Navigation] API key not configured');
      return null;
    }

    try {
      const params: any = {
        origin: `${caregiverLat},${caregiverLng}`,
        destination: `${clientLat},${clientLng}`,
        mode: 'driving',
        key: this.apiKey,
        alternatives: false,
        traffic_model: 'best_guess'
      };

      // Add departure time for traffic-aware routing
      if (departureTime) {
        params.departure_time = Math.floor(departureTime.getTime() / 1000);
      } else {
        params.departure_time = 'now';
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params
      });

      if (response.data.status !== 'OK') {
        logger.error('[Navigation] API error:', response.data.status);
        return null;
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance,
        duration: leg.duration,
        durationInTraffic: leg.duration_in_traffic,
        startLocation: {
          lat: leg.start_location.lat,
          lng: leg.start_location.lng
        },
        endLocation: {
          lat: leg.end_location.lat,
          lng: leg.end_location.lng
        },
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML
          distance: step.distance,
          duration: step.duration,
          startLocation: {
            lat: step.start_location.lat,
            lng: step.start_location.lng
          },
          endLocation: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          },
          maneuver: step.maneuver
        }))
      };
    } catch (error) {
      logger.error('[Navigation] Error getting route:', error);
      return null;
    }
  }

  /**
   * Get route for a specific visit
   */
  async getRouteForVisit(
    visitId: string,
    caregiverLat: number,
    caregiverLng: number
  ): Promise<{
    route: NavigationRoute | null;
    visit: any;
  }> {
    // Get visit details
    const visitResult = await pool.query(
      `
      SELECT
        v.*,
        c.latitude as client_lat,
        c.longitude as client_lng,
        c.full_name as client_name,
        c.service_address
      FROM shifts v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1
      `,
      [visitId]
    );

    if (visitResult.rows.length === 0) {
      throw new Error('Visit not found');
    }

    const visit = visitResult.rows[0];

    // Get route
    const route = await this.getRouteToClient(
      caregiverLat,
      caregiverLng,
      visit.client_lat,
      visit.client_lng,
      visit.scheduled_start
    );

    return {
      route,
      visit: {
        id: visit.id,
        clientName: visit.client_name,
        clientAddress: visit.service_address,
        scheduledStart: visit.scheduled_start,
        scheduledEnd: visit.scheduled_end,
        serviceType: visit.service_type
      }
    };
  }

  /**
   * Calculate distance matrix for batch route calculations
   * Useful for finding nearest caregivers to multiple clients
   */
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>,
    departureTime?: Date
  ): Promise<{
    distances: number[][]; // meters
    durations: number[][]; // seconds
    durationsInTraffic?: number[][]; // seconds
  } | null> {
    if (!this.apiKey) {
      logger.error('[Navigation] API key not configured');
      return null;
    }

    try {
      const originStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const params: any = {
        origins: originStr,
        destinations: destStr,
        mode: 'driving',
        key: this.apiKey,
        traffic_model: 'best_guess'
      };

      if (departureTime) {
        params.departure_time = Math.floor(departureTime.getTime() / 1000);
      } else {
        params.departure_time = 'now';
      }

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params
      });

      if (response.data.status !== 'OK') {
        logger.error('[Navigation] Distance matrix error:', response.data.status);
        return null;
      }

      const distances: number[][] = [];
      const durations: number[][] = [];
      const durationsInTraffic: number[][] = [];

      response.data.rows.forEach((row: any) => {
        const distRow: number[] = [];
        const durRow: number[] = [];
        const trafficRow: number[] = [];

        row.elements.forEach((element: any) => {
          if (element.status === 'OK') {
            distRow.push(element.distance.value);
            durRow.push(element.duration.value);
            if (element.duration_in_traffic) {
              trafficRow.push(element.duration_in_traffic.value);
            }
          } else {
            distRow.push(Infinity);
            durRow.push(Infinity);
            trafficRow.push(Infinity);
          }
        });

        distances.push(distRow);
        durations.push(durRow);
        durationsInTraffic.push(trafficRow);
      });

      return {
        distances,
        durations,
        durationsInTraffic: durationsInTraffic.length > 0 ? durationsInTraffic : undefined
      };
    } catch (error) {
      logger.error('[Navigation] Error getting distance matrix:', error);
      return null;
    }
  }

  /**
   * Find nearest available caregivers to a client location
   */
  async findNearestCaregivers(
    clientLat: number,
    clientLng: number,
    organizationId: string,
    maxResults: number = 5
  ): Promise<Array<{
    caregiverId: string;
    caregiverName: string;
    distance: number; // meters
    duration: number; // seconds
    durationInTraffic?: number; // seconds
    currentLat: number;
    currentLng: number;
  }>> {
    // Get caregivers with recent GPS locations
    const caregiversResult = await pool.query(
      `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        gps.latitude,
        gps.longitude
      FROM users u
      JOIN gps_tracking gps ON u.id = gps.user_id
      WHERE u.organization_id = $1
        AND u.role = 'CAREGIVER'
        AND u.active = true
        AND gps.timestamp >= NOW() - INTERVAL '30 minutes'
      ORDER BY gps.timestamp DESC
      LIMIT 20
      `,
      [organizationId]
    );

    if (caregiversResult.rows.length === 0) {
      return [];
    }

    // Get distance matrix
    const origins = caregiversResult.rows.map(cg => ({
      lat: parseFloat(cg.latitude),
      lng: parseFloat(cg.longitude)
    }));

    const destinations = [{ lat: clientLat, lng: clientLng }];

    const matrix = await this.getDistanceMatrix(origins, destinations);

    if (!matrix) {
      return [];
    }

    // Combine results
    const results = caregiversResult.rows.map((cg, index) => ({
      caregiverId: cg.id,
      caregiverName: cg.name,
      distance: matrix.distances[index][0],
      duration: matrix.durations[index][0],
      durationInTraffic: matrix.durationsInTraffic?.[index][0],
      currentLat: parseFloat(cg.latitude),
      currentLng: parseFloat(cg.longitude)
    }));

    // Sort by duration (with traffic if available)
    results.sort((a, b) => {
      const aDur = a.durationInTraffic || a.duration;
      const bDur = b.durationInTraffic || b.duration;
      return aDur - bDur;
    });

    return results.slice(0, maxResults);
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodedAddress | null> {
    if (!this.apiKey) {
      logger.error('[Navigation] API key not configured');
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        logger.error('[Navigation] Geocoding error:', response.data.status);
        return null;
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      // Parse address components
      const components: any = {};
      result.address_components.forEach((comp: any) => {
        if (comp.types.includes('street_number') || comp.types.includes('route')) {
          components.street = (components.street || '') + ' ' + comp.long_name;
        }
        if (comp.types.includes('locality')) {
          components.city = comp.long_name;
        }
        if (comp.types.includes('administrative_area_level_1')) {
          components.state = comp.short_name;
        }
        if (comp.types.includes('postal_code')) {
          components.zipCode = comp.long_name;
        }
        if (comp.types.includes('country')) {
          components.country = comp.long_name;
        }
      });

      return {
        formattedAddress: result.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        placeId: result.place_id,
        addressComponents: {
          street: components.street?.trim(),
          city: components.city,
          state: components.state,
          zipCode: components.zipCode,
          country: components.country
        }
      };
    } catch (error) {
      logger.error('[Navigation] Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
    if (!this.apiKey) {
      logger.error('[Navigation] API key not configured');
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        logger.error('[Navigation] Reverse geocoding error:', response.data.status);
        return null;
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      // Parse address components
      const components: any = {};
      result.address_components.forEach((comp: any) => {
        if (comp.types.includes('street_number') || comp.types.includes('route')) {
          components.street = (components.street || '') + ' ' + comp.long_name;
        }
        if (comp.types.includes('locality')) {
          components.city = comp.long_name;
        }
        if (comp.types.includes('administrative_area_level_1')) {
          components.state = comp.short_name;
        }
        if (comp.types.includes('postal_code')) {
          components.zipCode = comp.long_name;
        }
        if (comp.types.includes('country')) {
          components.country = comp.long_name;
        }
      });

      return {
        formattedAddress: result.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        placeId: result.place_id,
        addressComponents: {
          street: components.street?.trim(),
          city: components.city,
          state: components.state,
          zipCode: components.zipCode,
          country: components.country
        }
      };
    } catch (error) {
      logger.error('[Navigation] Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Save geocoded address to database
   */
  async saveGeocodedAddress(
    entityType: 'client' | 'caregiver' | 'organization',
    entityId: string,
    address: string
  ): Promise<boolean> {
    try {
      const geocoded = await this.geocodeAddress(address);

      if (!geocoded) {
        return false;
      }

      // Update entity with coordinates
      let tableName: string;
      switch (entityType) {
        case 'client':
          tableName = 'clients';
          break;
        case 'caregiver':
          tableName = 'users';
          break;
        case 'organization':
          tableName = 'organizations';
          break;
        default:
          throw new Error('Invalid entity type');
      }

      await pool.query(
        `
        UPDATE ${tableName}
        SET latitude = $1,
            longitude = $2,
            geocoded_address = $3,
            place_id = $4,
            updated_at = NOW()
        WHERE id = $5
        `,
        [
          geocoded.latitude,
          geocoded.longitude,
          geocoded.formattedAddress,
          geocoded.placeId,
          entityId
        ]
      );

      return true;
    } catch (error) {
      logger.error('[Navigation] Error saving geocoded address:', error);
      return false;
    }
  }

  /**
   * Calculate optimized route for multiple stops (up to 10 waypoints)
   * Useful for caregivers with multiple visits in a day
   */
  async getOptimizedRoute(
    startLat: number,
    startLng: number,
    waypoints: Array<{ lat: number; lng: number; visitId: string }>,
    returnToStart: boolean = false
  ): Promise<{
    optimizedOrder: string[]; // visitIds in optimized order
    totalDistance: number; // meters
    totalDuration: number; // seconds
    routes: NavigationRoute[];
  } | null> {
    if (!this.apiKey) {
      logger.error('[Navigation] API key not configured');
      return null;
    }

    if (waypoints.length > 10) {
      logger.error('[Navigation] Maximum 10 waypoints supported');
      return null;
    }

    try {
      const waypointsStr = waypoints
        .map(wp => `${wp.lat},${wp.lng}`)
        .join('|');

      const params: any = {
        origin: `${startLat},${startLng}`,
        destination: returnToStart ? `${startLat},${startLng}` : `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`,
        waypoints: returnToStart ? waypointsStr : `optimize:true|${waypointsStr}`,
        mode: 'driving',
        key: this.apiKey
      };

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params
      });

      if (response.data.status !== 'OK') {
        logger.error('[Navigation] Optimized route error:', response.data.status);
        return null;
      }

      const route = response.data.routes[0];
      const waypointOrder = route.waypoint_order || [];

      // Reorder waypoints based on optimization
      const optimizedVisitIds = waypointOrder.map((index: number) => waypoints[index].visitId);

      // Calculate total distance and duration
      let totalDistance = 0;
      let totalDuration = 0;

      const routes: NavigationRoute[] = route.legs.map((leg: any) => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;

        return {
          distance: leg.distance,
          duration: leg.duration,
          durationInTraffic: leg.duration_in_traffic,
          startLocation: {
            lat: leg.start_location.lat,
            lng: leg.start_location.lng
          },
          endLocation: {
            lat: leg.end_location.lat,
            lng: leg.end_location.lng
          },
          polyline: leg.polyline?.points || '',
          steps: leg.steps.map((step: any) => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance,
            duration: step.duration,
            startLocation: {
              lat: step.start_location.lat,
              lng: step.start_location.lng
            },
            endLocation: {
              lat: step.end_location.lat,
              lng: step.end_location.lng
            },
            maneuver: step.maneuver
          }))
        };
      });

      return {
        optimizedOrder: optimizedVisitIds,
        totalDistance,
        totalDuration,
        routes
      };
    } catch (error) {
      logger.error('[Navigation] Error getting optimized route:', error);
      return null;
    }
  }
}

export const navigationService = new NavigationService();
