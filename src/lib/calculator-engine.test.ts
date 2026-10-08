import { describe, it, expect } from 'vitest';
import {
  calculateTimeToTarget,
  calculateFutureValue,
  calculateRequiredReturn,
  calculateRequiredInitialInvestment,
  calculateRequiredContribution,
  calculateCagr,
  calculateXirr,
  calculateSwp,
  calculateInflationImpact,
  calculateCompoundInterest,
  calculateSimpleInterest
} from './calculator-engine';

describe('Financial Calculator Engine', () => {
  describe('calculateTimeToTarget', () => {
    it('returns 0 years when target is already reached', () => {
      const res = calculateTimeToTarget({
        currentAmount: 1000000,
        targetAmount: 1000000,
        expectedAnnualReturn: 12
      });
      expect(res.isAlreadyAchieved).toBe(true);
      expect(res.years).toBe(0);
      expect(res.months).toBe(0);
    });

    it('handles unreachable scenario with 0 return and 0 contribution', () => {
      const res = calculateTimeToTarget({
        currentAmount: 100000,
        targetAmount: 1000000,
        expectedAnnualReturn: 0,
        contribution: 0
      });
      expect(res.isPossible).toBe(false);
    });

    it('calculates time correctly for ₹1 Lakh to ₹10 Lakh at 12% with ₹10,000 monthly SIP', () => {
      const res = calculateTimeToTarget({
        currentAmount: 100000,
        targetAmount: 1000000,
        expectedAnnualReturn: 12,
        contribution: 10000,
        contributionFrequency: 'monthly',
        contributionTiming: 'end'
      });
      expect(res.isPossible).toBe(true);
      // Typically takes around 4.5 to 5 years
      expect(res.years).toBeGreaterThanOrEqual(4);
      expect(res.years).toBeLessThanOrEqual(5);
      expect(res.totalContributions).toBeGreaterThan(0);
      expect(res.totalGrowth).toBeGreaterThan(0);
      expect(res.schedule.length).toBeGreaterThan(0);
    });

    it('calculates time with zero return but positive monthly contribution', () => {
      // 100,000 current, 1,000,000 target = 900,000 needed. At 10,000/mo = 90 months = 7 years 6 months.
      const res = calculateTimeToTarget({
        currentAmount: 100000,
        targetAmount: 1000000,
        expectedAnnualReturn: 0,
        contribution: 10000,
        contributionFrequency: 'monthly',
        compoundingFrequency: 'annually'
      });
      expect(res.isPossible).toBe(true);
      expect(res.totalMonths).toBe(90);
      expect(res.years).toBe(7);
      expect(res.months).toBe(6);
    });

    it('adjusts for inflation and taxes/expense ratio', () => {
      const res = calculateTimeToTarget({
        currentAmount: 100000,
        targetAmount: 1000000,
        expectedAnnualReturn: 15,
        contribution: 15000,
        inflationRate: 6,
        taxRate: 10,
        expenseRatio: 1
      });
      expect(res.isPossible).toBe(true);
      expect(res.netEffectiveAnnualReturn).toBeLessThan(15);
      expect(res.inflationAdjustedTarget).toBeGreaterThan(1000000);
    });
  });

  describe('calculateFutureValue', () => {
    it('calculates FV of lump sum correctly', () => {
      // 100k at 10% for 5 years compound annually = 100000 * 1.1^5 = 161,051
      const res = calculateFutureValue({
        initialAmount: 100000,
        annualReturn: 10,
        timeYears: 5,
        compoundingFrequency: 'annually',
        recurringContribution: 0
      });
      expect(res.futureValue).toBe(161051);
      expect(res.totalGrowth).toBe(61051);
    });

    it('calculates FV with recurring contributions', () => {
      const res = calculateFutureValue({
        initialAmount: 0,
        annualReturn: 12,
        timeYears: 10,
        recurringContribution: 10000,
        contributionFrequency: 'monthly'
      });
      // 10k/month at 12% for 10 years is approx 23.2 Lakhs
      expect(res.futureValue).toBeGreaterThan(2200000);
      expect(res.futureValue).toBeLessThan(2500000);
      expect(res.totalContributions).toBe(1200000);
    });
  });

  describe('calculateRequiredReturn', () => {
    it('calculates required return to double money in 6 years (~12.25%)', () => {
      const res = calculateRequiredReturn({
        currentAmount: 100000,
        targetAmount: 200000,
        timeYears: 6,
        contribution: 0
      });
      expect(res.isPossible).toBe(true);
      expect(Math.round(res.requiredAnnualReturn)).toBe(12);
    });

    it('flags high required return warning when target is too aggressive', () => {
      const res = calculateRequiredReturn({
        currentAmount: 10000,
        targetAmount: 10000000, // 10k to 1 Crore in 3 years
        timeYears: 3,
        contribution: 0
      });
      expect(res.warning).toBeDefined();
    });
  });

  describe('calculateRequiredInitialInvestment', () => {
    it('calculates required lump sum today to reach ₹10 Lakh in 10 years at 12%', () => {
      const required = calculateRequiredInitialInvestment({
        targetAmount: 1000000,
        timeYears: 10,
        expectedAnnualReturn: 12,
        compoundingFrequency: 'annually',
        recurringContribution: 0
      });
      // 1000000 / (1.12^10) ~ 321,973
      expect(required).toBeGreaterThan(320000);
      expect(required).toBeLessThan(323000);
    });
  });

  describe('calculateRequiredContribution', () => {
    it('calculates required monthly SIP to reach ₹1 Crore in 15 years at 12%', () => {
      const res = calculateRequiredContribution({
        currentAmount: 0,
        targetAmount: 10000000,
        timeYears: 15,
        expectedAnnualReturn: 12,
        contributionFrequency: 'monthly'
      });
      // Standard SIP for 1 Cr in 15 yrs at 12% is approx 19,800 to 20,500
      expect(res.monthlyEquivalent).toBeGreaterThan(19000);
      expect(res.monthlyEquivalent).toBeLessThan(21500);
    });
  });

  describe('calculateCagr', () => {
    it('computes CAGR from 1 Lakh to 2 Lakh in 5 years (~14.87%)', () => {
      const cagr = calculateCagr(100000, 200000, 5);
      expect(cagr).toBeCloseTo(14.87, 1);
    });
  });

  describe('calculateXirr', () => {
    it('computes annualized internal rate of return for irregular cashflows', () => {
      const cashFlows = [
        { date: '2023-01-01', amount: -100000 },
        { date: '2024-01-01', amount: -50000 },
        { date: '2025-01-01', amount: 180000 }
      ];
      const res = calculateXirr(cashFlows);
      expect(res.isPossible).toBe(true);
      expect(res.rate).toBeGreaterThan(10);
      expect(res.rate).toBeLessThan(25);
    });
  });

  describe('calculateSwp', () => {
    it('identifies depletion when withdrawal exceeds return rate', () => {
      // 10 Lakh corpus, withdrawing 30k/month (3.6 Lakh/yr) at 6% return
      const res = calculateSwp({
        startingAmount: 1000000,
        expectedAnnualReturn: 6,
        withdrawalAmount: 30000,
        withdrawalFrequency: 'monthly',
        timeYears: 10
      });
      expect(res.isSustainable).toBe(false);
      expect(res.depletionMonths).not.toBeNull();
      expect(res.warning).toBeDefined();
    });

    it('identifies sustainable corpus when withdrawal is low', () => {
      // 1 Crore corpus, withdrawing 20k/month (2.4 Lakh/yr) at 8% return
      const res = calculateSwp({
        startingAmount: 10000000,
        expectedAnnualReturn: 8,
        withdrawalAmount: 20000,
        withdrawalFrequency: 'monthly',
        timeYears: 20
      });
      expect(res.isSustainable).toBe(true);
      expect(res.depletionMonths).toBeNull();
      expect(res.remainingCorpus).toBeGreaterThan(10000000);
    });
  });

  describe('calculateInflationImpact', () => {
    it('computes real return and future purchasing power', () => {
      const res = calculateInflationImpact(100000, 6, 10, 12);
      expect(res.futureAmountRequired).toBeGreaterThan(100000);
      expect(res.futurePurchasingPower).toBeLessThan(100000);
      expect(res.realRateOfReturn).toBeCloseTo(5.66, 1);
    });
  });

  describe('Simple and Compound Interest', () => {
    it('calculates simple interest', () => {
      const res = calculateSimpleInterest(10000, 5, 2);
      expect(res.interest).toBe(1000);
      expect(res.totalAmount).toBe(11000);
    });

    it('calculates compound interest', () => {
      const res = calculateCompoundInterest(10000, 10, 2, 'annually');
      expect(res.totalInterest).toBe(2100);
      expect(res.totalAmount).toBe(12100);
    });
  });
});
