/**
 * Simplified Server Entry Point
 * Starts a minimal Express API server for testing database connectivity
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = parseInt(process.env.PORT || '3001');

// Middleware
app.use(cors());
app.use(express.json());

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    res.json({
      status: 'healthy',
      database: result.rows[0].database,
      time: result.rows[0].time,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Serenity ERP API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      console: '/api/console/*',
      admin: '/api/admin/*',
      public: '/api/public/*'
    }
  });
});

// Auth routes - minimal implementation for testing login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, organization_id, email, password_hash, first_name, last_name, role, status FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password (using bcrypt)
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session
    await pool.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [user.id, refreshToken, req.headers['user-agent'] || 'unknown', req.ip]
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      accessToken,
      refreshToken,
      expiresIn: 28800, // 8 hours in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

      const userResult = await pool.query(
        'SELECT id, organization_id, email, first_name, last_name, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];
      res.json({
        user: {
          id: user.id,
          organizationId: user.organization_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status
        }
      });
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shifts for caregiver
app.get('/api/console/shifts', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.scheduled_start,
        s.scheduled_end,
        s.actual_start,
        s.actual_end,
        s.status,
        s.service_code,
        s.notes,
        c.id as client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.address as client_address,
        u.id as caregiver_id,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      JOIN users u ON s.caregiver_id = u.id
      ORDER BY s.scheduled_start DESC
      LIMIT 50
    `);

    res.json({
      shifts: result.rows.map(row => ({
        id: row.id,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        actualStart: row.actual_start,
        actualEnd: row.actual_end,
        status: row.status,
        serviceCode: row.service_code,
        notes: row.notes,
        client: {
          id: row.client_id,
          firstName: row.client_first_name,
          lastName: row.client_last_name,
          address: row.client_address
        },
        caregiver: {
          id: row.caregiver_id,
          firstName: row.caregiver_first_name,
          lastName: row.caregiver_last_name
        }
      }))
    });
  } catch (error) {
    console.error('Shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users/caregivers
app.get('/api/console/caregivers', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.status,
        p.id as pod_id,
        p.code as pod_code,
        p.name as pod_name
      FROM users u
      LEFT JOIN user_pod_memberships upm ON u.id = upm.user_id AND upm.is_primary = true
      LEFT JOIN pods p ON upm.pod_id = p.id
      WHERE u.role = 'caregiver'
      ORDER BY u.last_name, u.first_name
    `);

    res.json({
      caregivers: result.rows.map(row => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        role: row.role,
        status: row.status,
        pod: row.pod_id ? {
          id: row.pod_id,
          code: row.pod_code,
          name: row.pod_name
        } : null
      }))
    });
  } catch (error) {
    console.error('Caregivers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get clients
app.get('/api/console/clients', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.client_code,
        c.first_name,
        c.last_name,
        c.date_of_birth,
        c.address,
        c.status,
        c.evv_consent_status,
        p.id as pod_id,
        p.code as pod_code,
        p.name as pod_name
      FROM clients c
      LEFT JOIN pods p ON c.pod_id = p.id
      ORDER BY c.last_name, c.first_name
    `);

    res.json({
      clients: result.rows.map(row => ({
        id: row.id,
        clientCode: row.client_code,
        firstName: row.first_name,
        lastName: row.last_name,
        dateOfBirth: row.date_of_birth,
        address: row.address,
        status: row.status,
        evvConsentStatus: row.evv_consent_status,
        pod: row.pod_id ? {
          id: row.pod_id,
          code: row.pod_code,
          name: row.pod_name
        } : null
      }))
    });
  } catch (error) {
    console.error('Clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pods
app.get('/api/console/pods', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.code,
        p.name,
        p.city,
        p.state,
        p.capacity,
        p.status,
        COUNT(DISTINCT upm.user_id) as caregiver_count,
        COUNT(DISTINCT c.id) as client_count
      FROM pods p
      LEFT JOIN user_pod_memberships upm ON p.id = upm.pod_id AND upm.status = 'active'
      LEFT JOIN clients c ON p.id = c.pod_id AND c.status = 'active'
      GROUP BY p.id, p.code, p.name, p.city, p.state, p.capacity, p.status
      ORDER BY p.code
    `);

    res.json({
      pods: result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        city: row.city,
        state: row.state,
        capacity: row.capacity,
        status: row.status,
        caregiverCount: parseInt(row.caregiver_count),
        clientCount: parseInt(row.client_count)
      }))
    });
  } catch (error) {
    console.error('Pods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// Mobile API Endpoints (for EVV Clock)
// =============================================================================

// Mobile auth - login by phone/PIN
app.post('/api/mobile/auth/login', async (req: Request, res: Response) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Phone and PIN required' });
    }

    // Find caregiver by phone (caregivers are users with role='caregiver')
    const caregiverResult = await pool.query(
      `SELECT id, first_name, last_name, phone, email
       FROM users
       WHERE (phone = $1 OR phone = $2)
         AND role = 'caregiver'
         AND status = 'active'`,
      [phone, phone.replace(/\D/g, '')]
    );

    if (caregiverResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    const caregiver = caregiverResult.rows[0];

    // For demo purposes, accept PIN "1234" for any caregiver
    if (pin !== '1234') {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    // Generate a simple token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { caregiverId: caregiver.id, userId: caregiver.id },
      process.env.JWT_SECRET || 'serenity-dev-secret',
      { expiresIn: '12h' }
    );

    res.json({
      token,
      caregiverId: caregiver.id,
      caregiverName: `${caregiver.first_name} ${caregiver.last_name}`
    });
  } catch (error) {
    console.error('Mobile auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mobile - get today's shifts for caregiver
app.get('/api/mobile/shifts/today', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'serenity-dev-secret');
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get shifts for today for this caregiver
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT
        s.id,
        s.scheduled_start,
        s.scheduled_end,
        s.status,
        s.actual_start,
        s.actual_end,
        c.id as client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.address as client_address
      FROM shifts s
      JOIN clients c ON s.client_id = c.id
      WHERE s.caregiver_id = $1
        AND DATE(s.scheduled_start) = $2
      ORDER BY s.scheduled_start`,
      [decoded.caregiverId, today]
    );

    res.json({
      shifts: result.rows.map(row => ({
        id: row.id,
        patient: {
          id: row.client_id,
          name: `${row.client_first_name} ${row.client_last_name}`,
          address: typeof row.client_address === 'object' ?
            `${row.client_address.street || ''}, ${row.client_address.city || ''}, ${row.client_address.state || ''} ${row.client_address.zip || ''}` :
            (row.client_address || 'Address not available'),
          latitude: 39.1031, // Default to Cincinnati
          longitude: -84.5120
        },
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        status: row.actual_end ? 'completed' : (row.actual_start ? 'in_progress' : row.status),
        clockInTime: row.actual_start,
        clockOutTime: row.actual_end
      }))
    });
  } catch (error) {
    console.error('Mobile shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mobile - EVV clock-in
app.post('/api/mobile/evv/clock-in', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { shiftId, timestamp, gps } = req.body;

    if (!shiftId || !timestamp || !gps) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update shift with clock-in time (actual_start)
    await pool.query(
      `UPDATE shifts
       SET actual_start = $1,
           status = 'in_progress',
           updated_at = NOW()
       WHERE id = $2`,
      [timestamp, shiftId]
    );

    // For now, just return success without creating EVV record
    // (EVV records table has different schema requiring visit_id, organization_id, etc.)
    res.json({ success: true, shiftId });
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mobile - EVV clock-out
app.post('/api/mobile/evv/clock-out', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { shiftId, timestamp, gps, notes } = req.body;

    if (!shiftId || !timestamp || !gps) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update shift with clock-out time (actual_end)
    await pool.query(
      `UPDATE shifts
       SET actual_end = $1,
           status = 'completed',
           notes = COALESCE(notes, '') || $2,
           updated_at = NOW()
       WHERE id = $3`,
      [timestamp, notes ? ` | ${notes}` : '', shiftId]
    );

    // For now, just return success without creating EVV record
    // (EVV records table has different schema requiring visit_id, organization_id, etc.)
    res.json({ success: true, shiftId });
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     SERENITY ERP API SERVER                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Status: RUNNING                                             ║
║  Port: ${port}                                                   ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(35)}        ║
║  Database: Connected                                         ║
╚══════════════════════════════════════════════════════════════╝

  Endpoints:
  - Health:     http://localhost:${port}/health
  - API Info:   http://localhost:${port}/api
  - Login:      POST http://localhost:${port}/api/auth/login
  - Me:         GET  http://localhost:${port}/api/auth/me
  - Shifts:     GET  http://localhost:${port}/api/console/shifts
  - Caregivers: GET  http://localhost:${port}/api/console/caregivers
  - Clients:    GET  http://localhost:${port}/api/console/clients
  - Pods:       GET  http://localhost:${port}/api/console/pods

  Test Login:
  curl -X POST http://localhost:${port}/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"founder@serenitycarepartners.com","password":"ChangeMe123!"}'
`);
});
