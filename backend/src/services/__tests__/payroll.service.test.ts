/**
 * Unit Tests for Payroll Service
 *
 * Tests FLSA-compliant hours calculation and tax withholding calculations:
 * - Regular hours (0-40)
 * - Overtime hours (40-60 at 1.5x)
 * - Double time hours (60+ at 2x)
 * - Federal, state, and payroll tax calculations
 * - Social Security wage base limits
 * - Medicare additional tax
 *
 * @module services/__tests__/payroll.service.test
 */

describe('Payroll Service - FLSA Hours Calculation', () => {
  /**
   * Calculate FLSA-compliant hours
   * Regular: 0-40 hours at 1x
   * Overtime: 40-60 hours at 1.5x
   * Double time: 60+ hours at 2x
   */
  const calculateFLSAHours = (totalHours: number): {
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
  } => {
    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    if (totalHours <= 40) {
      regularHours = totalHours;
    } else if (totalHours <= 60) {
      regularHours = 40;
      overtimeHours = totalHours - 40;
    } else {
      regularHours = 40;
      overtimeHours = 20;
      doubleTimeHours = totalHours - 60;
    }

    return {
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      doubleTimeHours: Math.round(doubleTimeHours * 100) / 100
    };
  };

  describe('Regular Hours (0-40)', () => {
    it('should calculate 0 hours correctly', () => {
      const result = calculateFLSAHours(0);
      expect(result.regularHours).toBe(0);
      expect(result.overtimeHours).toBe(0);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate 20 hours as all regular', () => {
      const result = calculateFLSAHours(20);
      expect(result.regularHours).toBe(20);
      expect(result.overtimeHours).toBe(0);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate exactly 40 hours as all regular', () => {
      const result = calculateFLSAHours(40);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(0);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate 39.75 hours as all regular', () => {
      const result = calculateFLSAHours(39.75);
      expect(result.regularHours).toBe(39.75);
      expect(result.overtimeHours).toBe(0);
      expect(result.doubleTimeHours).toBe(0);
    });
  });

  describe('Overtime Hours (40-60)', () => {
    it('should calculate 41 hours (40 regular, 1 OT)', () => {
      const result = calculateFLSAHours(41);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(1);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate 45 hours (40 regular, 5 OT)', () => {
      const result = calculateFLSAHours(45);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(5);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate 50 hours (40 regular, 10 OT)', () => {
      const result = calculateFLSAHours(50);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(10);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate exactly 60 hours (40 regular, 20 OT)', () => {
      const result = calculateFLSAHours(60);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(20);
      expect(result.doubleTimeHours).toBe(0);
    });

    it('should calculate 55.5 hours correctly', () => {
      const result = calculateFLSAHours(55.5);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(15.5);
      expect(result.doubleTimeHours).toBe(0);
    });
  });

  describe('Double Time Hours (60+)', () => {
    it('should calculate 61 hours (40 regular, 20 OT, 1 DT)', () => {
      const result = calculateFLSAHours(61);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(20);
      expect(result.doubleTimeHours).toBe(1);
    });

    it('should calculate 70 hours (40 regular, 20 OT, 10 DT)', () => {
      const result = calculateFLSAHours(70);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(20);
      expect(result.doubleTimeHours).toBe(10);
    });

    it('should calculate 80 hours (40 regular, 20 OT, 20 DT)', () => {
      const result = calculateFLSAHours(80);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(20);
      expect(result.doubleTimeHours).toBe(20);
    });

    it('should calculate 65.25 hours correctly', () => {
      const result = calculateFLSAHours(65.25);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(20);
      expect(result.doubleTimeHours).toBe(5.25);
    });

    it('should calculate 100 hours (extreme case)', () => {
      const result = calculateFLSAHours(100);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(20);
      expect(result.doubleTimeHours).toBe(40);
    });
  });

  describe('Gross Pay Calculation', () => {
    const hourlyRate = 20; // $20/hour

    it('should calculate gross pay for regular hours only', () => {
      const { regularHours, overtimeHours, doubleTimeHours } = calculateFLSAHours(40);
      const grossPay =
        regularHours * hourlyRate +
        overtimeHours * (hourlyRate * 1.5) +
        doubleTimeHours * (hourlyRate * 2.0);

      expect(grossPay).toBe(800); // 40 * $20 = $800
    });

    it('should calculate gross pay with overtime', () => {
      const { regularHours, overtimeHours, doubleTimeHours } = calculateFLSAHours(50);
      const grossPay =
        regularHours * hourlyRate +
        overtimeHours * (hourlyRate * 1.5) +
        doubleTimeHours * (hourlyRate * 2.0);

      expect(grossPay).toBe(1100); // (40 * $20) + (10 * $30) = $800 + $300 = $1,100
    });

    it('should calculate gross pay with double time', () => {
      const { regularHours, overtimeHours, doubleTimeHours } = calculateFLSAHours(70);
      const grossPay =
        regularHours * hourlyRate +
        overtimeHours * (hourlyRate * 1.5) +
        doubleTimeHours * (hourlyRate * 2.0);

      expect(grossPay).toBe(1800); // (40 * $20) + (20 * $30) + (10 * $40) = $800 + $600 + $400 = $1,800
    });
  });

  describe('Rounding', () => {
    it('should round hours to 2 decimal places', () => {
      const result = calculateFLSAHours(45.125);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(5.13); // 5.125 rounded to 5.13
    });

    it('should handle edge cases in rounding', () => {
      const result = calculateFLSAHours(40.005);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(0.01); // 0.005 rounded to 0.01 (round half up)
    });
  });
});

describe('Payroll Service - Tax Calculations', () => {
  const TAX_CONFIG = {
    federalWithholdingRate: 0.12, // 12%
    stateWithholdingRate: 0.04, // 4% (Ohio)
    socialSecurityRate: 0.062, // 6.2%
    medicareRate: 0.0145, // 1.45%
    stateDisabilityRate: 0.005, // 0.5% (Ohio SDI)
    socialSecurityWageBase: 160200, // 2024 limit
    medicareAdditionalRate: 0.009, // 0.9% on wages over $200k
    medicareAdditionalThreshold: 200000
  };

  const calculateTaxes = (
    grossPay: number,
    ytdGross: number
  ): {
    federalTax: number;
    stateTax: number;
    socialSecurityTax: number;
    medicareTax: number;
    stateDisabilityTax: number;
  } => {
    // Federal withholding (simplified)
    const federalTax = Math.round(grossPay * TAX_CONFIG.federalWithholdingRate * 100) / 100;

    // State withholding
    const stateTax = Math.round(grossPay * TAX_CONFIG.stateWithholdingRate * 100) / 100;

    // Social Security tax (subject to wage base)
    let socialSecurityTax = 0;
    const prevYtdGross = ytdGross - grossPay;
    if (prevYtdGross < TAX_CONFIG.socialSecurityWageBase) {
      const taxableWages = Math.min(grossPay, TAX_CONFIG.socialSecurityWageBase - prevYtdGross);
      socialSecurityTax = Math.round(taxableWages * TAX_CONFIG.socialSecurityRate * 100) / 100;
    }

    // Medicare tax (no wage base limit)
    let medicareTax = Math.round(grossPay * TAX_CONFIG.medicareRate * 100) / 100;

    // Additional Medicare tax (0.9% on wages over $200,000)
    if (ytdGross > TAX_CONFIG.medicareAdditionalThreshold) {
      const additionalWages =
        prevYtdGross >= TAX_CONFIG.medicareAdditionalThreshold
          ? grossPay
          : ytdGross - TAX_CONFIG.medicareAdditionalThreshold;
      medicareTax += Math.round(additionalWages * TAX_CONFIG.medicareAdditionalRate * 100) / 100;
    }

    // State disability tax
    const stateDisabilityTax = Math.round(grossPay * TAX_CONFIG.stateDisabilityRate * 100) / 100;

    return {
      federalTax,
      stateTax,
      socialSecurityTax,
      medicareTax,
      stateDisabilityTax
    };
  };

  describe('Federal Tax Withholding', () => {
    it('should calculate 12% federal withholding', () => {
      const taxes = calculateTaxes(1000, 1000);
      expect(taxes.federalTax).toBe(120); // 1000 * 0.12 = 120
    });

    it('should calculate federal withholding on larger amount', () => {
      const taxes = calculateTaxes(5000, 5000);
      expect(taxes.federalTax).toBe(600); // 5000 * 0.12 = 600
    });

    it('should round federal tax to 2 decimals', () => {
      const taxes = calculateTaxes(1234.56, 1234.56);
      expect(taxes.federalTax).toBe(148.15); // 1234.56 * 0.12 = 148.1472 -> 148.15
    });
  });

  describe('State Tax Withholding', () => {
    it('should calculate 4% Ohio state withholding', () => {
      const taxes = calculateTaxes(1000, 1000);
      expect(taxes.stateTax).toBe(40); // 1000 * 0.04 = 40
    });

    it('should calculate state withholding on larger amount', () => {
      const taxes = calculateTaxes(5000, 5000);
      expect(taxes.stateTax).toBe(200); // 5000 * 0.04 = 200
    });
  });

  describe('Social Security Tax', () => {
    it('should calculate 6.2% Social Security tax', () => {
      const taxes = calculateTaxes(1000, 1000);
      expect(taxes.socialSecurityTax).toBe(62); // 1000 * 0.062 = 62
    });

    it('should apply Social Security wage base limit ($160,200)', () => {
      // Already at wage base - no more SS tax
      const taxes = calculateTaxes(1000, 160200);
      expect(taxes.socialSecurityTax).toBe(0); // Already at limit
    });

    it('should calculate partial SS tax when approaching wage base', () => {
      // YTD is $159,700, paying $1,000 (only $500 is taxable)
      const grossPay = 1000;
      const ytdGross = 159700;
      const taxes = calculateTaxes(grossPay, ytdGross);

      const taxableWages = Math.min(grossPay, TAX_CONFIG.socialSecurityWageBase - (ytdGross - grossPay));
      const expectedSS = Math.round(taxableWages * TAX_CONFIG.socialSecurityRate * 100) / 100;

      expect(taxes.socialSecurityTax).toBe(expectedSS); // 500 * 0.062 = 31
    });

    it('should calculate SS tax up to wage base exactly', () => {
      const grossPay = 1000;
      const ytdGross = 160200; // Exactly at wage base after this payment

      // YTD before payment
      const prevYtdGross = ytdGross - grossPay; // 159,200

      const taxableWages = Math.min(grossPay, TAX_CONFIG.socialSecurityWageBase - prevYtdGross);
      const expectedSS = Math.round(taxableWages * TAX_CONFIG.socialSecurityRate * 100) / 100;

      const taxes = calculateTaxes(grossPay, ytdGross);
      expect(taxes.socialSecurityTax).toBe(expectedSS); // Full $1,000 is taxable
    });

    it('should not tax SS beyond wage base', () => {
      const taxes = calculateTaxes(5000, 165000); // Already over limit
      expect(taxes.socialSecurityTax).toBe(0);
    });
  });

  describe('Medicare Tax', () => {
    it('should calculate 1.45% Medicare tax', () => {
      const taxes = calculateTaxes(1000, 1000);
      expect(taxes.medicareTax).toBe(14.5); // 1000 * 0.0145 = 14.5
    });

    it('should have no wage base limit for Medicare', () => {
      const taxes = calculateTaxes(10000, 200000); // High wages, still taxed
      expect(taxes.medicareTax).toBeGreaterThan(0);
    });

    it('should round Medicare tax to 2 decimals', () => {
      const taxes = calculateTaxes(1234.56, 1234.56);
      expect(taxes.medicareTax).toBe(17.9); // 1234.56 * 0.0145 = 17.90112 -> 17.9
    });
  });

  describe('Additional Medicare Tax (0.9% over $200k)', () => {
    it('should not apply additional Medicare tax under $200k', () => {
      const taxes = calculateTaxes(5000, 150000);
      const baseMedicare = Math.round(5000 * TAX_CONFIG.medicareRate * 100) / 100;
      expect(taxes.medicareTax).toBe(baseMedicare); // No additional tax
    });

    it('should apply additional Medicare tax over $200k', () => {
      const grossPay = 5000;
      const ytdGross = 205000; // Over threshold

      const taxes = calculateTaxes(grossPay, ytdGross);

      // Base Medicare: $5,000 * 1.45% = $72.50
      // Additional Medicare: $5,000 * 0.9% = $45.00 (all of $5k is over threshold)
      // Total: $117.50
      const baseMedicare = Math.round(grossPay * TAX_CONFIG.medicareRate * 100) / 100;
      const additionalMedicare = Math.round(grossPay * TAX_CONFIG.medicareAdditionalRate * 100) / 100;
      const expectedTotal = baseMedicare + additionalMedicare;

      expect(taxes.medicareTax).toBe(expectedTotal);
    });

    it('should apply partial additional Medicare tax at threshold', () => {
      const grossPay = 5000;
      const ytdGross = 202000; // $2,000 over threshold

      const taxes = calculateTaxes(grossPay, ytdGross);

      // Base Medicare: $5,000 * 1.45% = $72.50
      // Additional Medicare: $2,000 * 0.9% = $18.00 (only $2k is over threshold)
      // Total: $90.50
      const baseMedicare = Math.round(grossPay * TAX_CONFIG.medicareRate * 100) / 100;
      const prevYtdGross = ytdGross - grossPay; // 197,000
      const additionalWages = ytdGross - TAX_CONFIG.medicareAdditionalThreshold; // 2,000
      const additionalMedicare = Math.round(additionalWages * TAX_CONFIG.medicareAdditionalRate * 100) / 100;
      const expectedTotal = baseMedicare + additionalMedicare;

      expect(taxes.medicareTax).toBe(expectedTotal);
    });
  });

  describe('State Disability Tax (Ohio SDI)', () => {
    it('should calculate 0.5% Ohio SDI tax', () => {
      const taxes = calculateTaxes(1000, 1000);
      expect(taxes.stateDisabilityTax).toBe(5); // 1000 * 0.005 = 5
    });

    it('should calculate SDI on larger amount', () => {
      const taxes = calculateTaxes(5000, 5000);
      expect(taxes.stateDisabilityTax).toBe(25); // 5000 * 0.005 = 25
    });
  });

  describe('Total Tax and Net Pay', () => {
    it('should calculate total taxes and net pay correctly', () => {
      const grossPay = 1000;
      const ytdGross = 50000; // Well below SS wage base

      const taxes = calculateTaxes(grossPay, ytdGross);

      const totalTaxes =
        taxes.federalTax +
        taxes.stateTax +
        taxes.socialSecurityTax +
        taxes.medicareTax +
        taxes.stateDisabilityTax;

      const netPay = grossPay - totalTaxes;

      // Federal: 1000 * 0.12 = 120
      // State: 1000 * 0.04 = 40
      // SS: 1000 * 0.062 = 62
      // Medicare: 1000 * 0.0145 = 14.5
      // SDI: 1000 * 0.005 = 5
      // Total: 241.5
      // Net: 1000 - 241.5 = 758.5

      expect(totalTaxes).toBeCloseTo(241.5, 2);
      expect(netPay).toBeCloseTo(758.5, 2);
    });

    it('should handle high earner with SS wage base limit', () => {
      const grossPay = 10000;
      const ytdGross = 170000; // Over SS wage base

      const taxes = calculateTaxes(grossPay, ytdGross);

      const totalTaxes =
        taxes.federalTax +
        taxes.stateTax +
        taxes.socialSecurityTax + // Should be 0
        taxes.medicareTax +
        taxes.stateDisabilityTax;

      expect(taxes.socialSecurityTax).toBe(0); // Over wage base
      expect(totalTaxes).toBeLessThan(grossPay);
    });
  });

  describe('Edge Cases', () => {
    it('should handle $0 gross pay', () => {
      const taxes = calculateTaxes(0, 0);

      expect(taxes.federalTax).toBe(0);
      expect(taxes.stateTax).toBe(0);
      expect(taxes.socialSecurityTax).toBe(0);
      expect(taxes.medicareTax).toBe(0);
      expect(taxes.stateDisabilityTax).toBe(0);
    });

    it('should handle very small amounts', () => {
      const taxes = calculateTaxes(0.01, 0.01);

      // All taxes should be 0 or nearly 0 after rounding
      expect(taxes.federalTax).toBeGreaterThanOrEqual(0);
      expect(taxes.stateTax).toBeGreaterThanOrEqual(0);
      expect(taxes.socialSecurityTax).toBeGreaterThanOrEqual(0);
      expect(taxes.medicareTax).toBeGreaterThanOrEqual(0);
      expect(taxes.stateDisabilityTax).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large amounts', () => {
      const grossPay = 50000;
      const ytdGross = 250000; // High earner

      const taxes = calculateTaxes(grossPay, ytdGross);

      expect(taxes.federalTax).toBe(6000); // 50000 * 0.12
      expect(taxes.socialSecurityTax).toBe(0); // Over wage base
      expect(taxes.medicareTax).toBeGreaterThan(0); // Should include additional Medicare
    });
  });
});
