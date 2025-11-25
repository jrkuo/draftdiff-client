// Stratz-style analysis configuration and constants

// All 8 brackets for win rate lookup
export const BRACKETS = [
    'Herald',
    'Guardian',
    'Crusader',
    'Archon',
    'Legend',
    'Ancient',
    'Divine',
    'Immortal'
];

// Bracket groups for synergy/counter lookup
// Maps individual brackets to their grouped bracket for synergy data
export const BRACKET_GROUPS = {
    'Herald': 'Herald_Guardian',
    'Guardian': 'Herald_Guardian',
    'Crusader': 'Crusader_Archon',
    'Archon': 'Crusader_Archon',
    'Legend': 'Legend_Ancient',
    'Ancient': 'Legend_Ancient',
    'Divine': 'Divine_Immortal',
    'Immortal': 'Divine_Immortal'
};

// Position labels
export const POSITIONS = [
    { id: 1, label: 'Pos 1', name: 'Carry' },
    { id: 2, label: 'Pos 2', name: 'Mid' },
    { id: 3, label: 'Pos 3', name: 'Offlane' },
    { id: 4, label: 'Pos 4', name: 'Soft Support' },
    { id: 5, label: 'Pos 5', name: 'Hard Support' }
];

// S3 configuration for stratz-style data
export const STRATZ_DATA_CONFIG = {
    bucketUrl: 'https://draftdiff.s3.amazonaws.com',
    filename: 'public/stratz_data.json.gz'
};

// Default bracket selection
export const DEFAULT_BRACKET = 'Archon';

/**
 * Get the bracket group for synergy/counter lookups
 * @param {string} bracket - Individual bracket name
 * @returns {string} - Bracket group name for synergy data
 */
export function getBracketGroup(bracket) {
    return BRACKET_GROUPS[bracket] || 'Crusader_Archon';
}

/**
 * Data structure reference (for documentation):
 *
 * {
 *   "metadata": {
 *     "generated_at": "2025-11-17T...",
 *     "time_range_days": 7
 *   },
 *   "win_rates": {
 *     "Herald": {
 *       "position_1": [{"hero": "Anti-Mage", "winrate": 0.52, "matches": 1500}, ...],
 *       "position_2": [...],
 *       "position_3": [...],
 *       "position_4": [...],
 *       "position_5": [...]
 *     },
 *     // ... all 8 brackets
 *   },
 *   "synergies_counters": {
 *     "Herald_Guardian": {
 *       "Anti-Mage": {
 *         "Medusa": {"synergy": 2.5, "counter": -3.2, "matches_with": 150, "matches_vs": 200},
 *         // ... all hero pairs
 *       },
 *       // ... all heroes
 *     },
 *     // ... all 4 grouped brackets
 *   }
 * }
 */
