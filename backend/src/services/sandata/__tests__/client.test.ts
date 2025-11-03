/**
 * Unit Tests for Sandata HTTP Client
 * Tests authentication, request/response handling, error mapping, and retry logic
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { SandataClient, getSandataClient, resetSandataClient } from '../client';
import {
  MOCK_AUTH_SUCCESS,
  MOCK_AUTH_ERROR_401,
  MOCK_429_RATE_LIMIT,
  MOCK_500_INTERNAL_ERROR,
  MOCK_503_SERVICE_UNAVAILABLE,
} from './__mocks__/sandataResponses';
import { SANDATA_ERROR_TAXONOMY } from '../types';

// Mock the config module
jest.mock('../../../config/sandata', () => ({
  getActiveSandataConfig: jest.fn(() => ({
    clientId: 'TEST_CLIENT_ID',
    clientSecret: 'TEST_CLIENT_SECRET',
    baseUrl: 'https://api.sandata.example.com',
    providerId: 'TEST_PROVIDER',
    apiVersion: 'v4.3',
  })),
  getSandataBusinessRules: jest.fn(() => ({
    geofenceRadiusMiles: 0.25,
    clockInToleranceMinutes: 15,
  })),
  isSandataKillSwitchActive: jest.fn(() => false),
  isSandataEnabled: jest.fn(() => true),
  SANDATA_ENDPOINTS: {
    auth: '/oauth/token',
    status: '/api/status',
    individuals: '/api/v4.3/individuals',
    employees: '/api/v4.3/employees',
    visits: '/api/v4.3/visits',
  },
  SANDATA_ERROR_CODES: SANDATA_ERROR_TAXONOMY,
}));

describe('SandataClient', () => {
  let client: SandataClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Reset singleton before each test
    resetSandataClient();

    // Create fresh client instance
    client = new SandataClient();

    // Mock axios instance
    mockAxios = new MockAdapter((client as any).axiosInstance);
  });

  afterEach(() => {
    mockAxios.reset();
    mockAxios.restore();
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate successfully with valid credentials', async () => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);

      // Trigger authentication by making an API call
      mockAxios.onGet('/api/test').reply(200, { data: 'test' });

      const response = await client.get('/api/test');

      expect(response.success).toBe(true);
      expect(mockAxios.history.post.length).toBeGreaterThan(0);
      const authRequest = mockAxios.history.post[0];
      expect(authRequest.url).toBe('/oauth/token');
    });

    it('should cache authentication token', async () => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
      mockAxios.onGet('/api/test').reply(200, { data: 'test' });

      // Make two requests
      await client.get('/api/test');
      await client.get('/api/test');

      // Should only authenticate once
      const authRequests = mockAxios.history.post.filter((req) => req.url === '/oauth/token');
      expect(authRequests.length).toBe(1);
    });

    it('should refresh token on 401 error', async () => {
      // First auth succeeds
      mockAxios.onPost('/oauth/token').replyOnce(200, MOCK_AUTH_SUCCESS);

      // First request returns 401 (expired token)
      mockAxios.onGet('/api/test').replyOnce(401);

      // Second auth succeeds
      mockAxios.onPost('/oauth/token').replyOnce(200, MOCK_AUTH_SUCCESS);

      // Retry request succeeds
      mockAxios.onGet('/api/test').replyOnce(200, { data: 'test' });

      const response = await client.get('/api/test');

      expect(response.success).toBe(true);

      // Should authenticate twice (initial + retry)
      const authRequests = mockAxios.history.post.filter((req) => req.url === '/oauth/token');
      expect(authRequests.length).toBe(2);
    });

    it('should handle authentication failure', async () => {
      mockAxios.onPost('/oauth/token').reply(401, MOCK_AUTH_ERROR_401);

      mockAxios.onGet('/api/test').reply(200);

      const response = await client.get('/api/test');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(401);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.AUTH_INVALID_CREDENTIALS);
    });

    it('should format OAuth request as x-www-form-urlencoded', async () => {
      mockAxios.onPost('/oauth/token').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(config.data).toContain('grant_type=client_credentials');
        expect(config.data).toContain('client_id=TEST_CLIENT_ID');
        return [200, MOCK_AUTH_SUCCESS];
      });

      mockAxios.onGet('/api/test').reply(200, { data: 'test' });

      await client.get('/api/test');
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      // Mock authentication
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
    });

    describe('GET requests', () => {
      it('should make successful GET request', async () => {
        const mockData = { id: '123', name: 'Test' };
        mockAxios.onGet('/api/resource').reply(200, mockData);

        const response = await client.get('/api/resource');

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual(mockData);
        expect(response.timestamp).toBeDefined();
      });

      it('should include authorization header', async () => {
        mockAxios.onGet('/api/resource').reply((config) => {
          expect(config.headers?.Authorization).toMatch(/^Bearer /);
          return [200, { data: 'test' }];
        });

        await client.get('/api/resource');
      });
    });

    describe('POST requests', () => {
      it('should make successful POST request', async () => {
        const requestData = { name: 'Test', value: '123' };
        const responseData = { id: '456', status: 'created' };

        mockAxios.onPost('/api/resource', requestData).reply(201, responseData);

        const response = await client.post('/api/resource', requestData);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
        expect(response.data).toEqual(responseData);
      });

      it('should include transaction ID from headers', async () => {
        mockAxios.onPost('/api/resource').reply(200, { data: 'test' }, {
          'x-transaction-id': 'TXN-123',
        });

        const response = await client.post('/api/resource', {});

        expect(response.transactionId).toBe('TXN-123');
      });

      it('should fallback to x-request-id if transaction ID not present', async () => {
        mockAxios.onPost('/api/resource').reply(200, { data: 'test' }, {
          'x-request-id': 'REQ-456',
        });

        const response = await client.post('/api/resource', {});

        expect(response.transactionId).toBe('REQ-456');
      });
    });

    describe('PUT requests', () => {
      it('should make successful PUT request', async () => {
        const requestData = { id: '123', name: 'Updated' };
        const responseData = { status: 'updated' };

        mockAxios.onPut('/api/resource/123', requestData).reply(200, responseData);

        const response = await client.put('/api/resource/123', requestData);

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual(responseData);
      });
    });

    describe('DELETE requests', () => {
      it('should make successful DELETE request', async () => {
        mockAxios.onDelete('/api/resource/123').reply(204);

        const response = await client.delete('/api/resource/123');

        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(204);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
    });

    it('should handle 400 Bad Request', async () => {
      mockAxios.onPost('/api/resource').reply(400, {
        message: 'Invalid request format',
      });

      const response = await client.post('/api/resource', {});

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.VAL_INVALID_FORMAT);
      expect(response.error?.message).toContain('Invalid request format');
    });

    it('should handle 401 Unauthorized', async () => {
      mockAxios.onGet('/api/resource').reply(401);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(401);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.AUTH_INVALID_CREDENTIALS);
    });

    it('should handle 403 Forbidden', async () => {
      mockAxios.onGet('/api/resource').reply(403);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.AUTH_FORBIDDEN);
      expect(response.error?.message).toContain('forbidden');
    });

    it('should handle 404 Individual Not Found', async () => {
      mockAxios.onGet('/api/individuals/123').reply(404, {
        field: 'individualId',
        message: 'Individual not found',
      });

      const response = await client.get('/api/individuals/123');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.BUS_INDIVIDUAL_NOT_FOUND);
    });

    it('should handle 404 Employee Not Found', async () => {
      mockAxios.onGet('/api/employees/456').reply(404, {
        field: 'employeeId',
        message: 'Employee not found',
      });

      const response = await client.get('/api/employees/456');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.BUS_EMPLOYEE_NOT_FOUND);
    });

    it('should handle 429 Rate Limit', async () => {
      mockAxios.onPost('/api/resource').reply(429, MOCK_429_RATE_LIMIT.data, {
        'retry-after': '60',
      });

      const response = await client.post('/api/resource', {});

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(429);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_RATE_LIMIT);
    });

    it('should handle 500 Internal Server Error', async () => {
      mockAxios.onGet('/api/resource').reply(500, MOCK_500_INTERNAL_ERROR.data);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_INTERNAL_ERROR);
    });

    it('should handle 503 Service Unavailable', async () => {
      mockAxios.onGet('/api/resource').reply(503, MOCK_503_SERVICE_UNAVAILABLE.data);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(503);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_SERVICE_UNAVAILABLE);
    });

    it('should handle 504 Gateway Timeout', async () => {
      mockAxios.onGet('/api/resource').reply(504);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(504);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_GATEWAY_TIMEOUT);
    });

    it('should handle network timeout', async () => {
      mockAxios.onGet('/api/resource').timeout();

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(0);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_TIMEOUT);
    });

    it('should handle network error', async () => {
      mockAxios.onGet('/api/resource').networkError();

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(0);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_NETWORK_ERROR);
    });

    it('should include error details in response', async () => {
      const errorDetails = {
        field: 'serviceCode',
        code: 'VAL_001',
        message: 'Service code is required',
      };

      mockAxios.onPost('/api/resource').reply(400, errorDetails);

      const response = await client.post('/api/resource', {});

      expect(response.error?.field).toBe('serviceCode');
      expect(response.error?.details).toEqual(errorDetails);
    });
  });

  describe('Kill Switch', () => {
    beforeEach(() => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
    });

    it('should block requests when kill switch is active', async () => {
      const { isSandataKillSwitchActive } = require('../../../config/sandata');
      isSandataKillSwitchActive.mockReturnValue(true);

      await expect(client.get('/api/resource')).rejects.toThrow('KILL SWITCH ACTIVE');
    });

    it('should block requests when Sandata is disabled', async () => {
      const { isSandataEnabled } = require('../../../config/sandata');
      isSandataEnabled.mockReturnValue(false);

      await expect(client.get('/api/resource')).rejects.toThrow('disabled via feature flags');
    });

    it('should allow requests when kill switch is inactive', async () => {
      const { isSandataKillSwitchActive } = require('../../../config/sandata');
      isSandataKillSwitchActive.mockReturnValue(false);

      mockAxios.onGet('/api/resource').reply(200, { data: 'test' });

      const response = await client.get('/api/resource');

      expect(response.success).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return true for healthy API', async () => {
      mockAxios.onGet('/api/status').reply(200, { status: 'healthy' });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false for unhealthy API', async () => {
      mockAxios.onGet('/api/status').reply(503);

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false on timeout', async () => {
      mockAxios.onGet('/api/status').timeout();

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should use short timeout for health check', async () => {
      mockAxios.onGet('/api/status').reply((config) => {
        expect(config.timeout).toBe(5000);
        return [200, { status: 'healthy' }];
      });

      await client.healthCheck();
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = client.getConfig();

      expect(config.baseUrl).toBe('https://api.sandata.example.com');
      expect(config.providerId).toBe('TEST_PROVIDER');
      expect(config.apiVersion).toBe('v4.3');
      expect(config.hasToken).toBe(false);
      expect(config.tokenExpired).toBe(true);
    });

    it('should update token status after authentication', async () => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
      mockAxios.onGet('/api/test').reply(200);

      await client.get('/api/test');

      const config = client.getConfig();

      expect(config.hasToken).toBe(true);
      expect(config.tokenExpired).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getSandataClient', () => {
      const instance1 = getSandataClient();
      const instance2 = getSandataClient();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getSandataClient();

      resetSandataClient();

      const instance2 = getSandataClient();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Request Interceptors', () => {
    beforeEach(() => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
    });

    it('should add User-Agent header', async () => {
      mockAxios.onGet('/api/resource').reply((config) => {
        expect(config.headers?.['User-Agent']).toBe('Serenity-ERP/1.0');
        return [200, {}];
      });

      await client.get('/api/resource');
    });

    it('should add Accept header', async () => {
      mockAxios.onGet('/api/resource').reply((config) => {
        expect(config.headers?.Accept).toBe('application/json');
        return [200, {}];
      });

      await client.get('/api/resource');
    });

    it('should add Content-Type header', async () => {
      mockAxios.onPost('/api/resource').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('application/json');
        return [200, {}];
      });

      await client.post('/api/resource', {});
    });

    it('should not add auth header to token endpoint', async () => {
      mockAxios.onPost('/oauth/token').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, MOCK_AUTH_SUCCESS];
      });

      mockAxios.onGet('/api/test').reply(200);
      await client.get('/api/test');
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
    });

    it('should not retry on 401 more than once', async () => {
      // First request returns 401
      mockAxios.onGet('/api/resource').replyOnce(401);

      // Re-auth succeeds
      mockAxios.onPost('/oauth/token').replyOnce(200, MOCK_AUTH_SUCCESS);

      // Retry still returns 401
      mockAxios.onGet('/api/resource').replyOnce(401);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(401);

      // Should only make 2 GET requests (initial + 1 retry)
      const getRequests = mockAxios.history.get.filter((req) => req.url === '/api/resource');
      expect(getRequests.length).toBe(2);
    });

    it('should mark retry requests with X-Retry-Count header', async () => {
      // First request returns 401
      mockAxios.onGet('/api/resource').replyOnce(401);

      // Re-auth succeeds
      mockAxios.onPost('/oauth/token').replyOnce(200, MOCK_AUTH_SUCCESS);

      // Retry request should have X-Retry-Count header
      mockAxios.onGet('/api/resource').replyOnce((config) => {
        expect(config.headers?.['X-Retry-Count']).toBe('1');
        return [200, { data: 'test' }];
      });

      await client.get('/api/resource');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockAxios.onPost('/oauth/token').reply(200, MOCK_AUTH_SUCCESS);
    });

    it('should handle empty response body', async () => {
      mockAxios.onGet('/api/resource').reply(204);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(204);
      expect(response.data).toBeUndefined();
    });

    it('should handle response with null data', async () => {
      mockAxios.onGet('/api/resource').reply(200, null);

      const response = await client.get('/api/resource');

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should handle unknown HTTP status codes', async () => {
      mockAxios.onGet('/api/resource').reply(418, { message: "I'm a teapot" });

      const response = await client.get('/api/resource');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(418);
      expect(response.error?.code).toBe(SANDATA_ERROR_TAXONOMY.SYS_INTERNAL_ERROR);
      expect(response.error?.message).toContain('HTTP 418');
    });

    it('should handle rate limit without retry-after header', async () => {
      mockAxios.onPost('/api/resource').reply(429, {
        error: { message: 'Rate limit exceeded' },
      });

      const response = await client.post('/api/resource', {});

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(429);
    });
  });
});
