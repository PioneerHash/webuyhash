// mempool.space API integration

const API_BASE = 'https://mempool.space/api/v1';

// Cache for API responses
let cache = {
    data: null,
    timestamp: 0
};

const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch mining stats (hashrate and difficulty)
 * Uses 3d endpoint which provides both currentHashrate and currentDifficulty
 */
export async function fetchMiningStats() {
    const response = await fetch(`${API_BASE}/mining/hashrate/3d`);
    if (!response.ok) {
        throw new Error(`Failed to fetch mining stats: ${response.status}`);
    }
    const data = await response.json();
    return {
        currentHashrate: data.currentHashrate,
        currentDifficulty: data.currentDifficulty
    };
}

/**
 * Fetch difficulty adjustment info
 * Returns current difficulty and adjustment data
 */
export async function fetchDifficulty() {
    const response = await fetch(`${API_BASE}/difficulty-adjustment`);
    if (!response.ok) {
        throw new Error(`Failed to fetch difficulty: ${response.status}`);
    }
    const data = await response.json();
    return {
        difficulty: data.difficultyChange !== undefined ? data.previousRetarget : null,
        progressPercent: data.progressPercent,
        remainingBlocks: data.remainingBlocks,
        remainingTime: data.remainingTime,
        nextRetargetHeight: data.nextRetargetHeight,
        estimatedRetargetDate: data.estimatedRetargetDate,
        difficultyChange: data.difficultyChange
    };
}

/**
 * Fetch current block height to calculate block reward
 * Block reward halves every 210,000 blocks
 * Started at 50 BTC, currently at 3.125 BTC (4th halving)
 */
export async function fetchBlockHeight() {
    const response = await fetch(`${API_BASE}/blocks/tip/height`);
    if (!response.ok) {
        throw new Error(`Failed to fetch block height: ${response.status}`);
    }
    const height = await response.json();
    return height;
}

/**
 * Calculate block reward based on height
 */
export function calculateBlockReward(height) {
    const halvings = Math.floor(height / 210000);
    const reward = 50 / Math.pow(2, halvings);
    return reward;
}

/**
 * Fetch BTC price in USD
 */
export async function fetchBTCPrice() {
    const response = await fetch(`${API_BASE}/prices`);
    if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.status}`);
    }
    const data = await response.json();
    return data.USD;
}

/**
 * Fetch all network data at once
 * Returns combined object with all mining stats
 */
export async function fetchAllNetworkData() {
    // Check cache
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
        return cache.data;
    }

    try {
        // Fetch all data in parallel
        const [miningStats, diffData, height, btcPrice] = await Promise.all([
            fetchMiningStats(),
            fetchDifficulty(),
            fetchBlockHeight(),
            fetchBTCPrice()
        ]);

        const blockReward = calculateBlockReward(height);

        const result = {
            networkHashrate: miningStats.currentHashrate,
            difficulty: miningStats.currentDifficulty,
            blockHeight: height,
            blockReward: blockReward,
            btcPrice: btcPrice,
            difficultyAdjustment: diffData,
            timestamp: now
        };

        // Update cache
        cache.data = result;
        cache.timestamp = now;

        return result;
    } catch (error) {
        console.error('Error fetching network data:', error);
        throw error;
    }
}

/**
 * Format hashrate for display
 */
export function formatHashrate(hashrate) {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
    let unitIndex = 0;
    let value = hashrate;

    while (value >= 1000 && unitIndex < units.length - 1) {
        value /= 1000;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '--';
    return num.toLocaleString('en-US');
}

/**
 * Format difficulty for display
 */
export function formatDifficulty(difficulty) {
    if (!difficulty) return '--';

    if (difficulty >= 1e12) {
        return `${(difficulty / 1e12).toFixed(2)}T`;
    } else if (difficulty >= 1e9) {
        return `${(difficulty / 1e9).toFixed(2)}B`;
    } else if (difficulty >= 1e6) {
        return `${(difficulty / 1e6).toFixed(2)}M`;
    }
    return formatNumber(difficulty);
}
