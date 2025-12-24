// UI module for DOM manipulation and state

import { formatHashrate, formatDifficulty, formatNumber } from './api.js';
import {
    formatBTC, formatSats, formatPercent,
    btcToSats, projectEarnings
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
    blockReward: document.getElementById('blockReward'),
    lastUpdate: document.getElementById('lastUpdate'),
    blockHeight: document.getElementById('blockHeight'),

    // Inputs
    hashrate: document.getElementById('hashrate'),
    hashrateUnit: document.getElementById('hashrateUnit'),
    poolFee: document.getElementById('poolFee'),
    poolFeeSlider: document.getElementById('poolFeeSlider'),
    formula: document.getElementById('formula'),

    // Formula displays
    hashrateValues: document.getElementById('hashrate-values'),
    feeValues: document.getElementById('fee-values'),
    calcEquation: document.getElementById('calc-equation'),
    calcValues: document.getElementById('calc-values'),

    // Results
    networkShare: document.getElementById('networkShare'),
    expectedBlocks: document.getElementById('expectedBlocks'),

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
    if (elements.blockReward) {
        elements.blockReward.textContent = `${data.blockReward} BTC`;
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
            elements.calcEquation.textContent = '(Hashrate ÷ Network) × 144 × Reward';
        }
    }
    if (elements.calcValues) {
        if (formulaType === 'difficulty') {
            elements.calcValues.textContent =
                `${formatBTC(dailyBTC)} BTC/day`;
        } else {
            elements.calcValues.textContent =
                `${formatPercent(sharePercent)} × 144 × ${blockReward} = ${formatBTC(dailyBTC)} BTC/day`;
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
        formula: elements.formula?.value || 'hashrate'
    };
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
