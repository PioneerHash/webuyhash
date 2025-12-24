// Main application entry point

import { fetchAllNetworkData } from './api.js';
import {
    convertToHashPerSecond,
    calculateDailyBTC,
    calculateNetworkShare,
    calculateExpectedBlocksPerDay
} from './calculator.js';
import {
    updateNetworkStats,
    updateResults,
    updatePoolShare,
    updateFormulaDisplays,
    getInputValues,
    initInfoBoxes,
    initSliderSync,
    initUnitToggle,
    setLoading,
    showError,
    clearError,
    debounce
} from './ui.js';
import { formatHashrate } from './api.js';

// Application state
let networkData = null;
let refreshInterval = null;

const REFRESH_INTERVAL = 60000; // 1 minute

/**
 * Calculate and update all results based on current inputs and network data
 */
function calculate() {
    if (!networkData) {
        console.log('No network data available yet');
        return;
    }

    const inputs = getInputValues();

    // Convert hashrate to H/s
    const hashrateInHps = convertToHashPerSecond(inputs.hashrate, inputs.hashrateUnit);

    // Calculate daily BTC mined by pool
    const dailyBTC = calculateDailyBTC({
        hashrate: hashrateInHps,
        difficulty: networkData.difficulty,
        networkHashrate: networkData.networkHashrate,
        blockReward: networkData.blockReward
    }, inputs.formula);

    // Calculate pool share stats
    const sharePercent = calculateNetworkShare(hashrateInHps, networkData.networkHashrate);
    const expectedBlocks = calculateExpectedBlocksPerDay(hashrateInHps, networkData.networkHashrate);

    // Calculate pool revenue (simple: dailyBTC × fee%)
    const feePercent = inputs.poolFee;
    const poolRevenue = dailyBTC * (feePercent / 100);

    // Update UI
    updatePoolShare(sharePercent, expectedBlocks);
    updateResults(poolRevenue);

    // Update formula displays
    updateFormulaDisplays({
        yourHashrate: hashrateInHps,
        yourHashrateFormatted: `${inputs.hashrate} ${inputs.hashrateUnit}/s`,
        networkHashrate: networkData.networkHashrate,
        networkHashrateFormatted: formatHashrate(networkData.networkHashrate),
        sharePercent: sharePercent,
        dailyBTC: dailyBTC,
        poolRevenue: poolRevenue,
        feePercent: feePercent,
        formulaType: inputs.formula,
        difficulty: networkData.difficulty,
        blockReward: networkData.blockReward
    });
}

/**
 * Fetch fresh network data and recalculate
 */
async function refreshData() {
    try {
        setLoading(true);
        clearError();

        networkData = await fetchAllNetworkData();
        updateNetworkStats(networkData);

        calculate();

        setLoading(false);
    } catch (error) {
        console.error('Failed to refresh data:', error);
        showError(error.message);
        setLoading(false);
    }
}

/**
 * Initialize event listeners for inputs
 */
function initEventListeners() {
    const debouncedCalculate = debounce(calculate, 150);

    // Hashrate input
    const hashrateInput = document.getElementById('hashrate');
    if (hashrateInput) {
        hashrateInput.addEventListener('input', debouncedCalculate);
    }

    // Hashrate unit selector
    const hashrateUnit = document.getElementById('hashrateUnit');
    if (hashrateUnit) {
        hashrateUnit.addEventListener('change', calculate);
    }

    // Pool fee inputs (both slider and number)
    const poolFee = document.getElementById('poolFee');
    const poolFeeSlider = document.getElementById('poolFeeSlider');
    if (poolFee) {
        poolFee.addEventListener('input', debouncedCalculate);
    }
    if (poolFeeSlider) {
        poolFeeSlider.addEventListener('input', debouncedCalculate);
    }

    // Formula selector
    const formula = document.getElementById('formula');
    if (formula) {
        formula.addEventListener('change', calculate);
    }
}

/**
 * Start the auto-refresh interval
 */
function startAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    // Set up new interval
    refreshInterval = setInterval(refreshData, REFRESH_INTERVAL);
}

/**
 * Stop the auto-refresh interval
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * Initialize the application
 */
async function init() {
    console.log('webuyhash.com - Initializing...');

    // Initialize UI components
    initInfoBoxes();
    initSliderSync();
    initUnitToggle();

    // Set up event listeners
    initEventListeners();

    // Fetch initial data
    await refreshData();

    // Start auto-refresh
    startAutoRefresh();

    // Handle visibility change to pause/resume refresh
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            refreshData();
            startAutoRefresh();
        }
    });

    console.log('webuyhash.com - Ready!');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
