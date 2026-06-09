/* ==========================================================================
   USFinCalc — Federal tax data (2026 tax year)
   Sources:
     IRS inflation adjustments for tax year 2026 (released 2025-10-09,
       includes One Big Beautiful Bill amendments).
     SSA Contribution & Benefit Base; IRS Topic No. 751.
   Brackets are marginal: { upTo, rate }. upTo=Infinity for the top band.
   Update every January when IRS/SSA publish new figures.
   ========================================================================== */
window.USFC_FEDERAL_2026 = {
  year: 2026,

  standardDeduction: {
    single: 16100,
    married: 32200,
    head: 24150
  },

  brackets: {
    single: [
      { upTo: 12400,  rate: 0.10 },
      { upTo: 50400,  rate: 0.12 },
      { upTo: 105700, rate: 0.22 },
      { upTo: 201775, rate: 0.24 },
      { upTo: 256225, rate: 0.32 },
      { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 }
    ],
    married: [
      { upTo: 24800,  rate: 0.10 },
      { upTo: 100800, rate: 0.12 },
      { upTo: 211400, rate: 0.22 },
      { upTo: 403550, rate: 0.24 },
      { upTo: 512450, rate: 0.32 },
      { upTo: 768700, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 }
    ],
    head: [
      { upTo: 17700,  rate: 0.10 },
      { upTo: 67450,  rate: 0.12 },
      { upTo: 105700, rate: 0.22 },
      { upTo: 201775, rate: 0.24 },
      { upTo: 256200, rate: 0.32 },
      { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 }
    ]
  },

  fica: {
    socialSecurityRate: 0.062,
    socialSecurityWageBase: 184500,   // 2026 OASDI max taxable earnings
    medicareRate: 0.0145,
    additionalMedicareRate: 0.009,
    additionalMedicareThreshold: {     // not indexed; unchanged
      single: 200000,
      married: 250000,
      head: 200000
    }
  }
};
