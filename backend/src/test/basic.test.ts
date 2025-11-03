/**
 * Basic test to verify Jest configuration
 */

describe('Jest Configuration', () => {
  test('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  test('should have test environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('should mock logger functions', () => {
    const { logger } = require('../utils/logger');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});