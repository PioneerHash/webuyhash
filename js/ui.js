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

// Pagination state
const ROWS_PER_PAGE = 30;
const STORAGE_KEY = 'webuyhash_projections';
let currentPage = 1;
let totalPages = 1;
let currentProjectionParams = null;

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

    // Pagination controls
    paginationInfo: document.getElementById('paginationInfo'),
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageNumbers: document.getElementById('pageNumbers'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

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
 * Render projections table with pagination
 */
export function renderProjections(projections, quarters, params) {
    if (!elements.projectionsBody) return;

    // Store projections in localStorage for pagination
    storeProjections(projections, params);
    currentProjectionParams = params;

    // Calculate pagination
    totalPages = Math.ceil(projections.length / ROWS_PER_PAGE);
    currentPage = 1;

    // Render current page
    renderProjectionsPage();

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

    // Update pagination UI
    updatePaginationUI(projections.length);
}

/**
 * Store projections in localStorage
 */
function storeProjections(projections, params) {
    try {
        const data = {
            projections: projections,
            params: params,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Could not store projections in localStorage:', e);
    }
}

/**
 * Get projections from localStorage
 */
function getStoredProjections() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('Could not retrieve projections from localStorage:', e);
        return null;
    }
}

/**
 * Render a specific page of projections
 */
function renderProjectionsPage() {
    const stored = getStoredProjections();
    if (!stored || !stored.projections) return;

    const projections = stored.projections;
    const params = stored.params || currentProjectionParams;

    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = Math.min(startIndex + ROWS_PER_PAGE, projections.length);
    const pageData = projections.slice(startIndex, endIndex);

    // Build table rows
    let html = '';
    pageData.forEach((proj, index) => {
        const globalIndex = startIndex + index;
        // Highlight every 3rd row for monthly, every 4th for weekly
        const highlightInterval = params?.granularity === 'weekly' ? 4 : 3;
        const isHighlight = (globalIndex + 1) % highlightInterval === 0;
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
}

/**
 * Update pagination UI
 */
function updatePaginationUI(totalRows) {
    // Update info text
    if (elements.paginationInfo) {
        if (totalRows <= ROWS_PER_PAGE) {
            elements.paginationInfo.textContent = `Showing all ${totalRows} results`;
        } else {
            const start = (currentPage - 1) * ROWS_PER_PAGE + 1;
            const end = Math.min(currentPage * ROWS_PER_PAGE, totalRows);
            elements.paginationInfo.textContent = `Showing ${start}-${end} of ${totalRows} results`;
        }
    }

    // Show/hide pagination
    if (elements.pagination) {
        if (totalRows <= ROWS_PER_PAGE) {
            elements.pagination.classList.add('hidden');
        } else {
            elements.pagination.classList.remove('hidden');
        }
    }

    // Update prev/next buttons
    if (elements.prevPage) {
        elements.prevPage.disabled = currentPage <= 1;
    }
    if (elements.nextPage) {
        elements.nextPage.disabled = currentPage >= totalPages;
    }

    // Render page numbers
    renderPageNumbers(totalRows);
}

/**
 * Render page number buttons
 */
function renderPageNumbers(totalRows) {
    if (!elements.pageNumbers) return;

    let html = '';
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
            html += `<span class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
        }
    } else {
        // Show with ellipsis
        if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
                html += `<span class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
            html += `<span class="page-num ellipsis">...</span>`;
            html += `<span class="page-num" data-page="${totalPages}">${totalPages}</span>`;
        } else if (currentPage >= totalPages - 2) {
            html += `<span class="page-num" data-page="1">1</span>`;
            html += `<span class="page-num ellipsis">...</span>`;
            for (let i = totalPages - 3; i <= totalPages; i++) {
                html += `<span class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
        } else {
            html += `<span class="page-num" data-page="1">1</span>`;
            html += `<span class="page-num ellipsis">...</span>`;
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                html += `<span class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
            html += `<span class="page-num ellipsis">...</span>`;
            html += `<span class="page-num" data-page="${totalPages}">${totalPages}</span>`;
        }
    }

    elements.pageNumbers.innerHTML = html;
}

/**
 * Go to a specific page
 */
export function goToPage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderProjectionsPage();

    const stored = getStoredProjections();
    updatePaginationUI(stored?.projections?.length || 0);
}

/**
 * Initialize pagination event listeners
 */
export function initPagination() {
    if (elements.prevPage) {
        elements.prevPage.addEventListener('click', () => goToPage(currentPage - 1));
    }
    if (elements.nextPage) {
        elements.nextPage.addEventListener('click', () => goToPage(currentPage + 1));
    }
    if (elements.pageNumbers) {
        elements.pageNumbers.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('page-num') && !target.classList.contains('ellipsis')) {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page)) {
                    goToPage(page);
                }
            }
        });
    }
    if (elements.exportCsvBtn) {
        elements.exportCsvBtn.addEventListener('click', exportProjectionsCsv);
    }
}

/**
 * Export projections to CSV
 */
function exportProjectionsCsv() {
    const stored = getStoredProjections();
    if (!stored || !stored.projections || stored.projections.length === 0) {
        alert('No projection data to export');
        return;
    }

    const projections = stored.projections;
    const params = stored.params;

    // Build CSV content
    const headers = ['Date', 'Period', 'Pool Hashrate (H/s)', 'Network Hashrate (H/s)', 'Share %', 'Period Revenue (BTC)', 'Cumulative Revenue (BTC)'];
    const rows = projections.map(proj => [
        proj.dateStr,
        proj.label,
        proj.poolHashrate.toExponential(4),
        proj.networkHashrate.toExponential(4),
        proj.sharePercent.toFixed(6),
        proj.periodRevenue.toFixed(8),
        proj.cumulativeRevenue.toFixed(8)
    ]);

    // Add metadata rows at top
    const metadata = [
        ['# webuyhash.com - Pool Revenue Projections'],
        ['# Generated:', new Date().toISOString()],
        ['# Start Date:', params?.startDate ? new Date(params.startDate).toLocaleDateString() : '--'],
        ['# End Date:', params?.endDate ? new Date(params.endDate).toLocaleDateString() : '--'],
        ['# Granularity:', params?.granularity || '--'],
        ['# Pool Growth Rate:', `${params?.poolGrowthRate || 0}% per month`],
        ['# Network Growth Rate:', `${params?.networkGrowthRate || 0}% per month`],
        ['# Block Reward:', `${params?.blockReward || 0} BTC`],
        ['# Pool Fee:', `${params?.poolFee || 0}%`],
        ['']
    ];

    const csvContent = [
        ...metadata.map(row => row.join(',')),
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webuyhash-projections-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
