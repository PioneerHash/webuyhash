// UI module for DOM manipulation and state

import { formatHashrate, formatDifficulty, formatNumber } from './api.js';
import {
    formatBTC, formatSats, formatPercent,
    btcToSats, projectEarnings, formatHashrateCompact
} from './calculator.js';

// Current display unit (btc or sats)
let displayUnit = 'btc';

// Store current values for re-rendering on unit toggle
let currentResults = null;

// DOM element references
const elements = {
    // Network stats
    networkHashrate: document.getElementById('networkHashrate'),
    difficulty: document.getElementById('difficulty'),
    blockSubsidy: document.getElementById('blockSubsidy'),
    avgBlockFees: document.getElementById('avgBlockFees'),
    lastUpdate: document.getElementById('lastUpdate'),
    blockHeight: document.getElementById('blockHeight'),

    // Inputs
    hashrate: document.getElementById('hashrate'),
    hashrateUnit: document.getElementById('hashrateUnit'),
    poolFee: document.getElementById('poolFee'),
    poolFeeSlider: document.getElementById('poolFeeSlider'),
    formula: document.getElementById('formula'),
    txFees: document.getElementById('txFees'),
    subsidyDisplay: document.getElementById('subsidyDisplay'),
    totalRewardDisplay: document.getElementById('totalRewardDisplay'),
    rewardValues: document.getElementById('reward-values'),

    // Formula displays
    hashrateValues: document.getElementById('hashrate-values'),
    feeValues: document.getElementById('fee-values'),
    calcEquation: document.getElementById('calc-equation'),
    calcValues: document.getElementById('calc-values'),

    // Results
    networkShare: document.getElementById('networkShare'),
    expectedBlocks: document.getElementById('expectedBlocks'),

    // Projections
    projStartDate: document.getElementById('projStartDate'),
    projEndDate: document.getElementById('projEndDate'),
    projGranularity: document.getElementById('projGranularity'),
    poolGrowth: document.getElementById('poolGrowth'),
    networkGrowth: document.getElementById('networkGrowth'),
    projectionsBody: document.getElementById('projectionsBody'),
    projectionsTotalMonthly: document.getElementById('projectionsTotalMonthly'),
    projectionsTotalCumulative: document.getElementById('projectionsTotalCumulative'),
    quarterlyGrid: document.getElementById('quarterlyGrid'),

    // Projection formulae displays
    formulaPoolHashrate: document.getElementById('formulaPoolHashrate'),
    formulaNetworkHashrate: document.getElementById('formulaNetworkHashrate'),
    formulaShare: document.getElementById('formulaShare'),
    formulaRevenue: document.getElementById('formulaRevenue'),

    // Main results table
    amountHeader: document.getElementById('amountHeader'),
    dailyAmount: document.getElementById('dailyAmount'),
    weeklyAmount: document.getElementById('weeklyAmount'),
    monthlyAmount: document.getElementById('monthlyAmount'),
    yearlyAmount: document.getElementById('yearlyAmount'),
    resultsNote: document.getElementById('resultsNote')
};

/**
 * Format value based on current display unit
 */
function formatValue(btcValue) {
    if (displayUnit === 'sats') {
        return formatSats(btcToSats(btcValue));
    }
    return formatBTC(btcValue);
}

/**
 * Update network stats display
 */
export function updateNetworkStats(data) {
    if (elements.networkHashrate) {
        elements.networkHashrate.textContent = formatHashrate(data.networkHashrate);
    }
    if (elements.difficulty) {
        elements.difficulty.textContent = formatDifficulty(data.difficulty);
    }
    if (elements.blockSubsidy) {
        elements.blockSubsidy.textContent = `${data.blockSubsidy} BTC`;
    }
    if (elements.avgBlockFees) {
        elements.avgBlockFees.textContent = `${data.avgBlockFees.toFixed(4)} BTC`;
    }
    if (elements.lastUpdate) {
        const time = new Date(data.timestamp).toLocaleTimeString();
        elements.lastUpdate.textContent = `Updated: ${time}`;
    }
    if (elements.blockHeight) {
        elements.blockHeight.textContent = formatNumber(data.blockHeight);
    }
}

/**
 * Update main results display
 */
export function updateResults(poolRevenue) {
    const projections = projectEarnings(poolRevenue);

    // Store for re-rendering on unit toggle
    currentResults = { projections };

    renderResults();
}

/**
 * Render results based on current display unit
 */
function renderResults() {
    if (!currentResults) return;

    const { projections } = currentResults;

    // Update header
    if (elements.amountHeader) {
        elements.amountHeader.textContent = displayUnit === 'sats' ? 'Sats' : 'BTC';
    }

    // Daily
    if (elements.dailyAmount) elements.dailyAmount.textContent = formatValue(projections.daily);

    // Weekly
    if (elements.weeklyAmount) elements.weeklyAmount.textContent = formatValue(projections.weekly);

    // Monthly
    if (elements.monthlyAmount) elements.monthlyAmount.textContent = formatValue(projections.monthly);

    // Yearly
    if (elements.yearlyAmount) elements.yearlyAmount.textContent = formatValue(projections.yearly);
}

/**
 * Update pool share stats
 */
export function updatePoolShare(sharePercent, expectedBlocks) {
    if (elements.networkShare) {
        elements.networkShare.textContent = formatPercent(sharePercent);
    }
    if (elements.expectedBlocks) {
        elements.expectedBlocks.textContent = expectedBlocks.toFixed(4);
    }
}

/**
 * Update formula displays with actual values
 */
export function updateFormulaDisplays(data) {
    const {
        yourHashrateFormatted,
        networkHashrateFormatted,
        sharePercent,
        dailyBTC,
        poolRevenue,
        feePercent,
        formulaType,
        blockSubsidy,
        avgBlockFees,
        blockReward
    } = data;

    // Hashrate formula
    if (elements.hashrateValues) {
        elements.hashrateValues.textContent =
            `${yourHashrateFormatted} ÷ ${networkHashrateFormatted} = ${formatPercent(sharePercent)}`;
    }

    // Fee formula
    if (elements.feeValues) {
        elements.feeValues.textContent =
            `${formatBTC(dailyBTC)} BTC/day × ${feePercent}% = ${formatBTC(poolRevenue)} BTC`;
    }

    // Calculation formula
    if (elements.calcEquation) {
        if (formulaType === 'difficulty') {
            elements.calcEquation.textContent = '(Hash × Reward × 86400) ÷ (Diff × 2³²)';
        } else {
            elements.calcEquation.textContent = `(Hashrate ÷ Network) × 144 × (${blockSubsidy} + ${avgBlockFees.toFixed(4)})`;
        }
    }
    if (elements.calcValues) {
        if (formulaType === 'difficulty') {
            elements.calcValues.textContent =
                `${formatBTC(dailyBTC)} BTC/day`;
        } else {
            elements.calcValues.textContent =
                `${formatPercent(sharePercent)} × 144 × ${blockReward.toFixed(4)} = ${formatBTC(dailyBTC)} BTC/day`;
        }
    }
}

/**
 * Get current input values
 */
export function getInputValues() {
    return {
        hashrate: parseFloat(elements.hashrate?.value) || 0,
        hashrateUnit: elements.hashrateUnit?.value || 'PH',
        poolFee: parseFloat(elements.poolFee?.value) || 0,
        formula: elements.formula?.value || 'hashrate',
        txFees: parseFloat(elements.txFees?.value) || 0
    };
}

/**
 * Update block reward display (subsidy + fees = total)
 */
export function updateRewardDisplay(subsidy, txFees) {
    const total = subsidy + txFees;

    if (elements.subsidyDisplay) {
        elements.subsidyDisplay.textContent = subsidy.toFixed(3);
    }
    if (elements.totalRewardDisplay) {
        elements.totalRewardDisplay.textContent = total.toFixed(4);
    }
    if (elements.rewardValues) {
        elements.rewardValues.textContent = `${subsidy} + ${txFees.toFixed(4)} = ${total.toFixed(4)} BTC`;
    }
}

/**
 * Set default tx fees value (from network data)
 */
export function setDefaultTxFees(avgFees) {
    if (elements.txFees) {
        elements.txFees.value = avgFees.toFixed(4);
    }
}

/**
 * Get projection input values
 */
export function getProjectionInputs() {
    // Default to today and 12 months from now
    const today = new Date();
    const defaultEnd = new Date(today);
    defaultEnd.setMonth(defaultEnd.getMonth() + 12);

    const startDateStr = elements.projStartDate?.value;
    const endDateStr = elements.projEndDate?.value;

    return {
        startDate: startDateStr ? new Date(startDateStr) : today,
        endDate: endDateStr ? new Date(endDateStr) : defaultEnd,
        granularity: elements.projGranularity?.value || 'monthly',
        poolGrowth: parseFloat(elements.poolGrowth?.value) || 0,
        networkGrowth: parseFloat(elements.networkGrowth?.value) || 0
    };
}

/**
 * Initialize projection date inputs with defaults
 */
export function initProjectionDates() {
    const today = new Date();
    const defaultEnd = new Date(today);
    defaultEnd.setMonth(defaultEnd.getMonth() + 12);

    if (elements.projStartDate) {
        elements.projStartDate.value = formatDateInput(today);
    }
    if (elements.projEndDate) {
        elements.projEndDate.value = formatDateInput(defaultEnd);
    }
}

/**
 * Format date for input[type="date"]
 */
function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Render projections table
 */
export function renderProjections(projections, quarters, params) {
    if (!elements.projectionsBody) return;

    // Build table rows
    let html = '';
    projections.forEach((proj, index) => {
        // Highlight every 3rd row for monthly, every 4th for weekly
        const highlightInterval = params?.granularity === 'weekly' ? 4 : 3;
        const isHighlight = (index + 1) % highlightInterval === 0;
        const rowClass = isHighlight ? 'quarter-row' : '';

        html += `
            <tr class="${rowClass}">
                <td>${proj.dateStr}</td>
                <td>${proj.label}</td>
                <td>${formatHashrateCompact(proj.poolHashrate)}</td>
                <td>${formatHashrateCompact(proj.networkHashrate)}</td>
                <td>${formatPercent(proj.sharePercent)}</td>
                <td>${formatValue(proj.periodRevenue)}</td>
                <td>${formatValue(proj.cumulativeRevenue)}</td>
            </tr>
        `;
    });

    elements.projectionsBody.innerHTML = html;

    // Update totals
    if (projections.length > 0) {
        const lastProj = projections[projections.length - 1];
        const avgPeriod = lastProj.cumulativeRevenue / projections.length;
        const periodLabel = params?.granularity === 'daily' ? 'day' :
                           params?.granularity === 'weekly' ? 'wk' : 'mo';

        if (elements.projectionsTotalMonthly) {
            elements.projectionsTotalMonthly.textContent = `~${formatValue(avgPeriod)}/${periodLabel}`;
        }
        if (elements.projectionsTotalCumulative) {
            elements.projectionsTotalCumulative.textContent = formatValue(lastProj.cumulativeRevenue);
        }
    }

    // Render quarterly grid
    renderQuarterlyGrid(quarters);

    // Update formulae displays
    if (projections.length > 0 && params) {
        updateProjectionFormulae(projections, params);
    }
}

/**
 * Update projection formulae displays with actual values
 */
function updateProjectionFormulae(projections, params) {
    const firstProj = projections[0];
    const lastProj = projections[projections.length - 1];

    // Pool hashrate formula
    if (elements.formulaPoolHashrate) {
        elements.formulaPoolHashrate.textContent =
            `H₀ = ${formatHashrateCompact(params.poolHashrate)} | g = ${params.poolGrowthRate}%/mo | t = ${projections.length} periods`;
    }

    // Network hashrate formula
    if (elements.formulaNetworkHashrate) {
        elements.formulaNetworkHashrate.textContent =
            `N₀ = ${formatHashrateCompact(params.networkHashrate)} | gₙ = ${params.networkGrowthRate}%/mo | t = ${projections.length} periods`;
    }

    // Share formula
    if (elements.formulaShare) {
        elements.formulaShare.textContent =
            `Share changes from ${formatPercent(firstProj.sharePercent)} to ${formatPercent(lastProj.sharePercent)}`;
    }

    // Revenue formula
    if (elements.formulaRevenue) {
        const blocksLabel = params.granularity === 'daily' ? '144 blocks/day' :
                           params.granularity === 'weekly' ? '1,008 blocks/wk' : '4,320 blocks/mo';
        elements.formulaRevenue.textContent =
            `${blocksLabel} × ${params.blockReward.toFixed(4)} BTC × ${params.poolFee}% fee`;
    }
}

/**
 * Render quarterly summary grid
 */
function renderQuarterlyGrid(quarters) {
    if (!elements.quarterlyGrid) return;

    let html = '';
    quarters.forEach((q, index) => {
        const isLast = index === quarters.length - 1;
        const highlight = isLast ? 'highlight' : '';

        html += `
            <div class="quarter-card ${highlight}">
                <div class="quarter-label">${q.label}</div>
                <div class="quarter-value">${formatValue(q.revenue)}</div>
                <div class="quarter-subvalue">Share: ${formatPercent(q.endSharePercent)}</div>
            </div>
        `;
    });

    // Add total card
    if (quarters.length > 0) {
        const total = quarters[quarters.length - 1].cumulativeAtEnd;
        html += `
            <div class="quarter-card highlight">
                <div class="quarter-label">Total</div>
                <div class="quarter-value">${formatValue(total)}</div>
                <div class="quarter-subvalue">${quarters.length * 3} months</div>
            </div>
        `;
    }

    elements.quarterlyGrid.innerHTML = html;
}

/**
 * Initialize info box toggles
 */
export function initInfoBoxes() {
    const toggles = document.querySelectorAll('.info-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const infoId = toggle.dataset.info;
            const infoBox = document.getElementById(infoId);

            if (infoBox) {
                infoBox.classList.toggle('show');
                toggle.classList.toggle('active');
            }
        });
    });
}

/**
 * Initialize slider sync with number input
 */
export function initSliderSync() {
    if (elements.poolFeeSlider && elements.poolFee) {
        elements.poolFeeSlider.addEventListener('input', (e) => {
            elements.poolFee.value = e.target.value;
        });

        elements.poolFee.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value >= 0 && value <= 10) {
                elements.poolFeeSlider.value = value;
            }
        });
    }
}

/**
 * Initialize unit toggle
 */
export function initUnitToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update display unit
            displayUnit = btn.dataset.unit;

            // Re-render with new unit
            renderResults();
            renderComparison();
        });
    });
}

/**
 * Set loading state on elements
 */
export function setLoading(isLoading) {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(el => {
        if (isLoading) {
            el.classList.add('loading');
        } else {
            el.classList.remove('loading');
        }
    });
}

/**
 * Show error state
 */
export function showError(message) {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(el => {
        el.textContent = 'Error';
        el.classList.add('error');
    });
    console.error('UI Error:', message);
}

/**
 * Clear error state
 */
export function clearError() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(el => {
        el.classList.remove('error');
    });
}

/**
 * Debounce function for input handlers
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
