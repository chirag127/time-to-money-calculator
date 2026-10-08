export type CompoundingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'annually';

export type ContributionFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'half-yearly' | 'annually' | 'none';

export type ContributionTiming = 'beginning' | 'end';

export type NumberFormatType = 'indian' | 'international';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'SGD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  defaultFormat: NumberFormatType;
}

export interface TimeToTargetInput {
  currentAmount: number;
  targetAmount: number;
  expectedAnnualReturn: number; // in percent (e.g. 12 for 12%)
  compoundingFrequency?: CompoundingFrequency;
  contribution?: number;
  contributionFrequency?: ContributionFrequency;
  contributionTiming?: ContributionTiming;
  annualStepUpPercent?: number; // annual SIP growth rate
  inflationRate?: number; // in percent
  taxRate?: number; // in percent on capital gains/growth
  expenseRatio?: number; // annual expense ratio / fee in percent
  startDate?: Date;
}

export interface YearlyMilestone {
  year: number;
  month: number;
  dateStr: string;
  startingBalance: number;
  contributions: number;
  growth: number;
  endingBalance: number;
  realEndingBalance: number; // inflation-adjusted
  totalContributionsSoFar: number;
  totalGrowthSoFar: number;
}

export interface TimeToTargetResult {
  isPossible: boolean;
  isAlreadyAchieved: boolean;
  message?: string;
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  targetDate: Date;
  currentAmount: number;
  targetAmount: number;
  finalNominalBalance: number;
  finalRealBalance: number;
  totalContributions: number;
  totalGrowth: number;
  netEffectiveAnnualReturn: number;
  inflationAdjustedTarget: number;
  schedule: YearlyMilestone[];
}

export interface FutureValueInput {
  initialAmount: number;
  annualReturn: number;
  timeYears: number;
  compoundingFrequency?: CompoundingFrequency;
  recurringContribution?: number;
  contributionFrequency?: ContributionFrequency;
  contributionTiming?: ContributionTiming;
  annualStepUpPercent?: number;
  inflationRate?: number;
  taxRate?: number;
  expenseRatio?: number;
}

export interface FutureValueResult {
  futureValue: number;
  totalContributions: number;
  totalGrowth: number;
  inflationAdjustedValue: number;
  effectiveCagr: number;
  schedule: YearlyMilestone[];
}

export interface RequiredReturnInput {
  currentAmount: number;
  targetAmount: number;
  timeYears: number;
  contribution?: number;
  contributionFrequency?: ContributionFrequency;
  contributionTiming?: ContributionTiming;
}

export interface RequiredReturnResult {
  isPossible: boolean;
  message?: string;
  requiredAnnualReturn: number; // percentage
  effectiveAnnualReturn: number;
  monthlyEquivalentReturn: number;
  returnWithoutContributions?: number;
  warning?: string;
}

export interface RequiredInitialInvestmentInput {
  targetAmount: number;
  timeYears: number;
  expectedAnnualReturn: number;
  compoundingFrequency?: CompoundingFrequency;
  recurringContribution?: number;
  contributionFrequency?: ContributionFrequency;
  contributionTiming?: ContributionTiming;
}

export interface RequiredContributionInput {
  currentAmount: number;
  targetAmount: number;
  timeYears: number;
  expectedAnnualReturn: number;
  compoundingFrequency?: CompoundingFrequency;
  contributionFrequency?: ContributionFrequency;
  contributionTiming?: ContributionTiming;
  annualStepUpPercent?: number;
}

export interface RequiredContributionResult {
  requiredPeriodicContribution: number;
  monthlyEquivalent: number;
  yearlyEquivalent: number;
}

export interface SwpInput {
  startingAmount: number;
  expectedAnnualReturn: number;
  withdrawalAmount: number;
  withdrawalFrequency?: ContributionFrequency;
  annualWithdrawalIncreasePercent?: number;
  timeYears: number;
  inflationRate?: number;
}

export interface SwpMilestone {
  year: number;
  month: number;
  balance: number;
  totalWithdrawn: number;
  totalGrowth: number;
  annualWithdrawal: number;
}

export interface SwpResult {
  isSustainable: boolean;
  depletionMonths: number | null; // null if sustained for full duration
  depletionYears: number | null;
  depletionDateStr: string | null;
  remainingCorpus: number;
  totalWithdrawn: number;
  totalGrowth: number;
  schedule: SwpMilestone[];
  warning?: string;
}

export interface CashFlow {
  date: string; // YYYY-MM-DD
  amount: number; // negative for investment, positive for return/withdrawal
}

export interface XirrResult {
  isPossible: boolean;
  rate: number; // percentage
  message?: string;
}

export interface ScenarioItem {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  expectedAnnualReturn: number;
  monthlyContribution: number;
  inflationRate: number;
}
