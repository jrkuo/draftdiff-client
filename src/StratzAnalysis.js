import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import BracketSelector from './component/BracketSelector';
import PositionTeamCell from './component/PositionTeamCell';
import { useStratzData, getWinRateDifferential, getSynergy, getCounter } from './hooks/useStratzData';
import { POSITIONS, DEFAULT_BRACKET, getBracketGroup } from './types/stratzTypes';
import { HERO_OPTIONS } from './constants/heroes';
import './StratzAnalysis.css';

/**
 * Main Stratz-style analysis component
 * Shows win rate differential, synergy, and counter metrics for draft analysis
 */
const StratzAnalysis = () => {
    const { data, loading, error } = useStratzData();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [bracket, setBracket] = useState(searchParams.get('bracket') || DEFAULT_BRACKET);
    const [allyPicks, setAllyPicks] = useState([]);
    const [enemyPicks, setEnemyPicks] = useState([]);

    // Initialize picks from URL params (runs once on mount)
    useEffect(() => {
        const allyParam = searchParams.get('allyPicks');
        const enemyParam = searchParams.get('enemyPicks');

        if (allyParam) {
            const picks = allyParam.split(',').map(item => {
                const [heroName, pos] = item.split(':');
                return { heroName, position: parseInt(pos, 10) };
            }).filter(p => p.heroName && p.position);
            setAllyPicks(picks);
        }

        if (enemyParam) {
            const picks = enemyParam.split(',').map(item => {
                const [heroName, pos] = item.split(':');
                return { heroName, position: parseInt(pos, 10) };
            }).filter(p => p.heroName && p.position);
            setEnemyPicks(picks);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update URL when state changes
    const updateURLParams = useCallback((newBracket, newAllyPicks, newEnemyPicks) => {
        const params = new URLSearchParams();

        if (newBracket && newBracket !== DEFAULT_BRACKET) {
            params.set('bracket', newBracket);
        }

        if (newAllyPicks.length > 0) {
            const allyStr = newAllyPicks
                .filter(p => p.heroName)
                .map(p => `${p.heroName}:${p.position}`)
                .join(',');
            if (allyStr) params.set('allyPicks', allyStr);
        }

        if (newEnemyPicks.length > 0) {
            const enemyStr = newEnemyPicks
                .filter(p => p.heroName)
                .map(p => `${p.heroName}:${p.position}`)
                .join(',');
            if (enemyStr) params.set('enemyPicks', enemyStr);
        }

        setSearchParams(params);
    }, [setSearchParams]);

    // Handlers
    const handleBracketChange = (newBracket) => {
        setBracket(newBracket);
        updateURLParams(newBracket, allyPicks, enemyPicks);
    };

    const handleAllyPicksChange = (picks) => {
        setAllyPicks(picks);
        updateURLParams(bracket, picks, enemyPicks);
    };

    const handleEnemyPicksChange = (picks) => {
        setEnemyPicks(picks);
        updateURLParams(bracket, allyPicks, picks);
    };

    // Get bracket group for synergy/counter lookups
    const bracketGroup = useMemo(() => getBracketGroup(bracket), [bracket]);

    // Calculate metrics for a single hero
    const calculateHeroMetrics = useCallback((heroName, position, isAlly) => {
        if (!data || !heroName) {
            return { winRate: 0, synergy: 0, counter: 0, total: 0 };
        }

        // Win rate differential from 50%
        const winRate = getWinRateDifferential(data, bracket, position, heroName);

        // Synergy with teammates
        let synergy = 0;
        const teammates = isAlly ? allyPicks : enemyPicks;
        teammates.forEach(teammate => {
            if (teammate.heroName && teammate.heroName !== heroName) {
                synergy += getSynergy(data, bracketGroup, heroName, teammate.heroName);
            }
        });

        // Counter against enemies
        let counter = 0;
        const enemies = isAlly ? enemyPicks : allyPicks;
        enemies.forEach(enemy => {
            if (enemy.heroName) {
                counter += getCounter(data, bracketGroup, heroName, enemy.heroName);
            }
        });

        const total = winRate + synergy + counter;

        return { winRate, synergy, counter, total };
    }, [data, bracket, bracketGroup, allyPicks, enemyPicks]);

    // Calculate team totals
    const teamTotals = useMemo(() => {
        const calculateTeamTotal = (picks, isAlly) => {
            let totalWinRate = 0;
            let totalSynergy = 0;
            let totalCounter = 0;

            picks.forEach(pick => {
                if (pick.heroName) {
                    const metrics = calculateHeroMetrics(pick.heroName, pick.position, isAlly);
                    totalWinRate += metrics.winRate;
                    totalSynergy += metrics.synergy;
                    totalCounter += metrics.counter;
                }
            });

            // Divide synergy by 2 to avoid double counting (each pair counted once)
            totalSynergy = totalSynergy / 2;

            return {
                winRate: totalWinRate,
                synergy: totalSynergy,
                counter: totalCounter,
                total: totalWinRate + totalSynergy + totalCounter
            };
        };

        return {
            ally: calculateTeamTotal(allyPicks, true),
            enemy: calculateTeamTotal(enemyPicks, false)
        };
    }, [allyPicks, enemyPicks, calculateHeroMetrics]);

    // Format number with sign and color
    const formatValue = (value, decimals = 1) => {
        const formatted = value.toFixed(decimals);
        const sign = value >= 0 ? '+' : '';
        return `${sign}${formatted}`;
    };

    const getValueClass = (value) => {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return 'neutral';
    };

    // Render metrics row for a position
    const renderPositionMetrics = (position, picks, isAlly) => {
        const pick = picks.find(p => p.position === position);
        const heroName = pick?.heroName;

        if (!heroName) {
            return (
                <div className="metrics-row empty">
                    <span className="metric-value">-</span>
                    <span className="metric-value">-</span>
                    <span className="metric-value">-</span>
                    <span className="metric-value total">-</span>
                </div>
            );
        }

        const metrics = calculateHeroMetrics(heroName, position, isAlly);

        return (
            <div className="metrics-row">
                <span className={`metric-value ${getValueClass(metrics.winRate)}`}>
                    {formatValue(metrics.winRate)}
                </span>
                <span className={`metric-value ${getValueClass(metrics.synergy)}`}>
                    {formatValue(metrics.synergy)}
                </span>
                <span className={`metric-value ${getValueClass(metrics.counter)}`}>
                    {formatValue(metrics.counter)}
                </span>
                <span className={`metric-value total ${getValueClass(metrics.total)}`}>
                    {formatValue(metrics.total)}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="stratz-analysis loading">
                <div className="loading-spinner">Loading analysis data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stratz-analysis error">
                <div className="error-message">
                    <h2>Failed to load analysis data</h2>
                    <p>{error.message}</p>
                    <p>Make sure the data file exists at the configured S3 location.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="stratz-analysis">
            <div className="analysis-header">
                <h1>Draft Analysis</h1>
                <BracketSelector
                    selectedBracket={bracket}
                    onBracketChange={handleBracketChange}
                />
            </div>

            <div className="analysis-content">
                {/* Column Headers */}
                <div className="metrics-header">
                    <div className="team-header-spacer"></div>
                    <div className="metrics-labels">
                        <span className="metric-label" title="Win rate differential from 50%">Win%</span>
                        <span className="metric-label" title="Synergy with teammates">Syn</span>
                        <span className="metric-label" title="Counter vs enemies">Cnt</span>
                        <span className="metric-label total" title="Total score">Total</span>
                    </div>
                </div>

                <div className="teams-container">
                    {/* Ally Team */}
                    <div className="team-section ally">
                        <h2 className="team-title">Ally Team</h2>
                        <div className="team-content">
                            <PositionTeamCell
                                teamId="ally"
                                initialPicks={allyPicks}
                                onPicksChange={handleAllyPicksChange}
                                otherTeamPicks={enemyPicks}
                                allAvailableHeroes={HERO_OPTIONS}
                            />
                            <div className="team-metrics">
                                {POSITIONS.map(pos => (
                                    <div key={pos.id} className="position-metrics">
                                        {renderPositionMetrics(pos.id, allyPicks, true)}
                                    </div>
                                ))}
                                {/* Team Total */}
                                <div className="team-total-row">
                                    <div className="metrics-row total-row">
                                        <span className={`metric-value ${getValueClass(teamTotals.ally.winRate)}`}>
                                            {formatValue(teamTotals.ally.winRate)}
                                        </span>
                                        <span className={`metric-value ${getValueClass(teamTotals.ally.synergy)}`}>
                                            {formatValue(teamTotals.ally.synergy)}
                                        </span>
                                        <span className={`metric-value ${getValueClass(teamTotals.ally.counter)}`}>
                                            {formatValue(teamTotals.ally.counter)}
                                        </span>
                                        <span className={`metric-value total ${getValueClass(teamTotals.ally.total)}`}>
                                            {formatValue(teamTotals.ally.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enemy Team */}
                    <div className="team-section enemy">
                        <h2 className="team-title">Enemy Team</h2>
                        <div className="team-content">
                            <PositionTeamCell
                                teamId="enemy"
                                initialPicks={enemyPicks}
                                onPicksChange={handleEnemyPicksChange}
                                otherTeamPicks={allyPicks}
                                allAvailableHeroes={HERO_OPTIONS}
                            />
                            <div className="team-metrics">
                                {POSITIONS.map(pos => (
                                    <div key={pos.id} className="position-metrics">
                                        {renderPositionMetrics(pos.id, enemyPicks, false)}
                                    </div>
                                ))}
                                {/* Team Total */}
                                <div className="team-total-row">
                                    <div className="metrics-row total-row">
                                        <span className={`metric-value ${getValueClass(teamTotals.enemy.winRate)}`}>
                                            {formatValue(teamTotals.enemy.winRate)}
                                        </span>
                                        <span className={`metric-value ${getValueClass(teamTotals.enemy.synergy)}`}>
                                            {formatValue(teamTotals.enemy.synergy)}
                                        </span>
                                        <span className={`metric-value ${getValueClass(teamTotals.enemy.counter)}`}>
                                            {formatValue(teamTotals.enemy.counter)}
                                        </span>
                                        <span className={`metric-value total ${getValueClass(teamTotals.enemy.total)}`}>
                                            {formatValue(teamTotals.enemy.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StratzAnalysis;
