import type {
  CompoundingFrequency,
  ContributionFrequency,
  ContributionTiming,
  TimeToTargetInput,
  TimeToTargetResult,
  FutureValueInput,
  FutureValueResult,
  RequiredReturnInput,
  RequiredReturnResult,
  RequiredInitialInvestmentInput,
  RequiredContributionInput,
  RequiredContributionResult,
  SwpInput,
  SwpResult,
  SwpMilestone,
  YearlyMilestone,
  CashFlow,
  XirrResult
} from './types';

export const COMPOUNDING_PERIODS: Record<CompoundingFrequency, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  annually: 1,
};

export const CONTRIBUTION_PERIODS: Record<ContributionFrequency, number> = {
  daily: 365,
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  annually: 1,
  none: 0,
};

/**
 * Calculates net effective annual return taking expense ratio and tax rate into account.
 */
export function getNetAnnualRate(
  expectedReturnPercent: number,
  expenseRatioPercent: number = 0,
  taxRatePercent: number = 0
): number {
  const returnAfterFees = expectedReturnPercent - expenseRatioPercent;
  if (taxRatePercent > 0 && returnAfterFees > 0) {
    // Tax applies to the gains
    return returnAfterFees * (1 - taxRatePercent / 100);
  }
  return returnAfterFees;
}

/**
 * Converts annual nominal interest rate with compounding into effective periodic rate for a given period frequency.
 */
export function getEffectivePeriodicRate(
  annualRatePercent: number,
  compoundingFreq: CompoundingFrequency,
  periodsPerYear: number
): number {
  if (annualRatePercent === 0) return 0;
  const n = COMPOUNDING_PERIODS[compoundingFreq];
  const r = annualRatePercent / 100;
  // Effective Annual Rate (EAR) = (1 + r/n)^n - 1
  const ear = Math.pow(1 + r / n, n) - 1;
  // Rate per simulation period = (1 + ear)^(1/periodsPerYear) - 1
  return Math.pow(1 + ear, 1 / periodsPerYear) - 1;
}

/**
 * TIME TO TARGET (Flagship Engine)
 * Determines exact time (years, months, days) to reach a target amount.
 */
export function calculateTimeToTarget(input: TimeToTargetInput): TimeToTargetResult {
  const {
    currentAmount = 0,
    targetAmount = 0,
    expectedAnnualReturn = 12,
    compoundingFrequency = 'monthly',
    contribution = 0,
    contributionFrequency = 'monthly',
    contributionTiming = 'end',
    annualStepUpPercent = 0,
    inflationRate = 0,
    taxRate = 0,
    expenseRatio = 0,
    startDate = new Date()
  } = input;

  // Edge Case: Target already achieved
  if (currentAmount >= targetAmount && targetAmount > 0) {
    return {
      isPossible: true,
      isAlreadyAchieved: true,
      message: 'You have already reached or exceeded this target!',
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      targetDate: new Date(startDate),
      currentAmount,
      targetAmount,
      finalNominalBalance: currentAmount,
      finalRealBalance: currentAmount,
      totalContributions: 0,
      totalGrowth: 0,
      netEffectiveAnnualReturn: expectedAnnualReturn,
      inflationAdjustedTarget: targetAmount,
      schedule: []
    };
  }

  // Edge Case: Target is zero or negative
  if (targetAmount <= 0) {
    return {
      isPossible: false,
      isAlreadyAchieved: false,
      message: 'Please enter a target amount greater than zero.',
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      targetDate: new Date(startDate),
      currentAmount,
      targetAmount,
      finalNominalBalance: currentAmount,
      finalRealBalance: currentAmount,
      totalContributions: 0,
      totalGrowth: 0,
      netEffectiveAnnualReturn: 0,
      inflationAdjustedTarget: targetAmount,
      schedule: []
    };
  }

  const netAnnualReturn = getNetAnnualRate(expectedAnnualReturn, expenseRatio, taxRate);
  const periodsPerYear = contributionFrequency === 'none' ? 12 : CONTRIBUTION_PERIODS[contributionFrequency];
  const periodicRate = getEffectivePeriodicRate(netAnnualReturn, compoundingFrequency, periodsPerYear);

  // If return <= 0 and contribution <= 0, impossible
  if (periodicRate <= 0 && contribution <= 0) {
    return {
      isPossible: false,
      isAlreadyAchieved: false,
      message: 'Under these assumptions, the target is not reachable without positive growth or contributions.',
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      targetDate: new Date(startDate),
      currentAmount,
      targetAmount,
      finalNominalBalance: currentAmount,
      finalRealBalance: currentAmount,
      totalContributions: 0,
      totalGrowth: 0,
      netEffectiveAnnualReturn: netAnnualReturn,
      inflationAdjustedTarget: targetAmount,
      schedule: []
    };
  }

  let balance = currentAmount;
  let totalContributions = 0;
  let totalGrowth = 0;
  let currentContribution = contribution;
  const maxPeriods = 100 * periodsPerYear; // Max 100 years limit
  let periodCount = 0;

  const schedule: YearlyMilestone[] = [];
  let yearlyStartBalance = balance;
  let yearlyContributions = 0;
  let yearlyGrowth = 0;

  while (balance < targetAmount && periodCount < maxPeriods) {
    periodCount++;
    const currentYear = Math.floor((periodCount - 1) / periodsPerYear) + 1;

    // Apply annual step-up SIP at beginning of each new year
    if (annualStepUpPercent > 0 && periodCount > 1 && (periodCount - 1) % periodsPerYear === 0) {
      currentContribution *= (1 + annualStepUpPercent / 100);
    }

    let growthThisPeriod = 0;
    if (contributionTiming === 'beginning' && currentContribution > 0) {
      balance += currentContribution;
      totalContributions += currentContribution;
      yearlyContributions += currentContribution;
      growthThisPeriod = balance * periodicRate;
      balance += growthThisPeriod;
    } else {
      growthThisPeriod = balance * periodicRate;
      balance += growthThisPeriod;
      if (currentContribution > 0) {
        balance += currentContribution;
        totalContributions += currentContribution;
        yearlyContributions += currentContribution;
      }
    }

    yearlyGrowth += growthThisPeriod;
    totalGrowth += growthThisPeriod;

    // Record yearly milestone or when target reached
    if (periodCount % periodsPerYear === 0 || balance >= targetAmount) {
      const yearFraction = periodCount / periodsPerYear;
      const inflationFactor = Math.pow(1 + (inflationRate / 100), yearFraction);
      const realBalance = balance / inflationFactor;

      const milestoneDate = new Date(startDate);
      milestoneDate.setMonth(milestoneDate.getMonth() + Math.round((periodCount / periodsPerYear) * 12));

      schedule.push({
        year: currentYear,
        month: Math.round((periodCount % periodsPerYear) * (12 / periodsPerYear)) || 12,
        dateStr: milestoneDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startingBalance: Math.round(yearlyStartBalance),
        contributions: Math.round(yearlyContributions),
        growth: Math.round(yearlyGrowth),
        endingBalance: Math.round(balance),
        realEndingBalance: Math.round(realBalance),
        totalContributionsSoFar: Math.round(totalContributions),
        totalGrowthSoFar: Math.round(totalGrowth),
      });

      yearlyStartBalance = balance;
      yearlyContributions = 0;
      yearlyGrowth = 0;
    }
  }

  if (periodCount >= maxPeriods && balance < targetAmount) {
    return {
      isPossible: false,
      isAlreadyAchieved: false,
      message: 'Under these assumptions, it would take more than 100 years to reach the target amount.',
      years: 100,
      months: 0,
      days: 0,
      totalMonths: 1200,
      targetDate: new Date(startDate.getFullYear() + 100, startDate.getMonth(), startDate.getDate()),
      currentAmount,
      targetAmount,
      finalNominalBalance: balance,
      finalRealBalance: balance / Math.pow(1 + inflationRate / 100, 100),
      totalContributions,
      totalGrowth,
      netEffectiveAnnualReturn: netAnnualReturn,
      inflationAdjustedTarget: targetAmount,
      schedule
    };
  }

  const totalYearsFloat = periodCount / periodsPerYear;
  const totalMonths = Math.floor(totalYearsFloat * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const remainingDays = Math.round((totalYearsFloat * 365.25) % 30.4375);

  const targetDate = new Date(startDate);
  targetDate.setDate(targetDate.getDate() + Math.round(totalYearsFloat * 365.25));

  const inflationFactor = Math.pow(1 + inflationRate / 100, totalYearsFloat);
  const inflationAdjustedTarget = targetAmount * inflationFactor;
  const finalRealBalance = balance / inflationFactor;

  return {
    isPossible: true,
    isAlreadyAchieved: false,
    years,
    months,
    days: remainingDays,
    totalMonths,
    targetDate,
    currentAmount,
    targetAmount,
    finalNominalBalance: Math.round(balance),
    finalRealBalance: Math.round(finalRealBalance),
    totalContributions: Math.round(totalContributions),
    totalGrowth: Math.round(totalGrowth),
    netEffectiveAnnualReturn: Number(netAnnualReturn.toFixed(2)),
    inflationAdjustedTarget: Math.round(inflationAdjustedTarget),
    schedule
  };
}

/**
 * FUTURE VALUE CALCULATOR
 */
export function calculateFutureValue(input: FutureValueInput): FutureValueResult {
  const {
    initialAmount = 0,
    annualReturn = 12,
    timeYears = 10,
    compoundingFrequency = 'monthly',
    recurringContribution = 0,
    contributionFrequency = 'monthly',
    contributionTiming = 'end',
    annualStepUpPercent = 0,
    inflationRate = 0,
    taxRate = 0,
    expenseRatio = 0
  } = input;

  const netAnnualReturn = getNetAnnualRate(annualReturn, expenseRatio, taxRate);
  const periodsPerYear = contributionFrequency === 'none' ? 12 : CONTRIBUTION_PERIODS[contributionFrequency];
  const periodicRate = getEffectivePeriodicRate(netAnnualReturn, compoundingFrequency, periodsPerYear);
  const totalPeriods = Math.round(timeYears * periodsPerYear);

  let balance = initialAmount;
  let totalContributions = 0;
  let totalGrowth = 0;
  let currentContribution = recurringContribution;
  const schedule: YearlyMilestone[] = [];

  let yearlyStartBalance = balance;
  let yearlyContributions = 0;
  let yearlyGrowth = 0;

  for (let p = 1; p <= totalPeriods; p++) {
    const currentYear = Math.floor((p - 1) / periodsPerYear) + 1;

    if (annualStepUpPercent > 0 && p > 1 && (p - 1) % periodsPerYear === 0) {
      currentContribution *= (1 + annualStepUpPercent / 100);
    }

    let growthThisPeriod = 0;
    if (contributionTiming === 'beginning' && currentContribution > 0) {
      balance += currentContribution;
      totalContributions += currentContribution;
      yearlyContributions += currentContribution;
      growthThisPeriod = balance * periodicRate;
      balance += growthThisPeriod;
    } else {
      growthThisPeriod = balance * periodicRate;
      balance += growthThisPeriod;
      if (currentContribution > 0) {
        balance += currentContribution;
        totalContributions += currentContribution;
        yearlyContributions += currentContribution;
      }
    }

    yearlyGrowth += growthThisPeriod;
    totalGrowth += growthThisPeriod;

    if (p % periodsPerYear === 0 || p === totalPeriods) {
      const yearElapsed = p / periodsPerYear;
      const inflationFactor = Math.pow(1 + inflationRate / 100, yearElapsed);
      const realBalance = balance / inflationFactor;

      schedule.push({
        year: currentYear,
        month: Math.round((p % periodsPerYear) * (12 / periodsPerYear)) || 12,
        dateStr: `Year ${currentYear}`,
        startingBalance: Math.round(yearlyStartBalance),
        contributions: Math.round(yearlyContributions),
        growth: Math.round(yearlyGrowth),
        endingBalance: Math.round(balance),
        realEndingBalance: Math.round(realBalance),
        totalContributionsSoFar: Math.round(totalContributions),
        totalGrowthSoFar: Math.round(totalGrowth)
      });

      yearlyStartBalance = balance;
      yearlyContributions = 0;
      yearlyGrowth = 0;
    }
  }

  const inflationFactor = Math.pow(1 + inflationRate / 100, timeYears);
  const inflationAdjustedValue = balance / inflationFactor;

  // Effective CAGR = (Ending / Total Invested)^(1/years) - 1
  const totalInvested = initialAmount + totalContributions;
  let effectiveCagr = 0;
  if (totalInvested > 0 && timeYears > 0) {
    effectiveCagr = (Math.pow(balance / totalInvested, 1 / timeYears) - 1) * 100;
  }

  return {
    futureValue: Math.round(balance),
    totalContributions: Math.round(totalContributions),
    totalGrowth: Math.round(totalGrowth),
    inflationAdjustedValue: Math.round(inflationAdjustedValue),
    effectiveCagr: Number(effectiveCagr.toFixed(2)),
    schedule
  };
}

/**
 * REQUIRED RETURN CALCULATOR
 * Solves for the annual rate of return needed to reach target in given years.
 */
export function calculateRequiredReturn(input: RequiredReturnInput): RequiredReturnResult {
  const {
    currentAmount = 0,
    targetAmount = 0,
    timeYears = 10,
    contribution = 0,
    contributionFrequency = 'monthly',
    contributionTiming = 'end'
  } = input;

  if (timeYears <= 0) {
    return {
      isPossible: false,
      message: 'Time duration must be greater than 0 years.',
      requiredAnnualReturn: 0,
      effectiveAnnualReturn: 0,
      monthlyEquivalentReturn: 0
    };
  }

  if (targetAmount <= currentAmount && contribution === 0) {
    return {
      isPossible: true,
      message: 'Target is already reached without additional return.',
      requiredAnnualReturn: 0,
      effectiveAnnualReturn: 0,
      monthlyEquivalentReturn: 0
    };
  }

  // Without contributions, analytical CAGR:
  let returnWithoutContributions: number | undefined = undefined;
  if (currentAmount > 0 && targetAmount > 0) {
    returnWithoutContributions = (Math.pow(targetAmount / currentAmount, 1 / timeYears) - 1) * 100;
  }

  // Numerical solver for rate r (in percentage)
  const periodsPerYear = contributionFrequency === 'none' ? 12 : CONTRIBUTION_PERIODS[contributionFrequency];
  const totalPeriods = timeYears * periodsPerYear;

  const fvAtRate = (ratePercent: number): number => {
    const r = ratePercent / 100;
    if (Math.abs(r) < 1e-9) {
      return currentAmount + contribution * totalPeriods;
    }
    const periodicR = Math.pow(1 + r, 1 / periodsPerYear) - 1;
    let balance = currentAmount * Math.pow(1 + periodicR, totalPeriods);

    if (contribution > 0) {
      // Geometric sum: PMT * ((1+i)^N - 1) / i
      const annuityFactor = (Math.pow(1 + periodicR, totalPeriods) - 1) / periodicR;
      const timingFactor = contributionTiming === 'beginning' ? (1 + periodicR) : 1;
      balance += contribution * annuityFactor * timingFactor;
    }
    return balance;
  };

  // Bisection search between -90% and 500%
  let low = -90;
  let high = 500;
  let targetMet = false;
  let solvedRate = 0;

  for (let iter = 0; iter < 100; iter++) {
    const mid = (low + high) / 2;
    const fv = fvAtRate(mid);

    if (Math.abs(fv - targetAmount) < 1) {
      solvedRate = mid;
      targetMet = true;
      break;
    }

    if (fv < targetAmount) {
      low = mid;
    } else {
      high = mid;
    }
  }

  if (!targetMet) {
    solvedRate = (low + high) / 2;
  }

  let warning: string | undefined = undefined;
  if (solvedRate > 25) {
    warning = 'This required return is exceptionally high (>25%) and carries substantial market risk or may be unrealistic.';
  } else if (solvedRate < 0) {
    warning = 'A negative return is required because your contributions alone exceed the target amount.';
  }

  const monthlyEquivalent = (Math.pow(1 + solvedRate / 100, 1 / 12) - 1) * 100;

  return {
    isPossible: true,
    requiredAnnualReturn: Number(solvedRate.toFixed(2)),
    effectiveAnnualReturn: Number(solvedRate.toFixed(2)),
    monthlyEquivalentReturn: Number(monthlyEquivalent.toFixed(2)),
    returnWithoutContributions: returnWithoutContributions !== undefined ? Number(returnWithoutContributions.toFixed(2)) : undefined,
    warning
  };
}

/**
 * REQUIRED INITIAL INVESTMENT (Lump Sum)
 */
export function calculateRequiredInitialInvestment(input: RequiredInitialInvestmentInput): number {
  const {
    targetAmount = 0,
    timeYears = 10,
    expectedAnnualReturn = 12,
    compoundingFrequency = 'monthly',
    recurringContribution = 0,
    contributionFrequency = 'monthly',
    contributionTiming = 'end'
  } = input;

  if (timeYears <= 0) return targetAmount;

  const periodsPerYear = contributionFrequency === 'none' ? 12 : CONTRIBUTION_PERIODS[contributionFrequency];
  const periodicRate = getEffectivePeriodicRate(expectedAnnualReturn, compoundingFrequency, periodsPerYear);
  const totalPeriods = timeYears * periodsPerYear;

  let contributionFV = 0;
  if (recurringContribution > 0) {
    if (periodicRate === 0) {
      contributionFV = recurringContribution * totalPeriods;
    } else {
      const annuityFactor = (Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate;
      const timingFactor = contributionTiming === 'beginning' ? (1 + periodicRate) : 1;
      contributionFV = recurringContribution * annuityFactor * timingFactor;
    }
  }

  const remainingTarget = Math.max(0, targetAmount - contributionFV);
  const compoundFactor = Math.pow(1 + periodicRate, totalPeriods);
  const requiredInitial = remainingTarget / compoundFactor;

  return Math.max(0, Math.round(requiredInitial));
}

/**
 * REQUIRED PERIODIC CONTRIBUTION (SIP)
 */
export function calculateRequiredContribution(input: RequiredContributionInput): RequiredContributionResult {
  const {
    currentAmount = 0,
    targetAmount = 0,
    timeYears = 10,
    expectedAnnualReturn = 12,
    compoundingFrequency = 'monthly',
    contributionFrequency = 'monthly',
    contributionTiming = 'end'
  } = input;

  if (timeYears <= 0) {
    return { requiredPeriodicContribution: 0, monthlyEquivalent: 0, yearlyEquivalent: 0 };
  }

  const periodsPerYear = CONTRIBUTION_PERIODS[contributionFrequency];
  const periodicRate = getEffectivePeriodicRate(expectedAnnualReturn, compoundingFrequency, periodsPerYear);
  const totalPeriods = timeYears * periodsPerYear;

  // FV of initial corpus alone
  const initialFV = currentAmount * Math.pow(1 + periodicRate, totalPeriods);
  const gap = Math.max(0, targetAmount - initialFV);

  if (gap <= 0) {
    return { requiredPeriodicContribution: 0, monthlyEquivalent: 0, yearlyEquivalent: 0 };
  }

  let requiredPeriodic = 0;
  if (periodicRate === 0) {
    requiredPeriodic = gap / totalPeriods;
  } else {
    const annuityFactor = (Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate;
    const timingFactor = contributionTiming === 'beginning' ? (1 + periodicRate) : 1;
    requiredPeriodic = gap / (annuityFactor * timingFactor);
  }

  const monthlyEquivalent = (requiredPeriodic * periodsPerYear) / 12;
  const yearlyEquivalent = requiredPeriodic * periodsPerYear;

  return {
    requiredPeriodicContribution: Math.round(requiredPeriodic),
    monthlyEquivalent: Math.round(monthlyEquivalent),
    yearlyEquivalent: Math.round(yearlyEquivalent)
  };
}

/**
 * CAGR (Compound Annual Growth Rate)
 */
export function calculateCagr(startingAmount: number, endingAmount: number, years: number): number {
  if (startingAmount <= 0 || endingAmount <= 0 || years <= 0) return 0;
  return Number(((Math.pow(endingAmount / startingAmount, 1 / years) - 1) * 100).toFixed(2));
}

/**
 * SIMPLE INTEREST
 */
export function calculateSimpleInterest(principal: number, annualRate: number, timeYears: number) {
  const interest = principal * (annualRate / 100) * timeYears;
  const totalAmount = principal + interest;
  return {
    interest: Math.round(interest),
    totalAmount: Math.round(totalAmount)
  };
}

/**
 * COMPOUND INTEREST
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  timeYears: number,
  compoundingFrequency: CompoundingFrequency = 'annually'
) {
  const n = COMPOUNDING_PERIODS[compoundingFrequency];
  const r = annualRate / 100;
  const totalAmount = principal * Math.pow(1 + r / n, n * timeYears);
  const totalInterest = totalAmount - principal;

  return {
    totalInterest: Math.round(totalInterest),
    totalAmount: Math.round(totalAmount)
  };
}

/**
 * INFLATION IMPACT CALCULATOR
 */
export function calculateInflationImpact(
  currentAmount: number,
  annualInflationRate: number,
  years: number,
  nominalReturnRate: number = 0
) {
  const inflationFactor = Math.pow(1 + annualInflationRate / 100, years);
  const futurePurchasingPower = currentAmount / inflationFactor; // today's X will buy this much in future
  const futureAmountRequired = currentAmount * inflationFactor; // to match today's purchasing power

  // Real rate of return using Fisher equation: (1 + r) / (1 + i) - 1
  const r = nominalReturnRate / 100;
  const i = annualInflationRate / 100;
  const realRate = ((1 + r) / (1 + i) - 1) * 100;

  return {
    futurePurchasingPower: Math.round(futurePurchasingPower),
    futureAmountRequired: Math.round(futureAmountRequired),
    realRateOfReturn: Number(realRate.toFixed(2))
  };
}

/**
 * SWP (Systematic Withdrawal Plan / Periodic Withdrawal)
 */
export function calculateSwp(input: SwpInput): SwpResult {
  const {
    startingAmount = 1000000,
    expectedAnnualReturn = 8,
    withdrawalAmount = 10000,
    withdrawalFrequency = 'monthly',
    annualWithdrawalIncreasePercent = 0,
    timeYears = 20
  } = input;

  const periodsPerYear = CONTRIBUTION_PERIODS[withdrawalFrequency];
  const periodicRate = getEffectivePeriodicRate(expectedAnnualReturn, 'monthly', periodsPerYear);
  const totalPeriods = timeYears * periodsPerYear;

  let balance = startingAmount;
  let totalWithdrawn = 0;
  let totalGrowth = 0;
  let currentWithdrawal = withdrawalAmount;
  let depletionMonths: number | null = null;
  const schedule: SwpMilestone[] = [];

  let yearlyGrowth = 0;
  let yearlyWithdrawn = 0;

  for (let p = 1; p <= totalPeriods; p++) {
    const currentYear = Math.floor((p - 1) / periodsPerYear) + 1;

    // Annual inflation/step-up in withdrawal amount
    if (annualWithdrawalIncreasePercent > 0 && p > 1 && (p - 1) % periodsPerYear === 0) {
      currentWithdrawal *= (1 + annualWithdrawalIncreasePercent / 100);
    }

    const growthThisPeriod = balance * periodicRate;
    balance += growthThisPeriod;
    yearlyGrowth += growthThisPeriod;
    totalGrowth += growthThisPeriod;

    const actualWithdrawal = Math.min(balance, currentWithdrawal);
    balance -= actualWithdrawal;
    yearlyWithdrawn += actualWithdrawal;
    totalWithdrawn += actualWithdrawal;

    if (balance <= 0 && depletionMonths === null) {
      depletionMonths = Math.round((p / periodsPerYear) * 12);
      balance = 0;
    }

    if (p % periodsPerYear === 0 || p === totalPeriods || balance <= 0) {
      schedule.push({
        year: currentYear,
        month: Math.round((p % periodsPerYear) * (12 / periodsPerYear)) || 12,
        balance: Math.round(balance),
        totalWithdrawn: Math.round(totalWithdrawn),
        totalGrowth: Math.round(totalGrowth),
        annualWithdrawal: Math.round(yearlyWithdrawn)
      });
      yearlyGrowth = 0;
      yearlyWithdrawn = 0;
    }

    if (balance <= 0) break;
  }

  const isSustainable = depletionMonths === null;
  const depletionYears = depletionMonths !== null ? Number((depletionMonths / 12).toFixed(1)) : null;

  let depletionDateStr: string | null = null;
  if (depletionMonths !== null) {
    const date = new Date();
    date.setMonth(date.getMonth() + depletionMonths);
    depletionDateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  let warning: string | undefined = undefined;
  if (!isSustainable) {
    warning = `Warning: The corpus will be completely depleted in approximately ${depletionYears} years (${depletionDateStr}). Consider lowering the withdrawal amount or increasing returns.`;
  }

  return {
    isSustainable,
    depletionMonths,
    depletionYears,
    depletionDateStr,
    remainingCorpus: Math.round(balance),
    totalWithdrawn: Math.round(totalWithdrawn),
    totalGrowth: Math.round(totalGrowth),
    schedule,
    warning
  };
}

/**
 * XIRR (Extended Internal Rate of Return)
 * Computes annualized rate of return for irregular cash flows and dates.
 */
export function calculateXirr(cashFlows: CashFlow[]): XirrResult {
  if (cashFlows.length < 2) {
    return { isPossible: false, rate: 0, message: 'At least two cash flows are required.' };
  }

  // Ensure there is at least one negative and one positive cash flow
  const hasNegative = cashFlows.some((c) => c.amount < 0);
  const hasPositive = cashFlows.some((c) => c.amount > 0);
  if (!hasNegative || !hasPositive) {
    return {
      isPossible: false,
      rate: 0,
      message: 'Cash flows must contain both outflows (negative) and inflows (positive).'
    };
  }

  const dates = cashFlows.map((c) => new Date(c.date).getTime());
  const minDate = Math.min(...dates);
  const yearFractions = dates.map((d) => (d - minDate) / (1000 * 60 * 60 * 24 * 365.25));

  // Newton-Raphson method
  const npv = (rate: number): number => {
    let sum = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      sum += cashFlows[i].amount / Math.pow(1 + rate, yearFractions[i]);
    }
    return sum;
  };

  const derivativeNpv = (rate: number): number => {
    let sum = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      sum -= (yearFractions[i] * cashFlows[i].amount) / Math.pow(1 + rate, yearFractions[i] + 1);
    }
    return sum;
  };

  let rate = 0.1; // initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    const value = npv(rate);
    const deriv = derivativeNpv(rate);

    if (Math.abs(deriv) < 1e-12) break;

    const nextRate = rate - value / deriv;
    if (Math.abs(nextRate - rate) < tolerance) {
      return { isPossible: true, rate: Number((nextRate * 100).toFixed(2)) };
    }
    rate = nextRate;
    if (rate <= -1) rate = -0.999;
  }

  // Fallback to bisection if Newton-Raphson diverges
  let low = -0.99;
  let high = 5.0; // 500%
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const val = npv(mid);
    if (Math.abs(val) < tolerance) {
      return { isPossible: true, rate: Number((mid * 100).toFixed(2)) };
    }
    if (npv(low) * val < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return { isPossible: true, rate: Number(((low + high) / 2 * 100).toFixed(2)) };
}

/**
 * SENSITIVITY MATRIX GENERATOR
 * Generates what-if table for returns and contributions.
 */
export function generateSensitivityMatrix(input: TimeToTargetInput) {
  const baseReturn = input.expectedAnnualReturn;
  const baseContribution = input.contribution || 0;

  const returnVariations = [
    Math.max(2, baseReturn - 4),
    Math.max(2, baseReturn - 2),
    baseReturn,
    baseReturn + 2,
    baseReturn + 4,
    baseReturn + 6
  ];

  const contributionMultipliers = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const matrix = returnVariations.map((r) => {
    return {
      returnRate: r,
      rows: contributionMultipliers.map((m) => {
        const c = Math.round(baseContribution * m);
        const res = calculateTimeToTarget({
          ...input,
          expectedAnnualReturn: r,
          contribution: c
        });
        return {
          multiplier: m,
          contribution: c,
          years: res.years,
          months: res.months,
          isPossible: res.isPossible,
          targetDateStr: res.targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      })
    };
  });

  return matrix;
}
