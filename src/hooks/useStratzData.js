import { useState, useEffect } from 'react';
import { loadGzippedData } from '../utils/s3DataLoader';
import { STRATZ_DATA_CONFIG } from '../types/stratzTypes';

/**
 * Custom hook to load Stratz-style analysis data from S3
 * Contains win rates by bracket/position and synergies/counters by bracket group
 *
 * @returns {{ data: Object|null, loading: boolean, error: Error|null }}
 */
export function useStratzData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchStratzData() {
            try {
                console.log('Starting to fetch Stratz data from:', STRATZ_DATA_CONFIG.bucketUrl);
                setLoading(true);

                const stratzData = await loadGzippedData(STRATZ_DATA_CONFIG);

                console.log('Successfully loaded Stratz data');
                console.log('Top-level keys in data:', Object.keys(stratzData));
                if (stratzData.win_rates) {
                    console.log('Brackets available:', Object.keys(stratzData.win_rates));
                    // Log sample data structure for first bracket
                    const firstBracket = Object.keys(stratzData.win_rates)[0];
                    if (firstBracket) {
                        console.log(`Sample bracket "${firstBracket}" keys:`, Object.keys(stratzData.win_rates[firstBracket]));
                        const firstPos = Object.keys(stratzData.win_rates[firstBracket])[0];
                        if (firstPos && stratzData.win_rates[firstBracket][firstPos]?.[0]) {
                            const sampleHero = stratzData.win_rates[firstBracket][firstPos][0];
                            console.log(`Sample hero data from ${firstBracket}/${firstPos}:`, sampleHero);
                            console.log(`Sample hero fields:`, Object.keys(sampleHero));
                        }
                    }
                }
                if (stratzData.synergies_counters) {
                    console.log('Synergy groups available:', Object.keys(stratzData.synergies_counters));
                    // Log sample synergy data
                    const firstGroup = Object.keys(stratzData.synergies_counters)[0];
                    if (firstGroup) {
                        const firstHero = Object.keys(stratzData.synergies_counters[firstGroup])[0];
                        if (firstHero) {
                            const secondHero = Object.keys(stratzData.synergies_counters[firstGroup][firstHero])[0];
                            if (secondHero) {
                                console.log(`Sample synergy data ${firstGroup}/${firstHero}/${secondHero}:`,
                                    stratzData.synergies_counters[firstGroup][firstHero][secondHero]);
                            }
                        }
                    }
                }

                setData(stratzData);
                setError(null);
            } catch (err) {
                console.error('Failed to load Stratz data:', err);
                setError(err instanceof Error ? err : new Error('Failed to load Stratz data'));
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        fetchStratzData();
    }, []);

    return { data, loading, error };
}

/**
 * Get win rate differential from 50% for a hero at a specific position and bracket
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracket - The selected bracket (e.g., 'Archon')
 * @param {number} position - The position number (1-5)
 * @param {string} heroName - The hero name
 * @returns {number} - Win rate differential in percentage points (e.g., 6.1 for 56.1% winrate)
 */
export function getWinRateDifferential(data, bracket, position, heroName) {
    // Data uses "pos1" format instead of "position_1"
    if (!data?.win_rates?.[bracket]?.[`pos${position}`]) {
        return 0;
    }

    const positionData = data.win_rates[bracket][`pos${position}`];
    // Data uses "name" field instead of "hero"
    const heroData = positionData.find(h => h.name === heroName);

    if (!heroData) {
        return 0;
    }

    // Convert from decimal string (e.g., "0.53") to percentage points from 50% (3.0)
    const winrate = parseFloat(heroData.winrate);
    return (winrate - 0.5) * 100;
}

/**
 * Get synergy value between two heroes in a bracket group
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracketGroup - The bracket group (e.g., 'Crusader_Archon')
 * @param {string} hero1 - First hero name
 * @param {string} hero2 - Second hero name
 * @returns {number} - Synergy value (positive = good synergy)
 */
export function getSynergy(data, bracketGroup, hero1, hero2) {
    if (!data?.synergies_counters?.[bracketGroup]?.[hero1]?.[hero2]) {
        // Try the reverse lookup
        if (!data?.synergies_counters?.[bracketGroup]?.[hero2]?.[hero1]) {
            return 0;
        }
        return data.synergies_counters[bracketGroup][hero2][hero1].synergy || 0;
    }

    return data.synergies_counters[bracketGroup][hero1][hero2].synergy || 0;
}

/**
 * Get counter value for a hero against another hero
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracketGroup - The bracket group (e.g., 'Crusader_Archon')
 * @param {string} allyHero - Your team's hero
 * @param {string} enemyHero - Enemy team's hero
 * @returns {number} - Counter value (positive = ally hero counters enemy)
 */
export function getCounter(data, bracketGroup, allyHero, enemyHero) {
    if (!data?.synergies_counters?.[bracketGroup]?.[allyHero]?.[enemyHero]) {
        return 0;
    }

    return data.synergies_counters[bracketGroup][allyHero][enemyHero].counter || 0;
}

/**
 * Calculate total synergy for a team
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracketGroup - The bracket group
 * @param {Array<{heroName: string, position: number}>} teamHeroes - Array of hero picks with positions
 * @returns {number} - Total synergy value
 */
export function calculateTeamSynergy(data, bracketGroup, teamHeroes) {
    const heroes = teamHeroes.filter(h => h.heroName);
    let totalSynergy = 0;

    // Calculate synergy between each unique pair of heroes
    for (let i = 0; i < heroes.length; i++) {
        for (let j = i + 1; j < heroes.length; j++) {
            totalSynergy += getSynergy(data, bracketGroup, heroes[i].heroName, heroes[j].heroName);
        }
    }

    return totalSynergy;
}

/**
 * Calculate total counter value for ally team against enemy team
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracketGroup - The bracket group
 * @param {Array<{heroName: string, position: number}>} allyHeroes - Ally hero picks
 * @param {Array<{heroName: string, position: number}>} enemyHeroes - Enemy hero picks
 * @returns {number} - Total counter value (positive = ally team has advantage)
 */
export function calculateTeamCounter(data, bracketGroup, allyHeroes, enemyHeroes) {
    const allies = allyHeroes.filter(h => h.heroName);
    const enemies = enemyHeroes.filter(h => h.heroName);
    let totalCounter = 0;

    // Sum counter values for each ally-enemy pair
    for (const ally of allies) {
        for (const enemy of enemies) {
            totalCounter += getCounter(data, bracketGroup, ally.heroName, enemy.heroName);
        }
    }

    return totalCounter;
}

/**
 * Get hero pick rate for a hero at a specific position and bracket
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracket - The selected bracket (e.g., 'Archon')
 * @param {number} position - The position number (1-5)
 * @param {string} heroName - The hero name
 * @returns {number} - Hero pick rate as percentage (e.g., 5.2 for 5.2%)
 */
export function getHeroPickRate(data, bracket, position, heroName) {
    if (!data?.win_rates?.[bracket]?.[`pos${position}`]) {
        return 0;
    }

    const positionData = data.win_rates[bracket][`pos${position}`];
    const heroData = positionData.find(h => h.name === heroName);

    if (!heroData || !heroData.pickRate) {
        return 0;
    }

    // Convert from decimal (e.g., 0.052) to percentage (5.2)
    return parseFloat(heroData.pickRate) * 100;
}

/**
 * Get position pick rate for a hero at a specific position and bracket
 *
 * @param {Object} data - The full stratz data object
 * @param {string} bracket - The selected bracket (e.g., 'Archon')
 * @param {number} position - The position number (1-5)
 * @param {string} heroName - The hero name
 * @returns {number} - Position pick rate as percentage (e.g., 12.5 for 12.5%)
 */
export function getPositionPickRate(data, bracket, position, heroName) {
    if (!data?.win_rates?.[bracket]?.[`pos${position}`]) {
        return 0;
    }

    const positionData = data.win_rates[bracket][`pos${position}`];
    const heroData = positionData.find(h => h.name === heroName);

    if (!heroData || !heroData.positionPickRates) {
        return 0;
    }

    // positionPickRates is an object with position keys (e.g., {pos1: 0.125, pos2: 0.032, ...})
    const posPickRate = heroData.positionPickRates[`pos${position}`];

    if (posPickRate === undefined || posPickRate === null) {
        return 0;
    }

    // Convert from decimal (e.g., 0.125) to percentage (12.5)
    return parseFloat(posPickRate) * 100;
}
