/**
 * Script to execute sample data generation
 * Run this to populate your Serenity ERP with realistic preview data
 */

import { DatabaseClient } from '../client';
import SampleDataGenerator from './001_sample_data_generator';
import { createLogger } from '../../utils/logger';

async function runSampleDataGeneration() {
  apiLogger.info('🚀 Serenity ERP Sample Data Generation');
  apiLogger.info('=====================================');
  apiLogger.info('This will generate:');
  apiLogger.info('• 450 Ohio-based patients with realistic demographics');
  apiLogger.info('• 500 employees across all roles and departments');
  apiLogger.info('• Complete recruiting pipeline (150+ applicants);');
  apiLogger.info('• 30 days of scheduling and EVV data');
  apiLogger.info('• Tax compliance data with Ohio requirements');
  apiLogger.info('• AI agent execution analytics');
  apiLogger.info('• Performance reviews and retention analysis');
  apiLogger.info('');

  try {
    // Initialize database connection
    const db = new DatabaseClient();
    await db.connect();

    // Initialize sample data generator
    const generator = new SampleDataGenerator(db);

    // Generate all sample data
    await generator.generateAllSampleData();

    apiLogger.info('');
    apiLogger.info('🎉 SUCCESS! Sample data generation completed!');
    apiLogger.info('');
    apiLogger.info('📊 Generated Data Summary:');
    apiLogger.info('==========================');

    // Query and display summary statistics
    const summaryStats = await generateSummaryStats(db);
    apiLogger.info(summaryStats);

    apiLogger.info('');
    apiLogger.info('🌐 Preview Your System:');
    apiLogger.info('=======================');
    apiLogger.info('• Start the application: npm run dev');
    apiLogger.info('• Executive Dashboard: http://localhost:3000/dashboard/executive');
    apiLogger.info('• HR Dashboard: http://localhost:3000/dashboard/hr');
    apiLogger.info('• Tax Dashboard: http://localhost:3000/dashboard/tax');
    apiLogger.info('• API Documentation: http://localhost:3001/docs');

    await db.disconnect();

  } catch (error) {
    apiLogger.error('❌ Error generating sample data:', error);
    process.exit(1);
  }
}

async function generateSummaryStats(db: DatabaseClient): Promise<string> {
  const stats = [];

  try {
    // Patient statistics
    const patientStats = await db.query(`
      SELECT
        COUNT(*) as total_patients,
        COUNT(*) FILTER (WHERE status = 'active') as active_patients,
        COUNT(DISTINCT city) as cities_served,
        COUNT(DISTINCT county) as counties_served
      FROM patients
    `);

    stats.push(`📋 Patients: ${patientStats.rows[0].total_patients} total (${patientStats.rows[0].active_patients} active)`);
    stats.push(`   Serving ${patientStats.rows[0].cities_served} cities across ${patientStats.rows[0].counties_served} Ohio counties`);

    // Employee statistics
    const employeeStats = await db.query(`
      SELECT
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE status = 'active') as active_employees,
        COUNT(DISTINCT position) as unique_positions,
        COUNT(DISTINCT department) as departments
      FROM employees
    `);

    stats.push(`👥 Employees: ${employeeStats.rows[0].total_employees} total (${employeeStats.rows[0].active_employees} active)`);
    stats.push(`   Across ${employeeStats.rows[0].departments} departments with ${employeeStats.rows[0].unique_positions} role types`);

    // Recruiting statistics
    const recruitingStats = await db.query(`
      SELECT
        COUNT(*) as total_applicants,
        COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
        COUNT(DISTINCT current_stage) as pipeline_stages,
        ROUND(AVG(ai_screening_score), 1) as avg_screening_score
      FROM applicants
    `);

    stats.push(`📝 Recruiting: ${recruitingStats.rows[0].total_applicants} applicants (${recruitingStats.rows[0].hired_count} hired)`);
    stats.push(`   Average AI screening score: ${recruitingStats.rows[0].avg_screening_score}/100`);

    // Scheduling statistics
    const scheduleStats = await db.query(`
      SELECT
        COUNT(*) as total_shifts,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_shifts,
        COUNT(DISTINCT DATE(scheduled_start)) as days_scheduled
      FROM shifts
    `);

    stats.push(`📅 Scheduling: ${scheduleStats.rows[0].total_shifts} shifts over ${scheduleStats.rows[0].days_scheduled} days`);
    stats.push(`   ${scheduleStats.rows[0].completed_shifts} completed (${Math.round((scheduleStats.rows[0].completed_shifts / scheduleStats.rows[0].total_shifts) * 100)}% completion rate)`);

    // EVV compliance
    const evvStats = await db.query(`
      SELECT
        COUNT(*) as total_evv_records,
        COUNT(*) FILTER (WHERE compliance_status = 'compliant') as compliant_records,
        COUNT(*) FILTER (WHERE submitted_to_sandata IS NOT NULL) as submitted_records
      FROM evv_records
    `);

    const complianceRate = Math.round((evvStats.rows[0].compliant_records / evvStats.rows[0].total_evv_records) * 100);
    stats.push(`✅ EVV Compliance: ${evvStats.rows[0].total_evv_records} records (${complianceRate}% compliant)`);

    // Tax data
    const taxStats = await db.query(`
      SELECT
        COUNT(*) as total_calculations,
        COUNT(DISTINCT employee_id) as employees_with_taxes,
        ROUND(SUM(gross_pay), 2) as total_gross_pay,
        ROUND(SUM(federal_withholding + ohio_state_withholding), 2) as total_withholdings
      FROM tax_calculations
    `);

    stats.push(`💰 Tax Data: ${taxStats.rows[0].total_calculations} payroll calculations`);
    stats.push(`   $${taxStats.rows[0].total_gross_pay?.toLocaleString()} gross pay, $${taxStats.rows[0].total_withholdings?.toLocaleString()} withheld`);

    // AI agent statistics
    const aiStats = await db.query(`
      SELECT
        COUNT(*) as total_executions,
        COUNT(DISTINCT agent_type) as unique_agents,
        ROUND(AVG(confidence), 3) as avg_confidence,
        ROUND(SUM(cost), 4) as total_cost
      FROM agent_executions
    `);

    stats.push(`🤖 AI Agents: ${aiStats.rows[0].total_executions} executions across ${aiStats.rows[0].unique_agents} agent types`);
    stats.push(`   Average confidence: ${aiStats.rows[0].avg_confidence}, Total cost: $${aiStats.rows[0].total_cost}`);

    // Performance data
    const performanceStats = await db.query(`
      SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(overall_rating), 1) as avg_rating,
        COUNT(*) FILTER (WHERE promotion_recommended = true) as promotion_recommendations
      FROM performance_reviews
    `);

    stats.push(`📊 Performance: ${performanceStats.rows[0].total_reviews} reviews completed`);
    stats.push(`   Average rating: ${performanceStats.rows[0].avg_rating}/5.0, ${performanceStats.rows[0].promotion_recommendations} promotions recommended`);

    // Retention risk
    const retentionStats = await db.query(`
      SELECT
        COUNT(*) as total_assessments,
        COUNT(*) FILTER (WHERE risk_level = 'high' OR risk_level = 'critical') as high_risk_employees,
        ROUND(AVG(risk_score), 1) as avg_risk_score
      FROM retention_risks
    `);

    stats.push(`⚠️  Retention: ${retentionStats.rows[0].total_assessments} risk assessments`);
    stats.push(`   ${retentionStats.rows[0].high_risk_employees} high-risk employees, average risk score: ${retentionStats.rows[0].avg_risk_score}/100`);

  } catch (error) {
    stats.push('❌ Error generating statistics');
  }

  return stats.join('\n');
}

// Execute if run directly
if (require.main === module) {
  runSampleDataGeneration().catch(error => {
    const apiLogger = createLogger('api');
    apiLogger.error('Sample data generation failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

export { runSampleDataGeneration };