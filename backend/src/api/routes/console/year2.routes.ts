/**
 * Year 2 API Routes
 * DODD certification, HPC authorizations, Consumer-Directed care, and Payroll integration
 */

import { Router, Request, Response } from 'express';
import { doddService } from '../../../services/dodd.service';
import { hpcService } from '../../../services/hpc.service';
import { consumerDirectedService } from '../../../services/consumer-directed.service';
import { payrollIntegrationService } from '../../../services/payroll-integration.service';

const router = Router();

// ==========================================
// DODD Certification Routes
// ==========================================

// Get all DODD certifications
router.get('/dodd/certifications', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const certifications = await doddService.getCertifications(organizationId);
    res.json({ certifications });
  } catch (error: any) {
    console.error('Get DODD certifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create DODD certification
router.post('/dodd/certifications', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const certification = await doddService.createCertification(organizationId, req.body);
    res.status(201).json({ certification });
  } catch (error: any) {
    console.error('Create DODD certification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update DODD certification
router.patch('/dodd/certifications/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const certification = await doddService.updateCertification(
      req.params.id,
      organizationId,
      req.body
    );
    if (!certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    res.json({ certification });
  } catch (error: any) {
    console.error('Update DODD certification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check organization has active DODD certification
router.get('/dodd/certification-status', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasActive = await doddService.hasActiveCertification(organizationId);
    res.json({ hasActiveCertification: hasActive });
  } catch (error: any) {
    console.error('Check DODD certification status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get caregiver DODD status
router.get('/dodd/caregivers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caregivers = await doddService.getCaregiverDoddStatus(organizationId);
    res.json({ caregivers });
  } catch (error: any) {
    console.error('Get caregiver DODD status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get eligible caregivers for DODD services
router.get('/dodd/eligible-caregivers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caregivers = await doddService.getEligibleCaregivers(organizationId);
    res.json({ caregivers });
  } catch (error: any) {
    console.error('Get eligible caregivers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update caregiver DODD requirements
router.patch('/dodd/caregivers/:caregiverId', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await doddService.updateCaregiverRequirements(
      req.params.caregiverId,
      organizationId,
      req.body,
      userId
    );
    res.json(result);
  } catch (error: any) {
    console.error('Update caregiver DODD requirements error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get DODD eligibility dashboard
router.get('/dodd/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await doddService.getEligibilityDashboard(organizationId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Get DODD dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// HPC Authorization Routes
// ==========================================

// Get HPC service codes
router.get('/hpc/service-codes', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activeOnly = req.query.activeOnly !== 'false';
    const serviceCodes = await hpcService.getServiceCodes(organizationId, activeOnly);
    res.json({ serviceCodes });
  } catch (error: any) {
    console.error('Get HPC service codes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get HPC authorizations
router.get('/hpc/authorizations', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      clientId: req.query.clientId as string,
      serviceCode: req.query.serviceCode as string,
      status: req.query.status as string,
      expiringWithinDays: req.query.expiringWithinDays ?
        parseInt(req.query.expiringWithinDays as string) : undefined
    };

    const authorizations = await hpcService.getAuthorizations(organizationId, filters);
    res.json({ authorizations });
  } catch (error: any) {
    console.error('Get HPC authorizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get HPC authorization by ID
router.get('/hpc/authorizations/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authorization = await hpcService.getAuthorizationById(req.params.id, organizationId);
    if (!authorization) {
      return res.status(404).json({ error: 'Authorization not found' });
    }
    res.json({ authorization });
  } catch (error: any) {
    console.error('Get HPC authorization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create HPC authorization
router.post('/hpc/authorizations', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authorization = await hpcService.createAuthorization(organizationId, req.body);
    res.status(201).json({ authorization });
  } catch (error: any) {
    console.error('Create HPC authorization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update HPC authorization
router.patch('/hpc/authorizations/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authorization = await hpcService.updateAuthorization(
      req.params.id,
      organizationId,
      req.body
    );
    if (!authorization) {
      return res.status(404).json({ error: 'Authorization not found' });
    }
    res.json({ authorization });
  } catch (error: any) {
    console.error('Update HPC authorization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record HPC usage
router.post('/hpc/authorizations/:id/usage', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const usage = await hpcService.recordUsage(organizationId, {
      authorizationId: req.params.id,
      ...req.body
    });
    res.status(201).json({ usage });
  } catch (error: any) {
    console.error('Record HPC usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get expiring authorizations
router.get('/hpc/expiring', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const authorizations = await hpcService.getExpiringAuthorizations(organizationId, days);
    res.json({ authorizations });
  } catch (error: any) {
    console.error('Get expiring authorizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get low utilization alerts
router.get('/hpc/alerts/low-utilization', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 50;
    const alerts = await hpcService.getLowUtilizationAlerts(organizationId, threshold);
    res.json({ alerts });
  } catch (error: any) {
    console.error('Get low utilization alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get HPC dashboard
router.get('/hpc/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await hpcService.getAuthorizationDashboard(organizationId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Get HPC dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check client HPC eligibility
router.get('/hpc/clients/:clientId/eligibility', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const eligibility = await hpcService.checkClientHpcEligibility(
      req.params.clientId,
      organizationId
    );
    res.json(eligibility);
  } catch (error: any) {
    console.error('Check client HPC eligibility error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Consumer-Directed Care Routes
// ==========================================

// Get consumer-directed employers
router.get('/consumer-directed/employers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = req.query.status as string;
    const employers = await consumerDirectedService.getEmployers(organizationId, status);
    res.json({ employers });
  } catch (error: any) {
    console.error('Get CD employers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get consumer-directed employer by ID
router.get('/consumer-directed/employers/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const employer = await consumerDirectedService.getEmployerById(req.params.id, organizationId);
    if (!employer) {
      return res.status(404).json({ error: 'Employer not found' });
    }
    res.json({ employer });
  } catch (error: any) {
    console.error('Get CD employer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create consumer-directed employer
router.post('/consumer-directed/employers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const employer = await consumerDirectedService.createEmployer(organizationId, req.body);
    res.status(201).json({ employer });
  } catch (error: any) {
    console.error('Create CD employer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update consumer-directed employer
router.patch('/consumer-directed/employers/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const employer = await consumerDirectedService.updateEmployer(
      req.params.id,
      organizationId,
      req.body
    );
    if (!employer) {
      return res.status(404).json({ error: 'Employer not found' });
    }
    res.json({ employer });
  } catch (error: any) {
    console.error('Update CD employer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get workers for employer
router.get('/consumer-directed/employers/:id/workers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = req.query.status as string;
    const workers = await consumerDirectedService.getWorkers(req.params.id, organizationId, status);
    res.json({ workers });
  } catch (error: any) {
    console.error('Get CD workers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create worker
router.post('/consumer-directed/workers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const worker = await consumerDirectedService.createWorker(organizationId, req.body);
    res.status(201).json({ worker });
  } catch (error: any) {
    console.error('Create CD worker error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update worker
router.patch('/consumer-directed/workers/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const worker = await consumerDirectedService.updateWorker(
      req.params.id,
      organizationId,
      req.body
    );
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json({ worker });
  } catch (error: any) {
    console.error('Update CD worker error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get timesheets
router.get('/consumer-directed/timesheets', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      employerId: req.query.employerId as string,
      workerId: req.query.workerId as string,
      status: req.query.status as string,
      payPeriodStart: req.query.payPeriodStart as string,
      payPeriodEnd: req.query.payPeriodEnd as string
    };

    const timesheets = await consumerDirectedService.getTimesheets(organizationId, filters);
    res.json({ timesheets });
  } catch (error: any) {
    console.error('Get CD timesheets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get timesheet by ID
router.get('/consumer-directed/timesheets/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const timesheet = await consumerDirectedService.getTimesheetById(req.params.id, organizationId);
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }
    res.json({ timesheet });
  } catch (error: any) {
    console.error('Get CD timesheet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create timesheet
router.post('/consumer-directed/timesheets', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const timesheet = await consumerDirectedService.createTimesheet(organizationId, req.body);
    res.status(201).json({ timesheet });
  } catch (error: any) {
    console.error('Create CD timesheet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit timesheet
router.post('/consumer-directed/timesheets/:id/submit', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const timesheet = await consumerDirectedService.submitTimesheet(req.params.id, organizationId);
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }
    res.json({ timesheet });
  } catch (error: any) {
    console.error('Submit CD timesheet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve timesheet
router.post('/consumer-directed/timesheets/:id/approve', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const timesheet = await consumerDirectedService.approveTimesheet(
      req.params.id,
      organizationId,
      userId
    );
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }
    res.json({ timesheet });
  } catch (error: any) {
    console.error('Approve CD timesheet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject timesheet
router.post('/consumer-directed/timesheets/:id/reject', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const timesheet = await consumerDirectedService.rejectTimesheet(
      req.params.id,
      organizationId,
      reason
    );
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }
    res.json({ timesheet });
  } catch (error: any) {
    console.error('Reject CD timesheet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get consumer-directed dashboard
router.get('/consumer-directed/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await consumerDirectedService.getDashboard(organizationId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Get CD dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get budget utilization
router.get('/consumer-directed/budget-utilization', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const utilization = await consumerDirectedService.getBudgetUtilization(organizationId);
    res.json({ utilization });
  } catch (error: any) {
    console.error('Get budget utilization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Payroll Integration Routes
// ==========================================

// Get payroll providers
router.get('/payroll/providers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const providers = await payrollIntegrationService.getProviders(organizationId);
    res.json({ providers });
  } catch (error: any) {
    console.error('Get payroll providers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active provider
router.get('/payroll/providers/active', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const provider = await payrollIntegrationService.getActiveProvider(organizationId);
    res.json({ provider });
  } catch (error: any) {
    console.error('Get active provider error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configure payroll provider
router.post('/payroll/providers', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const provider = await payrollIntegrationService.configureProvider(organizationId, req.body);
    res.status(201).json({ provider });
  } catch (error: any) {
    console.error('Configure payroll provider error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test provider connection
router.post('/payroll/providers/:id/test', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await payrollIntegrationService.testConnection(req.params.id, organizationId);
    res.json(result);
  } catch (error: any) {
    console.error('Test provider connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employee mappings
router.get('/payroll/mappings', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const unmappedOnly = req.query.unmappedOnly === 'true';
    const mappings = await payrollIntegrationService.getEmployeeMappings(organizationId, unmappedOnly);
    res.json({ mappings });
  } catch (error: any) {
    console.error('Get employee mappings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create employee mapping
router.post('/payroll/mappings', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const mapping = await payrollIntegrationService.createEmployeeMapping(organizationId, req.body);
    res.status(201).json({ mapping });
  } catch (error: any) {
    console.error('Create employee mapping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payroll runs
router.get('/payroll/runs', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = req.query.status as string;
    const runs = await payrollIntegrationService.getPayrollRuns(organizationId, status);
    res.json({ runs });
  } catch (error: any) {
    console.error('Get payroll runs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payroll run by ID
router.get('/payroll/runs/:id', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const run = await payrollIntegrationService.getPayrollRunById(req.params.id, organizationId);
    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }
    res.json({ run });
  } catch (error: any) {
    console.error('Get payroll run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payroll run
router.post('/payroll/runs', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const run = await payrollIntegrationService.createPayrollRun(organizationId, req.body);
    res.status(201).json({ run });
  } catch (error: any) {
    console.error('Create payroll run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve payroll run
router.post('/payroll/runs/:id/approve', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const run = await payrollIntegrationService.approvePayrollRun(
      req.params.id,
      organizationId,
      userId
    );
    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }
    res.json({ run });
  } catch (error: any) {
    console.error('Approve payroll run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit payroll run to provider
router.post('/payroll/runs/:id/submit', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await payrollIntegrationService.submitToProvider(req.params.id, organizationId);
    res.json(result);
  } catch (error: any) {
    console.error('Submit payroll run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payroll dashboard
router.get('/payroll/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dashboard = await payrollIntegrationService.getDashboard(organizationId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Get payroll dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
