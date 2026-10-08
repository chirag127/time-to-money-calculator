import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  calculateTimeToTarget,
  calculateFutureValue,
  calculateRequiredReturn,
  calculateRequiredInitialInvestment,
  calculateRequiredContribution,
  calculateSwp,
  generateSensitivityMatrix
} from '../lib/calculator-engine';
import {
  formatCurrency,
  formatCompactCurrency,
  parseHumanNumber,
  encodeShareUrl,
  decodeShareUrl,
  exportScheduleToCsv
} from '../lib/formatters';
import type {
  CompoundingFrequency,
  ContributionFrequency,
  ContributionTiming,
  CurrencyCode,
  NumberFormatType,
  TimeToTargetResult,
  FutureValueResult,
  RequiredReturnResult,
  SwpResult
} from '../lib/types';
import {
  Clock,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Share2,
  Download,
  Printer,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  PieChart,
  HelpCircle,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';

interface Props {
  initialMode?: 'time' | 'future' | 'return' | 'lump' | 'sip' | 'swp' | 'scenarios';
  initialTarget?: number;
  initialCurrent?: number;
  initialReturn?: number;
  initialMonthly?: number;
  initialYears?: number;
  calculatorTitle?: string;
}

export default function InteractiveCalculator({
  initialMode = 'time',
  initialTarget = 10000000, // 1 Crore default
  initialCurrent = 500000,   // 5 Lakh
  initialReturn = 12,
  initialMonthly = 20000,
  initialYears = 10,
  calculatorTitle
}: Props) {
  // Global preferences state
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [formatType, setFormatType] = useState<NumberFormatType>('indian');

  // Calculator Mode state
  const [mode, setMode] = useState<string>(initialMode);

  // Inputs state
  const [currentAmount, setCurrentAmount] = useState<number>(initialCurrent);
  const [targetAmount, setTargetAmount] = useState<number>(initialTarget);
  const [expectedReturn, setExpectedReturn] = useState<number>(initialReturn);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(initialMonthly);
  const [timeYears, setTimeYears] = useState<number>(initialYears);
  const [compoundingFreq, setCompoundingFreq] = useState<CompoundingFrequency>('monthly');
  const [contributionFreq, setContributionFreq] = useState<ContributionFrequency>('monthly');
  const [contributionTiming, setContributionTiming] = useState<ContributionTiming>('end');
  const [annualStepUp, setAnnualStepUp] = useState<number>(0);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [expenseRatio, setExpenseRatio] = useState<number>(0);

  // SWP specific
  const [swpWithdrawal, setSwpWithdrawal] = useState<number>(50000);

  // Advanced settings toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showSensitivity, setShowSensitivity] = useState<boolean>(false);
  const [showFormulas, setShowFormulas] = useState<boolean>(false);
  const [showMilestones, setShowMilestones] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string>('');

  // Active chart hover milestone
  const [hoveredMilestoneIndex, setHoveredMilestoneIndex] = useState<number | null>(null);

  // Scenario Comparison items (up to 4)
  const [scenarios, setScenarios] = useState<Array<{
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    expectedReturn: number;
    monthlyContribution: number;
  }>>([
    { id: '1', name: 'Scenario A (Aggressive)', currentAmount: 500000, targetAmount: 10000000, expectedReturn: 14, monthlyContribution: 25000 },
    { id: '2', name: 'Scenario B (Balanced)', currentAmount: 500000, targetAmount: 10000000, expectedReturn: 12, monthlyContribution: 20000 },
    { id: '3', name: 'Scenario C (Conservative)', currentAmount: 500000, targetAmount: 10000000, expectedReturn: 9, monthlyContribution: 20000 },
  ]);

  // Sync with global header preferences and URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurr = localStorage.getItem('ttm_currency') as CurrencyCode;
      if (savedCurr) setCurrency(savedCurr);

      const savedFmt = localStorage.getItem('ttm_format') as NumberFormatType;
      if (savedFmt) setFormatType(savedFmt);

      const onCurrencyChange = (e: any) => setCurrency(e.detail);
      const onFormatChange = (e: any) => setFormatType(e.detail);

      window.addEventListener('ttm-currency-change', onCurrencyChange);
      window.addEventListener('ttm-format-change', onFormatChange);

      // Read URL query parameters
      if (window.location.search) {
        const decoded = decodeShareUrl(window.location.search);
        if (decoded.mode) setMode(decoded.mode);
        if (decoded.ca !== undefined) setCurrentAmount(decoded.ca);
        if (decoded.ta !== undefined) setTargetAmount(decoded.ta);
        if (decoded.r !== undefined) setExpectedReturn(decoded.r);
        if (decoded.c !== undefined) setMonthlyContribution(decoded.c);
        if (decoded.su !== undefined) setAnnualStepUp(decoded.su);
        if (decoded.inf !== undefined) setInflationRate(decoded.inf);
        if (decoded.tax !== undefined) setTaxRate(decoded.tax);
        if (decoded.exp !== undefined) setExpenseRatio(decoded.exp);
      }

      return () => {
        window.removeEventListener('ttm-currency-change', onCurrencyChange);
        window.removeEventListener('ttm-format-change', onFormatChange);
      };
    }
  }, []);

  // Recalculate results based on active mode
  const timeResult: TimeToTargetResult = useMemo(() => {
    return calculateTimeToTarget({
      currentAmount,
      targetAmount,
      expectedAnnualReturn: expectedReturn,
      compoundingFrequency: compoundingFreq,
      contribution: monthlyContribution,
      contributionFrequency: contributionFreq,
      contributionTiming,
      annualStepUpPercent: annualStepUp,
      inflationRate,
      taxRate,
      expenseRatio
    });
  }, [currentAmount, targetAmount, expectedReturn, compoundingFreq, monthlyContribution, contributionFreq, contributionTiming, annualStepUp, inflationRate, taxRate, expenseRatio]);

  const fvResult: FutureValueResult = useMemo(() => {
    return calculateFutureValue({
      initialAmount: currentAmount,
      annualReturn: expectedReturn,
      timeYears,
      compoundingFrequency: compoundingFreq,
      recurringContribution: monthlyContribution,
      contributionFrequency: contributionFreq,
      contributionTiming,
      annualStepUpPercent: annualStepUp,
      inflationRate,
      taxRate,
      expenseRatio
    });
  }, [currentAmount, expectedReturn, timeYears, compoundingFreq, monthlyContribution, contributionFreq, contributionTiming, annualStepUp, inflationRate, taxRate, expenseRatio]);

  const reqReturnResult: RequiredReturnResult = useMemo(() => {
    return calculateRequiredReturn({
      currentAmount,
      targetAmount,
      timeYears,
      contribution: monthlyContribution,
      contributionFrequency: contributionFreq,
      contributionTiming
    });
  }, [currentAmount, targetAmount, timeYears, monthlyContribution, contributionFreq, contributionTiming]);

  const reqLumpSum: number = useMemo(() => {
    return calculateRequiredInitialInvestment({
      targetAmount,
      timeYears,
      expectedAnnualReturn: expectedReturn,
      compoundingFrequency: compoundingFreq,
      recurringContribution: monthlyContribution,
      contributionFrequency: contributionFreq,
      contributionTiming
    });
  }, [targetAmount, timeYears, expectedReturn, compoundingFreq, monthlyContribution, contributionFreq, contributionTiming]);

  const reqContribution = useMemo(() => {
    return calculateRequiredContribution({
      currentAmount,
      targetAmount,
      timeYears,
      expectedAnnualReturn: expectedReturn,
      compoundingFrequency: compoundingFreq,
      contributionFrequency: contributionFreq,
      contributionTiming
    });
  }, [currentAmount, targetAmount, timeYears, expectedReturn, compoundingFreq, contributionFreq, contributionTiming]);

  const swpResult: SwpResult = useMemo(() => {
    return calculateSwp({
      startingAmount: currentAmount,
      expectedAnnualReturn: expectedReturn,
      withdrawalAmount: swpWithdrawal,
      withdrawalFrequency: contributionFreq,
      timeYears,
      annualWithdrawalIncreasePercent: inflationRate
    });
  }, [currentAmount, expectedReturn, swpWithdrawal, contributionFreq, timeYears, inflationRate]);

  // Sensitivity Matrix
  const sensitivityData = useMemo(() => {
    return generateSensitivityMatrix({
      currentAmount,
      targetAmount,
      expectedAnnualReturn: expectedReturn,
      compoundingFrequency: compoundingFreq,
      contribution: monthlyContribution,
      contributionFrequency: contributionFreq,
      contributionTiming,
      annualStepUpPercent: annualStepUp,
      inflationRate,
      taxRate,
      expenseRatio
    });
  }, [currentAmount, targetAmount, expectedReturn, compoundingFreq, monthlyContribution, contributionFreq, contributionTiming, annualStepUp, inflationRate, taxRate, expenseRatio]);

  // Copy share URL handler
  const handleCopyShareLink = () => {
    const url = encodeShareUrl(
      {
        mode,
        ca: currentAmount,
        ta: targetAmount,
        r: expectedReturn,
        c: monthlyContribution,
        cf: contributionFreq,
        cmp: compoundingFreq,
        ct: contributionTiming,
        su: annualStepUp,
        inf: inflationRate,
        tax: taxRate,
        exp: expenseRatio
      },
      window.location.origin + window.location.pathname
    );

    navigator.clipboard.writeText(url).then(() => {
      setCopyToast('Link copied to clipboard!');
      setTimeout(() => setCopyToast(''), 3000);
    });
  };

  // Export CSV handler
  const handleExportCsv = () => {
    const schedule = mode === 'future' ? fvResult.schedule : timeResult.schedule;
    exportScheduleToCsv(schedule, `time-to-money-${mode}-projection.csv`);
  };

  // Reset to default
  const handleReset = () => {
    setCurrentAmount(500000);
    setTargetAmount(10000000);
    setExpectedReturn(12);
    setMonthlyContribution(20000);
    setTimeYears(10);
    setAnnualStepUp(0);
    setInflationRate(6);
    setTaxRate(0);
    setExpenseRatio(0);
  };

  // Preset quick click
  const applyPreset = (ca: number, ta: number, r: number, mc: number) => {
    setCurrentAmount(ca);
    setTargetAmount(ta);
    setExpectedReturn(r);
    setMonthlyContribution(mc);
  };

  // Active schedule for rendering charts & milestones
  const activeSchedule = mode === 'future' ? fvResult.schedule : (mode === 'swp' ? [] : timeResult.schedule);

  // SVG Chart Dimensions & Computations
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 20, right: 25, bottom: 35, left: 55 };

  const maxVal = Math.max(
    targetAmount * 1.05,
    ...activeSchedule.map(s => Math.max(s.endingBalance, s.totalContributionsSoFar || 0)),
    1000
  );

  const getX = (index: number) => {
    if (activeSchedule.length <= 1) return padding.left;
    return padding.left + (index / (activeSchedule.length - 1)) * (chartWidth - padding.left - padding.right);
  };

  const getY = (val: number) => {
    const usableH = chartHeight - padding.top - padding.bottom;
    return chartHeight - padding.bottom - (val / maxVal) * usableH;
  };

  const balancePoints = activeSchedule.map((s, idx) => `${getX(idx)},${getY(s.endingBalance)}`).join(' ');
  const contribPoints = activeSchedule.map((s, idx) => `${getX(idx)},${getY(s.totalContributionsSoFar + currentAmount)}`).join(' ');
  const realPoints = activeSchedule.map((s, idx) => `${getX(idx)},${getY(s.realEndingBalance)}`).join(' ');

  return (
    <div className="calculator-widget" id="calculator-root">
      {/* Top Mode Selection Tabs */}
      <div className="calc-tabs" role="tablist" aria-label="Calculator Modes">
        <button
          className={`calc-tab ${mode === 'time' ? 'active' : ''}`}
          onClick={() => setMode('time')}
          role="tab"
          aria-selected={mode === 'time'}
        >
          <Clock size={16} />
          <span>Time to Target</span>
        </button>
        <button
          className={`calc-tab ${mode === 'future' ? 'active' : ''}`}
          onClick={() => setMode('future')}
          role="tab"
          aria-selected={mode === 'future'}
        >
          <TrendingUp size={16} />
          <span>Future Value</span>
        </button>
        <button
          className={`calc-tab ${mode === 'return' ? 'active' : ''}`}
          onClick={() => setMode('return')}
          role="tab"
          aria-selected={mode === 'return'}
        >
          <Target size={16} />
          <span>Required Return</span>
        </button>
        <button
          className={`calc-tab ${mode === 'sip' ? 'active' : ''}`}
          onClick={() => setMode('sip')}
          role="tab"
          aria-selected={mode === 'sip'}
        >
          <DollarSign size={16} />
          <span>Required SIP</span>
        </button>
        <button
          className={`calc-tab ${mode === 'lump' ? 'active' : ''}`}
          onClick={() => setMode('lump')}
          role="tab"
          aria-selected={mode === 'lump'}
        >
          <Layers size={16} />
          <span>Lump Sum Needed</span>
        </button>
        <button
          className={`calc-tab ${mode === 'swp' ? 'active' : ''}`}
          onClick={() => setMode('swp')}
          role="tab"
          aria-selected={mode === 'swp'}
        >
          <Calendar size={16} />
          <span>SWP / Withdrawals</span>
        </button>
        <button
          className={`calc-tab ${mode === 'scenarios' ? 'active' : ''}`}
          onClick={() => setMode('scenarios')}
          role="tab"
          aria-selected={mode === 'scenarios'}
        >
          <Sliders size={16} />
          <span>Compare Scenarios</span>
        </button>
      </div>

      {/* Preset Goal Pills */}
      {mode === 'time' && (
        <div className="presets-banner">
          <span className="presets-title">Popular Goals:</span>
          <div className="presets-scroll">
            <button className="preset-btn" onClick={() => applyPreset(100000, 1000000, 12, 10000)}>
              ₹1L → ₹10 Lakh
            </button>
            <button className="preset-btn" onClick={() => applyPreset(100000, 5000000, 12, 15000)}>
              ₹1L → ₹50 Lakh
            </button>
            <button className="preset-btn" onClick={() => applyPreset(1000000, 10000000, 12, 20000)}>
              ₹10L → ₹1 Crore
            </button>
            <button className="preset-btn highlight" onClick={() => applyPreset(0, 10000000, 12, 20000)}>
              ₹20k/mo → ₹1 Crore
            </button>
            <button className="preset-btn" onClick={() => applyPreset(500000, 20000000, 12, 35000)}>
              ₹5L → ₹2 Crore
            </button>
            <button className="preset-btn" onClick={() => applyPreset(1000000, 50000000, 14, 50000)}>
              ₹10L → ₹5 Crore
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout (Inputs Left, Results Right) */}
      <div className="calc-body-grid">
        {/* INPUTS COLUMN */}
        <div className="calc-inputs-card">
          <div className="card-header">
            <h3>{calculatorTitle || 'Calculator Parameters'}</h3>
            <span className="input-mode-label">{mode.toUpperCase()} MODE</span>
          </div>

          {/* Current Money */}
          <div className="form-group">
            <div className="form-label">
              <span>Current Savings / Initial Amount</span>
              <span className="compact-value">{formatCompactCurrency(currentAmount, currency, formatType)}</span>
            </div>
            <div className="input-wrapper">
              <span className="input-prefix">{formatCurrency(0, currency, formatType).replace('0', '')}</span>
              <input
                type="number"
                className="form-control has-prefix"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(parseHumanNumber(e.target.value))}
                min={0}
                step={10000}
                aria-label="Current Savings or Initial Amount"
              />
            </div>
            <div className="preset-pills">
              {[0, 100000, 500000, 1000000, 2500000].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`preset-pill ${currentAmount === val ? 'active' : ''}`}
                  onClick={() => setCurrentAmount(val)}
                >
                  {formatCompactCurrency(val, currency, formatType)}
                </button>
              ))}
            </div>
          </div>

          {/* Target Money (For Time, Return, Lump Sum, SIP modes) */}
          {mode !== 'future' && mode !== 'swp' && (
            <div className="form-group">
              <div className="form-label">
                <span>Target Wealth Goal</span>
                <span className="compact-value accent">{formatCompactCurrency(targetAmount, currency, formatType)}</span>
              </div>
              <div className="input-wrapper">
                <span className="input-prefix">{formatCurrency(0, currency, formatType).replace('0', '')}</span>
                <input
                  type="number"
                  className="form-control has-prefix"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(parseHumanNumber(e.target.value))}
                  min={1000}
                  step={50000}
                  aria-label="Target Wealth Goal"
                />
              </div>
              <div className="preset-pills">
                {[1000000, 2500000, 5000000, 10000000, 20000000, 50000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`preset-pill ${targetAmount === val ? 'active' : ''}`}
                    onClick={() => setTargetAmount(val)}
                  >
                    {formatCompactCurrency(val, currency, formatType)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expected Annual Return (Not needed for 'return' mode) */}
          {mode !== 'return' && (
            <div className="form-group">
              <div className="form-label">
                <span>Expected Annual Return Rate</span>
                <span className="compact-value">{expectedReturn}% p.a.</span>
              </div>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="form-control has-suffix"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)}
                  min={-20}
                  max={60}
                  step={0.5}
                  aria-label="Expected Annual Return Rate"
                />
                <span className="input-suffix">%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min={1}
                max={30}
                step={0.5}
                value={Math.max(1, Math.min(30, expectedReturn))}
                onChange={(e) => setExpectedReturn(parseFloat(e.target.value))}
                aria-label="Expected Return Slider"
              />
              <div className="preset-pills">
                {[7, 9, 11, 12, 14, 15, 18].map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`preset-pill ${expectedReturn === r ? 'active' : ''}`}
                    onClick={() => setExpectedReturn(r)}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time in Years (For Future Value, Required Return, SIP, Lump Sum modes) */}
          {mode !== 'time' && (
            <div className="form-group">
              <div className="form-label">
                <span>Investment Horizon / Duration</span>
                <span className="compact-value">{timeYears} Years ({timeYears * 12} Months)</span>
              </div>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="form-control has-suffix"
                  value={timeYears}
                  onChange={(e) => setTimeYears(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={50}
                  aria-label="Investment Duration in Years"
                />
                <span className="input-suffix">Years</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min={1}
                max={40}
                value={timeYears}
                onChange={(e) => setTimeYears(parseInt(e.target.value))}
                aria-label="Duration Slider"
              />
              <div className="preset-pills">
                {[3, 5, 7, 10, 15, 20, 25, 30].map(y => (
                  <button
                    key={y}
                    type="button"
                    className={`preset-pill ${timeYears === y ? 'active' : ''}`}
                    onClick={() => setTimeYears(y)}
                  >
                    {y} Yrs
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly / Periodic Contribution (Not in Lump Sum or SWP mode) */}
          {mode !== 'lump' && mode !== 'swp' && (
            <div className="form-group">
              <div className="form-label">
                <span>Periodic Contribution (SIP)</span>
                <span className="compact-value">{formatCurrency(monthlyContribution, currency, formatType)}/mo</span>
              </div>
              <div className="input-wrapper">
                <span className="input-prefix">{formatCurrency(0, currency, formatType).replace('0', '')}</span>
                <input
                  type="number"
                  className="form-control has-prefix"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(parseHumanNumber(e.target.value))}
                  min={0}
                  step={1000}
                  aria-label="Periodic Contribution Amount"
                />
              </div>
              <input
                type="range"
                className="range-slider"
                min={0}
                max={150000}
                step={2500}
                value={Math.min(150000, monthlyContribution)}
                onChange={(e) => setMonthlyContribution(parseInt(e.target.value))}
                aria-label="Contribution Slider"
              />
              <div className="preset-pills">
                {[0, 5000, 10000, 15000, 20000, 25000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`preset-pill ${monthlyContribution === val ? 'active' : ''}`}
                    onClick={() => setMonthlyContribution(val)}
                  >
                    {formatCompactCurrency(val, currency, formatType)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SWP Withdrawal Amount */}
          {mode === 'swp' && (
            <div className="form-group">
              <div className="form-label">
                <span>Monthly Withdrawal Amount</span>
                <span className="compact-value accent-rose">{formatCurrency(swpWithdrawal, currency, formatType)}</span>
              </div>
              <div className="input-wrapper">
                <span className="input-prefix">{formatCurrency(0, currency, formatType).replace('0', '')}</span>
                <input
                  type="number"
                  className="form-control has-prefix"
                  value={swpWithdrawal}
                  onChange={(e) => setSwpWithdrawal(parseHumanNumber(e.target.value))}
                  min={1000}
                  step={5000}
                  aria-label="Monthly Withdrawal Amount"
                />
              </div>
            </div>
          )}

          {/* Advanced Settings Accordion Toggle */}
          <div className="advanced-toggle-bar">
            <button
              type="button"
              className="advanced-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Sliders size={15} />
              <span>Advanced Parameters (Step-up, Compounding, Inflation, Taxes)</span>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Advanced Settings Fields */}
          {showAdvanced && (
            <div className="advanced-fields-box">
              <div className="grid-2-col">
                <div className="form-group">
                  <label className="form-label">Compounding Frequency</label>
                  <select
                    className="form-control"
                    value={compoundingFreq}
                    onChange={(e) => setCompoundingFreq(e.target.value as CompoundingFrequency)}
                  >
                    <option value="monthly">Monthly Compounding</option>
                    <option value="quarterly">Quarterly Compounding</option>
                    <option value="half-yearly">Half-Yearly Compounding</option>
                    <option value="annually">Annual Compounding</option>
                    <option value="daily">Daily Compounding</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contribution Timing</label>
                  <select
                    className="form-control"
                    value={contributionTiming}
                    onChange={(e) => setContributionTiming(e.target.value as ContributionTiming)}
                  >
                    <option value="end">End of Period (Standard)</option>
                    <option value="beginning">Beginning of Period (Annuity Due)</option>
                  </select>
                </div>
              </div>

              <div className="grid-3-col">
                <div className="form-group">
                  <label className="form-label">Annual Step-Up SIP (%)</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      className="form-control has-suffix"
                      value={annualStepUp}
                      onChange={(e) => setAnnualStepUp(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={30}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Inflation (%)</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      className="form-control has-suffix"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={20}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tax on Returns (%)</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      className="form-control has-suffix"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={40}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Ratio / Annual Platform Fee (%)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    className="form-control has-suffix"
                    value={expenseRatio}
                    onChange={(e) => setExpenseRatio(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={5}
                    step={0.1}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="calc-actions-footer">
            <button type="button" className="action-pill-btn" onClick={handleCopyShareLink} title="Copy Shareable Calculation URL">
              <Share2 size={14} />
              <span>Share Link</span>
            </button>
            <button type="button" className="action-pill-btn" onClick={handleExportCsv} title="Download CSV Breakdown">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button type="button" className="action-pill-btn" onClick={() => window.print()} title="Print or Save as PDF">
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button type="button" className="action-pill-btn reset" onClick={handleReset} title="Reset to Defaults">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          {copyToast && (
            <div className="copy-toast">
              <CheckCircle2 size={16} />
              <span>{copyToast}</span>
            </div>
          )}
        </div>

        {/* RESULTS COLUMN */}
        <div className="calc-results-card">
          {/* FLAGSHIP HERO RESULT */}
          {mode === 'time' && (
            <div className="hero-result-card">
              <div className="hero-top-badge">
                <Clock size={16} />
                <span>Estimated Time to Reach Target</span>
              </div>

              {timeResult.isAlreadyAchieved ? (
                <div className="status-banner success">
                  <CheckCircle2 size={24} />
                  <div>
                    <h4>Target Already Reached!</h4>
                    <p>Your current amount of {formatCurrency(currentAmount, currency, formatType)} already meets or exceeds your goal.</p>
                  </div>
                </div>
              ) : !timeResult.isPossible ? (
                <div className="status-banner error">
                  <AlertCircle size={24} />
                  <div>
                    <h4>Target Unreachable Under Current Assumptions</h4>
                    <p>{timeResult.message}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hero-headline-stat">
                    <span className="stat-number">{timeResult.years}</span>
                    <span className="stat-unit">Years</span>
                    <span className="stat-number">{timeResult.months}</span>
                    <span className="stat-unit">Months</span>
                  </div>

                  <p className="hero-date-subtext">
                    You may reach <strong>{formatCurrency(targetAmount, currency, formatType)}</strong> by approximately{' '}
                    <span className="highlight-date">
                      {timeResult.targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>.
                  </p>

                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, (currentAmount / targetAmount) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-bar-labels">
                    <span>Current: {formatCurrency(currentAmount, currency, formatType)}</span>
                    <span>Target: {formatCurrency(targetAmount, currency, formatType)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* FUTURE VALUE RESULT */}
          {mode === 'future' && (
            <div className="hero-result-card">
              <div className="hero-top-badge">
                <TrendingUp size={16} />
                <span>Projected Corpus in {timeYears} Years</span>
              </div>
              <div className="hero-headline-stat single">
                <span className="stat-number-lg">{formatCurrency(fvResult.futureValue, currency, formatType)}</span>
              </div>
              <p className="hero-date-subtext">
                With a {expectedReturn}% annual return, your investment will grow to {formatCompactCurrency(fvResult.futureValue, currency, formatType)}.
              </p>
            </div>
          )}

          {/* REQUIRED RETURN RESULT */}
          {mode === 'return' && (
            <div className="hero-result-card">
              <div className="hero-top-badge">
                <Target size={16} />
                <span>Required Annual Return Rate</span>
              </div>
              <div className="hero-headline-stat single">
                <span className="stat-number-lg">{reqReturnResult.requiredAnnualReturn}%</span>
                <span className="stat-unit">p.a.</span>
              </div>
              {reqReturnResult.warning && (
                <div className="alert-warning-box">
                  <AlertCircle size={18} />
                  <span>{reqReturnResult.warning}</span>
                </div>
              )}
              <p className="hero-date-subtext">
                Monthly equivalent compounding return needed: <strong>{reqReturnResult.monthlyEquivalentReturn}% per month</strong>.
              </p>
            </div>
          )}

          {/* REQUIRED SIP RESULT */}
          {mode === 'sip' && (
            <div className="hero-result-card">
              <div className="hero-top-badge">
                <DollarSign size={16} />
                <span>Required Monthly Investment (SIP)</span>
              </div>
              <div className="hero-headline-stat single">
                <span className="stat-number-lg">{formatCurrency(reqContribution.monthlyEquivalent, currency, formatType)}</span>
                <span className="stat-unit">/ month</span>
              </div>
              <p className="hero-date-subtext">
                Invest {formatCurrency(reqContribution.monthlyEquivalent, currency, formatType)} every month for {timeYears} years at {expectedReturn}% p.a. to reach {formatCurrency(targetAmount, currency, formatType)}.
              </p>
            </div>
          )}

          {/* REQUIRED LUMP SUM RESULT */}
          {mode === 'lump' && (
            <div className="hero-result-card">
              <div className="hero-top-badge">
                <Layers size={16} />
                <span>Required One-Time Lump Sum Today</span>
              </div>
              <div className="hero-headline-stat single">
                <span className="stat-number-lg">{formatCurrency(reqLumpSum, currency, formatType)}</span>
              </div>
              <p className="hero-date-subtext">
                An initial lump sum investment of {formatCurrency(reqLumpSum, currency, formatType)} compounded at {expectedReturn}% for {timeYears} years reaches {formatCurrency(targetAmount, currency, formatType)}.
              </p>
            </div>
          )}

          {/* SWP RESULT */}
          {mode === 'swp' && (
            <div className="hero-result-card">
              <div className="hero-top-badge">
                <Calendar size={16} />
                <span>Systematic Withdrawal Longevity</span>
              </div>
              {swpResult.isSustainable ? (
                <>
                  <div className="hero-headline-stat single success">
                    <span className="stat-number-lg">Corpus Sustainable!</span>
                  </div>
                  <p className="hero-date-subtext">
                    Your portfolio lasts beyond {timeYears} years, leaving an estimated ending corpus of <strong>{formatCurrency(swpResult.remainingCorpus, currency, formatType)}</strong>.
                  </p>
                </>
              ) : (
                <>
                  <div className="hero-headline-stat single warning">
                    <span className="stat-number-lg">{swpResult.depletionYears} Years</span>
                  </div>
                  <p className="hero-date-subtext">
                    Corpus will be depleted by approximately <strong>{swpResult.depletionDateStr}</strong>. Total withdrawals delivered: {formatCurrency(swpResult.totalWithdrawn, currency, formatType)}.
                  </p>
                </>
              )}
            </div>
          )}

          {/* METRIC CARDS ROW */}
          <div className="metric-cards-grid">
            <div className="metric-box">
              <span className="metric-label">Total Principal / Invested</span>
              <span className="metric-val">
                {mode === 'future'
                  ? formatCurrency(fvResult.totalContributions + currentAmount, currency, formatType)
                  : formatCurrency(timeResult.totalContributions + currentAmount, currency, formatType)}
              </span>
              <span className="metric-sub">
                Initial: {formatCompactCurrency(currentAmount, currency, formatType)} + SIP
              </span>
            </div>

            <div className="metric-box accent-growth">
              <span className="metric-label">Estimated Wealth Growth</span>
              <span className="metric-val text-emerald">
                {mode === 'future'
                  ? formatCurrency(fvResult.totalGrowth, currency, formatType)
                  : formatCurrency(timeResult.totalGrowth, currency, formatType)}
              </span>
              <span className="metric-sub">Pure Compound Returns</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Inflation-Adjusted Target</span>
              <span className="metric-val">
                {mode === 'future'
                  ? formatCurrency(fvResult.inflationAdjustedValue, currency, formatType)
                  : formatCurrency(timeResult.inflationAdjustedTarget, currency, formatType)}
              </span>
              <span className="metric-sub">At {inflationRate}% annual inflation</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Net Effective Return</span>
              <span className="metric-val text-indigo">
                {timeResult.netEffectiveAnnualReturn}% p.a.
              </span>
              <span className="metric-sub">After taxes & fees</span>
            </div>
          </div>

          {/* INTERACTIVE SVG GROWTH TIMELINE CHART */}
          {activeSchedule.length > 0 && (
            <div className="chart-container-box">
              <div className="chart-header">
                <div className="chart-title-wrap">
                  <PieChart size={16} />
                  <h4>Portfolio Growth Trajectory</h4>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot balance"></span>Total Value</span>
                  <span className="legend-item"><span className="legend-dot contrib"></span>Invested</span>
                  <span className="legend-item"><span className="legend-dot real"></span>Real (Post-Inflation)</span>
                </div>
              </div>

              <div className="chart-svg-wrap">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="timeline-svg"
                  aria-label="Investment growth timeline chart"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const yPos = getY(maxVal * pct);
                    return (
                      <g key={i}>
                        <line
                          x1={padding.left}
                          y1={yPos}
                          x2={chartWidth - padding.right}
                          y2={yPos}
                          stroke="var(--border-subtle)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padding.left - 8}
                          y={yPos + 4}
                          fill="var(--text-muted)"
                          fontSize="10"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {formatCompactCurrency(maxVal * pct, currency, formatType)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Target Goal Threshold Line */}
                  {targetAmount <= maxVal && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={getY(targetAmount)}
                        x2={chartWidth - padding.right}
                        y2={getY(targetAmount)}
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="6 3"
                      />
                      <text
                        x={chartWidth - padding.right}
                        y={getY(targetAmount) - 5}
                        fill="#f59e0b"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="end"
                      >
                        Goal: {formatCompactCurrency(targetAmount, currency, formatType)}
                      </text>
                    </g>
                  )}

                  {/* Polyline 1: Total Balance */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={balancePoints}
                  />

                  {/* Polyline 2: Contributions */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    points={contribPoints}
                  />

                  {/* Polyline 3: Real Balance (Inflation Adjusted) */}
                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.8"
                    points={realPoints}
                  />

                  {/* Milestone Interactive Points */}
                  {activeSchedule.map((s, idx) => (
                    <circle
                      key={idx}
                      cx={getX(idx)}
                      cy={getY(s.endingBalance)}
                      r={hoveredMilestoneIndex === idx ? 6 : 3.5}
                      fill={hoveredMilestoneIndex === idx ? "#34d399" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                      onMouseEnter={() => setHoveredMilestoneIndex(idx)}
                      onMouseLeave={() => setHoveredMilestoneIndex(null)}
                    />
                  ))}
                </svg>

                {/* Hover Milestone Card */}
                {hoveredMilestoneIndex !== null && activeSchedule[hoveredMilestoneIndex] && (
                  <div className="chart-tooltip">
                    <strong>{activeSchedule[hoveredMilestoneIndex].dateStr}</strong>
                    <div>Total Value: {formatCurrency(activeSchedule[hoveredMilestoneIndex].endingBalance, currency, formatType)}</div>
                    <div>Invested: {formatCurrency(activeSchedule[hoveredMilestoneIndex].totalContributionsSoFar + currentAmount, currency, formatType)}</div>
                    <div>Growth: {formatCurrency(activeSchedule[hoveredMilestoneIndex].totalGrowthSoFar, currency, formatType)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SENSITIVITY ANALYSIS TOGGLE */}
          <div className="section-accordion">
            <button
              className="accordion-header-btn"
              onClick={() => setShowSensitivity(!showSensitivity)}
            >
              <div className="accordion-title">
                <Sliders size={16} />
                <span>Sensitivity Analysis ("What-If Matrix")</span>
              </div>
              {showSensitivity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSensitivity && (
              <div className="accordion-content">
                <p className="section-note">
                  See how varying investment return rates and monthly contributions accelerate or delay reaching your target.
                </p>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Expected Return</th>
                        <th>50% SIP</th>
                        <th>75% SIP</th>
                        <th>Baseline SIP</th>
                        <th>125% SIP</th>
                        <th>150% SIP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityData.map((row, i) => (
                        <tr key={i} className={row.returnRate === expectedReturn ? 'highlight-row' : ''}>
                          <td><strong>{row.returnRate}% p.a.</strong></td>
                          {row.rows.slice(0, 5).map((col, j) => (
                            <td key={j}>
                              {col.isPossible ? `${col.years}y ${col.months}m` : '100y+'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* YEARLY MILESTONE TABLE ACCORDION */}
          {activeSchedule.length > 0 && (
            <div className="section-accordion">
              <button
                className="accordion-header-btn"
                onClick={() => setShowMilestones(!showMilestones)}
              >
                <div className="accordion-title">
                  <Layers size={16} />
                  <span>Year-by-Year Growth Schedule ({activeSchedule.length} Milestones)</span>
                </div>
                {showMilestones ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showMilestones && (
                <div className="accordion-content">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Year</th>
                          <th>Starting</th>
                          <th>Annual Added</th>
                          <th>Annual Growth</th>
                          <th>Ending Balance</th>
                          <th>Inflation-Adjusted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSchedule.map((m, i) => (
                          <tr key={i}>
                            <td><strong>Year {m.year}</strong></td>
                            <td>{formatCurrency(m.startingBalance, currency, formatType)}</td>
                            <td>{formatCurrency(m.contributions, currency, formatType)}</td>
                            <td className="text-emerald">+{formatCurrency(m.growth, currency, formatType)}</td>
                            <td><strong>{formatCurrency(m.endingBalance, currency, formatType)}</strong></td>
                            <td className="text-muted">{formatCurrency(m.realEndingBalance, currency, formatType)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FORMULA TRANSPARENCY ACCORDION */}
          <div className="section-accordion">
            <button
              className="accordion-header-btn"
              onClick={() => setShowFormulas(!showFormulas)}
            >
              <div className="accordion-title">
                <HelpCircle size={16} />
                <span>How This Is Calculated (Mathematical Formulas)</span>
              </div>
              {showFormulas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showFormulas && (
              <div className="accordion-content math-box">
                <h4>1. Future Value of Lump Sum & Recurring Stream</h4>
                <code>FV = P × (1 + r/n)^(n×t) + PMT × [ ((1 + r/n)^(n×t) - 1) / (r/n) ]</code>
                <p>
                  Where <em>P</em> = Initial investment, <em>r</em> = Annual return rate, <em>n</em> = Compounding periods per year, <em>t</em> = Time in years, and <em>PMT</em> = Periodic contribution.
                </p>

                <h4>2. Inflation Adjustment (Real Purchasing Power)</h4>
                <code>Real Value = Nominal FV / (1 + i)^t</code>
                <p>
                  Where <em>i</em> = Annual inflation rate. Using the Fisher Equation, real rate of return is <code>r_real = ((1 + r) / (1 + i)) - 1</code>.
                </p>

                <h4>3. Time to Target Solver</h4>
                <p>
                  Calculated using iterative simulation step-by-step applying periodic interest and annual step-up SIP increases, guaranteeing high numerical precision without floating-point drift.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCENARIO COMPARISON SUB-SECTION (WHEN SCENARIO MODE IS ACTIVE) */}
      {mode === 'scenarios' && (
        <div className="scenarios-comparison-container">
          <div className="scenarios-header">
            <div>
              <h3>Scenario Comparison (Up to 4 Scenarios)</h3>
              <p>Compare different savings rates, return expectations, and target paths side by side.</p>
            </div>
            {scenarios.length < 4 && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const newId = (scenarios.length + 1).toString();
                  setScenarios([
                    ...scenarios,
                    {
                      id: newId,
                      name: `Scenario ${String.fromCharCode(64 + scenarios.length + 1)}`,
                      currentAmount: currentAmount,
                      targetAmount: targetAmount,
                      expectedReturn: 10,
                      monthlyContribution: 15000
                    }
                  ]);
                }}
              >
                <Plus size={16} />
                <span>Add Scenario</span>
              </button>
            )}
          </div>

          <div className="scenarios-cards-grid">
            {scenarios.map((sc, idx) => {
              const res = calculateTimeToTarget({
                currentAmount: sc.currentAmount,
                targetAmount: sc.targetAmount,
                expectedAnnualReturn: sc.expectedReturn,
                contribution: sc.monthlyContribution,
                contributionFrequency: 'monthly'
              });

              return (
                <div key={sc.id} className="scenario-card">
                  <div className="scenario-card-header">
                    <h4>{sc.name}</h4>
                    {scenarios.length > 2 && (
                      <button
                        className="delete-scenario-btn"
                        onClick={() => setScenarios(scenarios.filter(s => s.id !== sc.id))}
                        title="Remove scenario"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="scenario-inputs">
                    <div className="sc-field">
                      <span>Monthly SIP:</span>
                      <input
                        type="number"
                        className="sc-input"
                        value={sc.monthlyContribution}
                        onChange={(e) => {
                          const val = parseHumanNumber(e.target.value);
                          setScenarios(scenarios.map(s => s.id === sc.id ? { ...s, monthlyContribution: val } : s));
                        }}
                      />
                    </div>
                    <div className="sc-field">
                      <span>Return Rate (%):</span>
                      <input
                        type="number"
                        className="sc-input"
                        value={sc.expectedReturn}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setScenarios(scenarios.map(s => s.id === sc.id ? { ...s, expectedReturn: val } : s));
                        }}
                      />
                    </div>
                  </div>

                  <div className="scenario-result-badge">
                    <Clock size={16} />
                    <span>
                      {res.isPossible ? `${res.years} Years ${res.months} Mos` : 'Unreachable'}
                    </span>
                  </div>

                  <div className="scenario-meta">
                    <div>Invested: {formatCompactCurrency(res.totalContributions + sc.currentAmount, currency, formatType)}</div>
                    <div>Growth: {formatCompactCurrency(res.totalGrowth, currency, formatType)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
