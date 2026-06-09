/* ==========================================================================
   USFinCalc — State income tax data (simplified, 2025/2026 estimates)
   ALL 50 STATES + DC.

   IMPORTANT — these are SIMPLIFIED ESTIMATES for a single filer using each
   state's broad rate structure. They ignore state-specific deductions,
   exemptions, credits, local/city taxes, and filing-status differences.
   They are meant for ballpark take-home estimates only. Users must verify
   with their state revenue authority. State rates change frequently; review
   each January.

   Shape per state:
     { name, type: 'none' | 'flat' | 'progressive', rate?, brackets? }
   brackets are marginal on state taxable income (we approximate state
   taxable income as federal gross minus pre-tax deferrals; no state std
   deduction modeled — hence "estimate").
   ========================================================================== */
window.USFC_STATE = {
  vintage: '2025-2026 simplified estimate',

  AL: { name: 'Alabama', type: 'progressive', brackets: [ { upTo: 500, rate: 0.02 }, { upTo: 3000, rate: 0.04 }, { upTo: Infinity, rate: 0.05 } ] },
  AK: { name: 'Alaska', type: 'none' },
  AZ: { name: 'Arizona', type: 'flat', rate: 0.025 },
  AR: { name: 'Arkansas', type: 'progressive', brackets: [ { upTo: 4400, rate: 0.02 }, { upTo: 8800, rate: 0.03 }, { upTo: Infinity, rate: 0.039 } ] },
  CA: { name: 'California', type: 'progressive', brackets: [ { upTo: 10412, rate: 0.01 }, { upTo: 24684, rate: 0.02 }, { upTo: 38959, rate: 0.04 }, { upTo: 54081, rate: 0.06 }, { upTo: 68350, rate: 0.08 }, { upTo: 349137, rate: 0.093 }, { upTo: 418961, rate: 0.103 }, { upTo: 698271, rate: 0.113 }, { upTo: Infinity, rate: 0.123 } ] },
  CO: { name: 'Colorado', type: 'flat', rate: 0.044 },
  CT: { name: 'Connecticut', type: 'progressive', brackets: [ { upTo: 10000, rate: 0.02 }, { upTo: 50000, rate: 0.045 }, { upTo: 100000, rate: 0.055 }, { upTo: 200000, rate: 0.06 }, { upTo: 250000, rate: 0.065 }, { upTo: 500000, rate: 0.069 }, { upTo: Infinity, rate: 0.0699 } ] },
  DE: { name: 'Delaware', type: 'progressive', brackets: [ { upTo: 2000, rate: 0 }, { upTo: 5000, rate: 0.022 }, { upTo: 10000, rate: 0.039 }, { upTo: 20000, rate: 0.048 }, { upTo: 25000, rate: 0.052 }, { upTo: 60000, rate: 0.0555 }, { upTo: Infinity, rate: 0.066 } ] },
  DC: { name: 'District of Columbia', type: 'progressive', brackets: [ { upTo: 10000, rate: 0.04 }, { upTo: 40000, rate: 0.06 }, { upTo: 60000, rate: 0.065 }, { upTo: 250000, rate: 0.085 }, { upTo: 500000, rate: 0.0925 }, { upTo: 1000000, rate: 0.0975 }, { upTo: Infinity, rate: 0.1075 } ] },
  FL: { name: 'Florida', type: 'none' },
  GA: { name: 'Georgia', type: 'flat', rate: 0.0539 },
  HI: { name: 'Hawaii', type: 'progressive', brackets: [ { upTo: 2400, rate: 0.014 }, { upTo: 4800, rate: 0.032 }, { upTo: 9600, rate: 0.055 }, { upTo: 14400, rate: 0.064 }, { upTo: 19200, rate: 0.068 }, { upTo: 24000, rate: 0.072 }, { upTo: 36000, rate: 0.076 }, { upTo: 48000, rate: 0.079 }, { upTo: 150000, rate: 0.0825 }, { upTo: 175000, rate: 0.09 }, { upTo: 200000, rate: 0.10 }, { upTo: Infinity, rate: 0.11 } ] },
  ID: { name: 'Idaho', type: 'flat', rate: 0.05695 },
  IL: { name: 'Illinois', type: 'flat', rate: 0.0495 },
  IN: { name: 'Indiana', type: 'flat', rate: 0.03 },
  IA: { name: 'Iowa', type: 'flat', rate: 0.038 },
  KS: { name: 'Kansas', type: 'progressive', brackets: [ { upTo: 23000, rate: 0.052 }, { upTo: Infinity, rate: 0.0558 } ] },
  KY: { name: 'Kentucky', type: 'flat', rate: 0.04 },
  LA: { name: 'Louisiana', type: 'flat', rate: 0.03 },
  ME: { name: 'Maine', type: 'progressive', brackets: [ { upTo: 26050, rate: 0.058 }, { upTo: 61600, rate: 0.0675 }, { upTo: Infinity, rate: 0.0715 } ] },
  MD: { name: 'Maryland', type: 'progressive', brackets: [ { upTo: 1000, rate: 0.02 }, { upTo: 2000, rate: 0.03 }, { upTo: 3000, rate: 0.04 }, { upTo: 100000, rate: 0.0475 }, { upTo: 125000, rate: 0.05 }, { upTo: 150000, rate: 0.0525 }, { upTo: 250000, rate: 0.055 }, { upTo: Infinity, rate: 0.0575 } ] },
  MA: { name: 'Massachusetts', type: 'flat', rate: 0.05 },
  MI: { name: 'Michigan', type: 'flat', rate: 0.0425 },
  MN: { name: 'Minnesota', type: 'progressive', brackets: [ { upTo: 31690, rate: 0.0535 }, { upTo: 104090, rate: 0.068 }, { upTo: 193240, rate: 0.0785 }, { upTo: Infinity, rate: 0.0985 } ] },
  MS: { name: 'Mississippi', type: 'flat', rate: 0.044 },
  MO: { name: 'Missouri', type: 'progressive', brackets: [ { upTo: 1273, rate: 0 }, { upTo: 2546, rate: 0.02 }, { upTo: 3819, rate: 0.025 }, { upTo: 5092, rate: 0.03 }, { upTo: 6365, rate: 0.035 }, { upTo: 7638, rate: 0.04 }, { upTo: 8911, rate: 0.045 }, { upTo: Infinity, rate: 0.047 } ] }
};

Object.assign(window.USFC_STATE, {
  MT: { name: 'Montana', type: 'progressive', brackets: [ { upTo: 20500, rate: 0.047 }, { upTo: Infinity, rate: 0.059 } ] },
  NE: { name: 'Nebraska', type: 'progressive', brackets: [ { upTo: 3700, rate: 0.0246 }, { upTo: 22170, rate: 0.0351 }, { upTo: 35730, rate: 0.0501 }, { upTo: Infinity, rate: 0.052 } ] },
  NV: { name: 'Nevada', type: 'none' },
  NH: { name: 'New Hampshire', type: 'none' },
  NJ: { name: 'New Jersey', type: 'progressive', brackets: [ { upTo: 20000, rate: 0.014 }, { upTo: 35000, rate: 0.0175 }, { upTo: 40000, rate: 0.035 }, { upTo: 75000, rate: 0.05525 }, { upTo: 500000, rate: 0.0637 }, { upTo: 1000000, rate: 0.0897 }, { upTo: Infinity, rate: 0.1075 } ] },
  NM: { name: 'New Mexico', type: 'progressive', brackets: [ { upTo: 5500, rate: 0.015 }, { upTo: 16500, rate: 0.032 }, { upTo: 33500, rate: 0.043 }, { upTo: 66500, rate: 0.047 }, { upTo: 210000, rate: 0.049 }, { upTo: Infinity, rate: 0.059 } ] },
  NY: { name: 'New York', type: 'progressive', brackets: [ { upTo: 8500, rate: 0.04 }, { upTo: 11700, rate: 0.045 }, { upTo: 13900, rate: 0.0525 }, { upTo: 80650, rate: 0.055 }, { upTo: 215400, rate: 0.06 }, { upTo: 1077550, rate: 0.0685 }, { upTo: 5000000, rate: 0.0965 }, { upTo: 25000000, rate: 0.103 }, { upTo: Infinity, rate: 0.109 } ] },
  NC: { name: 'North Carolina', type: 'flat', rate: 0.0425 },
  ND: { name: 'North Dakota', type: 'progressive', brackets: [ { upTo: 47150, rate: 0 }, { upTo: 238200, rate: 0.0195 }, { upTo: Infinity, rate: 0.025 } ] },
  OH: { name: 'Ohio', type: 'progressive', brackets: [ { upTo: 26050, rate: 0 }, { upTo: 100000, rate: 0.0275 }, { upTo: Infinity, rate: 0.035 } ] },
  OK: { name: 'Oklahoma', type: 'progressive', brackets: [ { upTo: 1000, rate: 0.0025 }, { upTo: 2500, rate: 0.0075 }, { upTo: 3750, rate: 0.0175 }, { upTo: 4900, rate: 0.0275 }, { upTo: 7200, rate: 0.0375 }, { upTo: Infinity, rate: 0.0475 } ] },
  OR: { name: 'Oregon', type: 'progressive', brackets: [ { upTo: 4300, rate: 0.0475 }, { upTo: 10750, rate: 0.0675 }, { upTo: 125000, rate: 0.0875 }, { upTo: Infinity, rate: 0.099 } ] },
  PA: { name: 'Pennsylvania', type: 'flat', rate: 0.0307 },
  RI: { name: 'Rhode Island', type: 'progressive', brackets: [ { upTo: 77450, rate: 0.0375 }, { upTo: 176050, rate: 0.0475 }, { upTo: Infinity, rate: 0.0599 } ] },
  SC: { name: 'South Carolina', type: 'progressive', brackets: [ { upTo: 3460, rate: 0 }, { upTo: 17330, rate: 0.03 }, { upTo: Infinity, rate: 0.062 } ] },
  SD: { name: 'South Dakota', type: 'none' },
  TN: { name: 'Tennessee', type: 'none' },
  TX: { name: 'Texas', type: 'none' },
  UT: { name: 'Utah', type: 'flat', rate: 0.0455 },
  VT: { name: 'Vermont', type: 'progressive', brackets: [ { upTo: 45400, rate: 0.0335 }, { upTo: 110050, rate: 0.066 }, { upTo: 229550, rate: 0.076 }, { upTo: Infinity, rate: 0.0875 } ] },
  VA: { name: 'Virginia', type: 'progressive', brackets: [ { upTo: 3000, rate: 0.02 }, { upTo: 5000, rate: 0.03 }, { upTo: 17000, rate: 0.05 }, { upTo: Infinity, rate: 0.0575 } ] },
  WA: { name: 'Washington', type: 'none' },
  WV: { name: 'West Virginia', type: 'progressive', brackets: [ { upTo: 10000, rate: 0.0222 }, { upTo: 25000, rate: 0.0296 }, { upTo: 40000, rate: 0.0333 }, { upTo: 60000, rate: 0.0444 }, { upTo: Infinity, rate: 0.0482 } ] },
  WI: { name: 'Wisconsin', type: 'progressive', brackets: [ { upTo: 14680, rate: 0.035 }, { upTo: 29370, rate: 0.044 }, { upTo: 323290, rate: 0.053 }, { upTo: Infinity, rate: 0.0765 } ] },
  WY: { name: 'Wyoming', type: 'none' }
});
