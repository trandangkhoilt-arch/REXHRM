/**
 * NexHRM Payroll Engine.
 * Computes monthly salaries from confirmed timesheets based on Vietnamese labor code regulations
 * and enterprise organizational policy parameters.
 */

export interface PayrollInput {
  baseSalary: number;
  standardWorkDays: number;
  actualWorkDays: number;
  overtimeHours: number;
  allowances?: number;
  bonuses?: number;
  deductions?: number;
  overtimeMultiplier?: number; // 1.5 for regular weekdays, 2.0 for weekends, 3.0 for holidays
  socialInsuranceRate?: number; // 8% employee
  healthInsuranceRate?: number; // 1.5% employee
  unemploymentInsuranceRate?: number; // 1% employee
  personalRelief?: number; // 11,000,000 VND
}

export interface PayrollCalculationResult {
  baseSalary: number;
  standardWorkDays: number;
  actualWorkDays: number;
  actualWorkSalary: number;
  overtimePay: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  socialInsurance: number;
  healthInsurance: number;
  unemploymentInsurance: number;
  totalInsuranceDeduction: number;
  taxableIncome: number;
  personalIncomeTax: number;
  grossSalary: number;
  netSalary: number;
}

/**
 * Calculates progressive personal income tax (PIT) under Vietnamese tax brackets.
 */
export function calculateVietnamesePIT(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  if (taxableIncome <= 5000000) {
    tax = taxableIncome * 0.05;
  } else if (taxableIncome <= 10000000) {
    tax = 5000000 * 0.05 + (taxableIncome - 5000000) * 0.1;
  } else if (taxableIncome <= 18000000) {
    tax = 5000000 * 0.05 + 5000000 * 0.1 + (taxableIncome - 10000000) * 0.15;
  } else if (taxableIncome <= 32000000) {
    tax = 5000000 * 0.05 + 5000000 * 0.1 + 8000000 * 0.15 + (taxableIncome - 18000000) * 0.2;
  } else if (taxableIncome <= 52000000) {
    tax =
      5000000 * 0.05 +
      5000000 * 0.1 +
      8000000 * 0.15 +
      14000000 * 0.2 +
      (taxableIncome - 32000000) * 0.25;
  } else if (taxableIncome <= 80000000) {
    tax =
      5000000 * 0.05 +
      5000000 * 0.1 +
      8000000 * 0.15 +
      14000000 * 0.2 +
      20000000 * 0.25 +
      (taxableIncome - 52000000) * 0.3;
  } else {
    tax =
      5000000 * 0.05 +
      5000000 * 0.1 +
      8000000 * 0.15 +
      14000000 * 0.2 +
      20000000 * 0.25 +
      28000000 * 0.3 +
      (taxableIncome - 80000000) * 0.35;
  }

  return Math.round(tax);
}

export function computePayroll(input: PayrollInput): PayrollCalculationResult {
  const {
    baseSalary,
    standardWorkDays = 22,
    actualWorkDays = 0,
    overtimeHours = 0,
    allowances = 0,
    bonuses = 0,
    deductions = 0,
    overtimeMultiplier = 1.5,
    socialInsuranceRate = 0.08,
    healthInsuranceRate = 0.015,
    unemploymentInsuranceRate = 0.01,
    personalRelief = 11000000,
  } = input;

  // Day rate and hour rate
  const dailyRate = standardWorkDays > 0 ? baseSalary / standardWorkDays : 0;
  const hourlyRate = dailyRate / 8;

  // Actual worked salary
  const actualWorkSalary = Math.round(dailyRate * Math.min(actualWorkDays, standardWorkDays + 5));

  // Overtime pay
  const overtimePay = Math.round(hourlyRate * overtimeMultiplier * overtimeHours);

  // Gross
  const grossSalary = actualWorkSalary + overtimePay + allowances + bonuses;

  // Insurances (capped to base salary or maximum threshold)
  const socialInsurance = Math.round(baseSalary * socialInsuranceRate);
  const healthInsurance = Math.round(baseSalary * healthInsuranceRate);
  const unemploymentInsurance = Math.round(baseSalary * unemploymentInsuranceRate);
  const totalInsuranceDeduction = socialInsurance + healthInsurance + unemploymentInsurance;

  // Taxable income
  const taxableIncome = Math.max(0, grossSalary - totalInsuranceDeduction - personalRelief);
  const personalIncomeTax = calculateVietnamesePIT(taxableIncome);

  // Net salary
  const netSalary = Math.max(0, grossSalary - totalInsuranceDeduction - personalIncomeTax - deductions);

  return {
    baseSalary,
    standardWorkDays,
    actualWorkDays,
    actualWorkSalary,
    overtimePay,
    allowances,
    bonuses,
    deductions,
    socialInsurance,
    healthInsurance,
    unemploymentInsurance,
    totalInsuranceDeduction,
    taxableIncome,
    personalIncomeTax,
    grossSalary,
    netSalary,
  };
}
