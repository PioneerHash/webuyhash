// Mining math calculations

const SECONDS_PER_DAY = 86400;
const BLOCKS_PER_DAY = 144; // Average blocks per day (one every ~10 minutes)
const SATS_PER_BTC = 100000000;

/**
 * Convert hashrate to H/s based on unit
 */
export function convertToHashPerSecond(hashrate, unit) {
    const multipliers = {
        'H': 1,
        'KH': 1e3,
        'MH': 1e6,
        'GH': 1e9,
        'TH': 1e12,
        'PH': 1e15,
        'EH': 1e18
    };
    return hashrate * (multipliers[unit] || 1);
}

/**
 * Formula A: Difficulty-based calculation
 * Daily BTC = (Hashrate × Block Reward × 86400) ÷ (Difficulty × 2^32)
 */
export function calculateDailyBTC_Difficulty(hashrate, difficulty, blockReward) {
    if (!difficulty || difficulty === 0) return 0;

    const twoTo32 = Math.pow(2, 32);
    const dailyBTC = (hashrate * blockReward * SECONDS_PER_DAY) / (difficulty * twoTo32);
    return dailyBTC;
}

/**
 * Formula B: Hashrate ratio calculation
 * Daily BTC = (Your Hashrate ÷ Network Hashrate) × 144 blocks × Block Reward
 */
export function calculateDailyBTC_HashrateRatio(hashrate, networkHashrate, blockReward) {
    if (!networkHashrate || networkHashrate === 0) return 0;

    const shareOfNetwork = hashrate / networkHashrate;
    const dailyBTC = shareOfNetwork * BLOCKS_PER_DAY * blockReward;
    return dailyBTC;
}

/**
 * Dispatcher function - calculates daily BTC based on selected formula
 */
export function calculateDailyBTC(params, formulaType) {
    const { hashrate, difficulty, networkHashrate, blockReward } = params;

    if (formulaType === 'difficulty') {
        return calculateDailyBTC_Difficulty(hashrate, difficulty, blockReward);
    } else {
        return calculateDailyBTC_HashrateRatio(hashrate, networkHashrate, blockReward);
    }
}

/**
 * Calculate pool's share of the network
 */
export function calculateNetworkShare(hashrate, networkHashrate) {
    if (!networkHashrate || networkHashrate === 0) return 0;
    return (hashrate / networkHashrate) * 100;
}

/**
 * Calculate expected blocks per day
 */
export function calculateExpectedBlocksPerDay(hashrate, networkHashrate) {
    if (!networkHashrate || networkHashrate === 0) return 0;
    const shareOfNetwork = hashrate / networkHashrate;
    return shareOfNetwork * BLOCKS_PER_DAY;
}

// ===========================================
// Payout Model Revenue Calculations
// These calculate the POOL OPERATOR's revenue (fee income)
// ===========================================

/**
 * PPS+ (Pay Per Share Plus)
 * Pool pays miners fixed rate per share + transaction fees
 * Pool keeps percentage of block SUBSIDY only (not tx fees)
 *
 * @param {number} dailyBTC - Total daily BTC mined by pool
 * @param {number} feePercent - Pool fee percentage (e.g., 2 for 2%)
 * @param {number} txFeeRatio - Ratio of tx fees to total reward (typically 0.02-0.05)
 */
export function calculatePPSRevenue(dailyBTC, feePercent, txFeeRatio = 0.03) {
    // In PPS+, pool keeps fee% of subsidy, tx fees go to miners
    const subsidyPortion = dailyBTC * (1 - txFeeRatio);
    const poolRevenue = subsidyPortion * (feePercent / 100);
    return poolRevenue;
}

/**
 * FPPS (Full Pay Per Share)
 * Pool pays miners fixed rate for subsidy AND transaction fees
 * Pool keeps percentage of ALL rewards (subsidy + tx fees)
 *
 * @param {number} dailyBTC - Total daily BTC mined by pool
 * @param {number} feePercent - Pool fee percentage (e.g., 2 for 2%)
 */
export function calculateFPPSRevenue(dailyBTC, feePercent) {
    // In FPPS, pool keeps fee% of everything
    const poolRevenue = dailyBTC * (feePercent / 100);
    return poolRevenue;
}

/**
 * PPLNS (Pay Per Last N Shares)
 * Pool pays miners based on last N shares when block is found
 * Variance risk is shared with miners (pool luck affects payouts)
 * Pool keeps percentage but actual revenue varies with luck
 *
 * @param {number} dailyBTC - Total daily BTC mined by pool
 * @param {number} feePercent - Pool fee percentage
 * @param {number} luckFactor - Pool luck (1.0 = average, >1 = lucky, <1 = unlucky)
 */
export function calculatePPLNSRevenue(dailyBTC, feePercent, luckFactor = 1.0) {
    // PPLNS revenue varies with luck
    const actualBTC = dailyBTC * luckFactor;
    const poolRevenue = actualBTC * (feePercent / 100);
    return poolRevenue;
}

/**
 * Proportional
 * Simple share ratio - miners get paid proportional to their share contribution
 * Pool keeps flat percentage of all rewards
 *
 * @param {number} dailyBTC - Total daily BTC mined by pool
 * @param {number} feePercent - Pool fee percentage
 */
export function calculateProportionalRevenue(dailyBTC, feePercent) {
    // Simple: pool keeps fee% of everything
    const poolRevenue = dailyBTC * (feePercent / 100);
    return poolRevenue;
}

/**
 * Calculate all payout model revenues at once
 */
export function calculateAllPayoutModels(dailyBTC, feePercent, txFeeRatio = 0.03) {
    return {
        pps: calculatePPSRevenue(dailyBTC, feePercent, txFeeRatio),
        fpps: calculateFPPSRevenue(dailyBTC, feePercent),
        pplns: calculatePPLNSRevenue(dailyBTC, feePercent, 1.0),
        proportional: calculateProportionalRevenue(dailyBTC, feePercent)
    };
}

// ===========================================
// Projections and Utilities
// ===========================================

/**
 * Project earnings over different time periods
 */
export function projectEarnings(dailyBTC) {
    return {
        daily: dailyBTC,
        weekly: dailyBTC * 7,
        monthly: dailyBTC * 30,
        yearly: dailyBTC * 365
    };
}

/**
 * Convert BTC to sats
 */
export function btcToSats(btc) {
    return Math.round(btc * SATS_PER_BTC);
}

/**
 * Convert BTC to USD
 */
export function btcToUSD(btc, btcPrice) {
    return btc * btcPrice;
}

/**
 * Format BTC value for display
 */
export function formatBTC(btc) {
    if (btc === null || btc === undefined || isNaN(btc)) return '--';

    if (btc < 0.00001) {
        return btc.toExponential(2);
    } else if (btc < 0.001) {
        return btc.toFixed(8);
    } else if (btc < 1) {
        return btc.toFixed(6);
    } else {
        return btc.toFixed(4);
    }
}

/**
 * Format sats value for display
 */
export function formatSats(sats) {
    if (sats === null || sats === undefined || isNaN(sats)) return '--';
    return sats.toLocaleString('en-US');
}

/**
 * Format USD value for display
 */
export function formatUSD(usd) {
    if (usd === null || usd === undefined || isNaN(usd)) return '--';

    if (usd >= 1000000) {
        return `$${(usd / 1000000).toFixed(2)}M`;
    } else if (usd >= 1000) {
        return `$${(usd / 1000).toFixed(2)}K`;
    } else if (usd >= 1) {
        return `$${usd.toFixed(2)}`;
    } else {
        return `$${usd.toFixed(4)}`;
    }
}

/**
 * Format percentage for display
 */
export function formatPercent(percent) {
    if (percent === null || percent === undefined || isNaN(percent)) return '--';

    if (percent < 0.0001) {
        return `${percent.toExponential(2)}%`;
    } else if (percent < 0.01) {
        return `${percent.toFixed(6)}%`;
    } else if (percent < 1) {
        return `${percent.toFixed(4)}%`;
    } else {
        return `${percent.toFixed(2)}%`;
    }
}

// ===========================================
// Forward Projections
// ===========================================

/**
 * Calculate forward projections with growth assumptions
 *
 * @param {Object} params - Current parameters
 * @param {number} params.poolHashrate - Current pool hashrate in H/s
 * @param {number} params.networkHashrate - Current network hashrate in H/s
 * @param {number} params.blockReward - Current block reward in BTC
 * @param {number} params.poolFee - Pool fee percentage
 * @param {number} params.poolGrowthRate - Monthly pool hashrate growth (e.g., 5 for 5%)
 * @param {number} params.networkGrowthRate - Monthly network hashrate growth (e.g., 3 for 3%)
 * @param {Date} params.startDate - Start date for projections
 * @param {Date} params.endDate - End date for projections
 * @param {string} params.granularity - 'daily', 'weekly', or 'monthly'
 * @returns {Array} Array of projection objects
 */
export function calculateForwardProjections(params) {
    const {
        poolHashrate,
        networkHashrate,
        blockReward,
        poolFee,
        poolGrowthRate,
        networkGrowthRate,
        startDate,
        endDate,
        granularity = 'monthly'
    } = params;

    const projections = [];
    let cumulativeRevenue = 0;

    // Calculate period parameters based on granularity
    const periodConfig = {
        daily: { days: 1, monthFraction: 1/30, label: 'Day' },
        weekly: { days: 7, monthFraction: 7/30, label: 'Week' },
        monthly: { days: 30, monthFraction: 1, label: 'Month' }
    };

    const config = periodConfig[granularity];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate total periods
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPeriods = Math.ceil(totalDays / config.days);

    // Cap at reasonable number of periods for performance
    const maxPeriods = granularity === 'daily' ? 365 : (granularity === 'weekly' ? 104 : 36);
    const periods = Math.min(totalPeriods, maxPeriods);

    for (let period = 1; period <= periods; period++) {
        // Calculate the date for this period
        const periodDate = new Date(start);
        periodDate.setDate(periodDate.getDate() + (period - 1) * config.days);

        // Stop if we've passed the end date
        if (periodDate > end) break;

        // Calculate months elapsed for growth calculation
        const monthsElapsed = period * config.monthFraction;

        // Apply compound growth (based on monthly rate)
        const poolGrowthMultiplier = Math.pow(1 + poolGrowthRate / 100, monthsElapsed);
        const networkGrowthMultiplier = Math.pow(1 + networkGrowthRate / 100, monthsElapsed);

        const projectedPoolHashrate = poolHashrate * poolGrowthMultiplier;
        const projectedNetworkHashrate = networkHashrate * networkGrowthMultiplier;

        // Calculate share and revenue
        const sharePercent = (projectedPoolHashrate / projectedNetworkHashrate) * 100;
        const dailyBTC = (projectedPoolHashrate / projectedNetworkHashrate) * BLOCKS_PER_DAY * blockReward;
        const periodBTC = dailyBTC * config.days;
        const periodRevenue = periodBTC * (poolFee / 100);

        cumulativeRevenue += periodRevenue;

        projections.push({
            period,
            date: periodDate,
            dateStr: formatDateShort(periodDate),
            label: `${config.label} ${period}`,
            poolHashrate: projectedPoolHashrate,
            networkHashrate: projectedNetworkHashrate,
            sharePercent,
            dailyBTC,
            periodBTC,
            periodRevenue,
            cumulativeRevenue,
            monthsElapsed
        });
    }

    return projections;
}

/**
 * Format date as short string
 */
function formatDateShort(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Calculate quarterly summaries from projections
 * Groups projections by calendar quarter (Q1=Jan-Mar, Q2=Apr-Jun, etc.)
 *
 * @param {Array} projections - Array of projection objects with date property
 * @returns {Array} Array of quarterly summary objects
 */
export function calculateQuarterlySummaries(projections) {
    if (!projections || projections.length === 0) return [];

    const quarterMap = new Map();

    projections.forEach(proj => {
        const date = new Date(proj.date);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const key = `${year}-Q${quarter}`;

        if (!quarterMap.has(key)) {
            quarterMap.set(key, {
                year,
                quarter,
                label: `Q${quarter} ${year}`,
                projections: []
            });
        }
        quarterMap.get(key).projections.push(proj);
    });

    // Convert to array and calculate summaries
    const quarters = Array.from(quarterMap.values()).map(q => {
        const quarterRevenue = q.projections.reduce((sum, p) => sum + p.periodRevenue, 0);
        const lastProj = q.projections[q.projections.length - 1];

        return {
            year: q.year,
            quarter: q.quarter,
            label: q.label,
            revenue: quarterRevenue,
            endSharePercent: lastProj.sharePercent,
            endPoolHashrate: lastProj.poolHashrate,
            cumulativeAtEnd: lastProj.cumulativeRevenue,
            periodCount: q.projections.length
        };
    });

    return quarters;
}

/**
 * Format hashrate for compact display
 */
export function formatHashrateCompact(hashrate) {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
    let unitIndex = 0;
    let value = hashrate;

    while (value >= 1000 && unitIndex < units.length - 1) {
        value /= 1000;
        unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
}
