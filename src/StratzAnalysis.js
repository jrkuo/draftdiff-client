import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import BracketSelector from './component/BracketSelector';
import PickRateFilter from './component/PickRateFilter';
import PositionTeamCell from './component/PositionTeamCell';
import { useStratzData, getWinRateDifferential, getSynergy, getCounter, getHeroPickRate, getPositionPickRate } from './hooks/useStratzData';
import { POSITIONS, DEFAULT_BRACKET, getBracketGroup, DEFAULT_HERO_PICK_RATE, DEFAULT_POSITION_PICK_RATE } from './types/stratzTypes';
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
    const [heroPickRateThreshold, setHeroPickRateThreshold] = useState(
        parseFloat(searchParams.get('heroPickRate')) || DEFAULT_HERO_PICK_RATE
    );
    const [positionPickRateThreshold, setPositionPickRateThreshold] = useState(
        parseFloat(searchParams.get('positionPickRate')) || DEFAULT_POSITION_PICK_RATE
    );
    const [allyFilters, setAllyFilters] = useState({});
    const [enemyFilters, setEnemyFilters] = useState({});

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
    const updateURLParams = useCallback((newBracket, newAllyPicks, newEnemyPicks, newHeroPickRate, newPositionPickRate) => {
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

        if (newHeroPickRate !== undefined && newHeroPickRate !== DEFAULT_HERO_PICK_RATE) {
            params.set('heroPickRate', newHeroPickRate.toString());
        }

        if (newPositionPickRate !== undefined && newPositionPickRate !== DEFAULT_POSITION_PICK_RATE) {
            params.set('positionPickRate', newPositionPickRate.toString());
        }

        setSearchParams(params);
    }, [setSearchParams]);

    // Handlers
    const handleBracketChange = (newBracket) => {
        setBracket(newBracket);
        updateURLParams(newBracket, allyPicks, enemyPicks, heroPickRateThreshold, positionPickRateThreshold);
    };

    const handleAllyPicksChange = (picks) => {
        setAllyPicks(picks);
        updateURLParams(bracket, picks, enemyPicks, heroPickRateThreshold, positionPickRateThreshold);
    };

    const handleEnemyPicksChange = (picks) => {
        setEnemyPicks(picks);
        updateURLParams(bracket, allyPicks, picks, heroPickRateThreshold, positionPickRateThreshold);
    };

    const handleHeroPickRateChange = (newRate) => {
        setHeroPickRateThreshold(newRate);
        updateURLParams(bracket, allyPicks, enemyPicks, newRate, positionPickRateThreshold);
    };

    const handlePositionPickRateChange = (newRate) => {
        setPositionPickRateThreshold(newRate);
        updateURLParams(bracket, allyPicks, enemyPicks, heroPickRateThreshold, newRate);
    };

    // Get bracket group for synergy/counter lookups
    const bracketGroup = useMemo(() => getBracketGroup(bracket), [bracket]);

    // Get available heroes (not picked by either team)
    const availableHeroes = useMemo(() => {
        const pickedHeroNames = [
            ...allyPicks.map(p => p.heroName),
            ...enemyPicks.map(p => p.heroName)
        ].filter(Boolean);

        return HERO_OPTIONS.filter(hero => !pickedHeroNames.includes(hero.value));
    }, [allyPicks, enemyPicks]);

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

    // Get hero recommendations for a specific position
    const getHeroRecommendations = useMemo(() => {
        const recommendations = {};

        POSITIONS.forEach(pos => {
            // Get the hero currently in this position (if any)
            const allyCurrentHero = allyPicks.find(p => p.position === pos.id)?.heroName;
            const enemyCurrentHero = enemyPicks.find(p => p.position === pos.id)?.heroName;

            // Calculate metrics for ALL available heroes for ally team
            const allyHeroesWithMetrics = availableHeroes.map(hero => {
                if (!data || !hero.value) {
                    return {
                        heroName: hero.value,
                        total: 0,
                        image: hero.image,
                        meetsThreshold: false
                    };
                }

                // Check thresholds
                const heroPickRate = getHeroPickRate(data, bracket, pos.id, hero.value);
                const positionPickRate = getPositionPickRate(data, bracket, pos.id, hero.value);
                const meetsThreshold = heroPickRate >= heroPickRateThreshold && positionPickRate >= positionPickRateThreshold;

                // Win rate differential from 50%
                const winRate = getWinRateDifferential(data, bracket, pos.id, hero.value);

                // Synergy with teammates (excluding the hero currently in this position)
                let synergy = 0;
                allyPicks.forEach(teammate => {
                    if (teammate.heroName &&
                        teammate.heroName !== hero.value &&
                        teammate.heroName !== allyCurrentHero) {
                        synergy += getSynergy(data, bracketGroup, hero.value, teammate.heroName);
                    }
                });

                // Counter against enemies
                let counter = 0;
                enemyPicks.forEach(enemy => {
                    if (enemy.heroName) {
                        counter += getCounter(data, bracketGroup, hero.value, enemy.heroName);
                    }
                });

                const total = winRate + synergy + counter;

                return {
                    heroName: hero.value,
                    total: total,
                    image: hero.image,
                    meetsThreshold: meetsThreshold
                };
            });

            // Separate into two groups and sort each by total descending
            const allyMeetsThreshold = allyHeroesWithMetrics
                .filter(h => h.meetsThreshold)
                .sort((a, b) => b.total - a.total);

            const allyBelowThreshold = allyHeroesWithMetrics
                .filter(h => !h.meetsThreshold)
                .sort((a, b) => b.total - a.total);

            // Calculate metrics for ALL available heroes for enemy team
            const enemyHeroesWithMetrics = availableHeroes.map(hero => {
                if (!data || !hero.value) {
                    return {
                        heroName: hero.value,
                        total: 0,
                        image: hero.image,
                        meetsThreshold: false
                    };
                }

                // Check thresholds
                const heroPickRate = getHeroPickRate(data, bracket, pos.id, hero.value);
                const positionPickRate = getPositionPickRate(data, bracket, pos.id, hero.value);
                const meetsThreshold = heroPickRate >= heroPickRateThreshold && positionPickRate >= positionPickRateThreshold;

                // Win rate differential from 50%
                const winRate = getWinRateDifferential(data, bracket, pos.id, hero.value);

                // Synergy with teammates (excluding the hero currently in this position)
                let synergy = 0;
                enemyPicks.forEach(teammate => {
                    if (teammate.heroName &&
                        teammate.heroName !== hero.value &&
                        teammate.heroName !== enemyCurrentHero) {
                        synergy += getSynergy(data, bracketGroup, hero.value, teammate.heroName);
                    }
                });

                // Counter against enemies (ally team from enemy perspective)
                let counter = 0;
                allyPicks.forEach(enemy => {
                    if (enemy.heroName) {
                        counter += getCounter(data, bracketGroup, hero.value, enemy.heroName);
                    }
                });

                const total = winRate + synergy + counter;

                return {
                    heroName: hero.value,
                    total: total,
                    image: hero.image,
                    meetsThreshold: meetsThreshold
                };
            });

            // Separate into two groups and sort each by total descending
            const enemyMeetsThreshold = enemyHeroesWithMetrics
                .filter(h => h.meetsThreshold)
                .sort((a, b) => b.total - a.total);

            const enemyBelowThreshold = enemyHeroesWithMetrics
                .filter(h => !h.meetsThreshold)
                .sort((a, b) => b.total - a.total);

            recommendations[pos.id] = {
                ally: {
                    meetsThreshold: allyMeetsThreshold,
                    belowThreshold: allyBelowThreshold
                },
                enemy: {
                    meetsThreshold: enemyMeetsThreshold,
                    belowThreshold: enemyBelowThreshold
                }
            };
        });

        return recommendations;
    }, [availableHeroes, data, bracket, bracketGroup, allyPicks, enemyPicks, heroPickRateThreshold, positionPickRateThreshold]);

    // Helper function to get initials from hero name
    const getHeroInitials = (heroName) => {
        // Special cases for single-word heroes that should be treated as compound words
        const specialCases = {
            'Broodmother': 'bm',
            'Dawnbreaker': 'db',
            'Lifestealer': 'ls',
            'Earthshaker': 'es',
            'Clockwerk': 'cw',
            'Windranger': 'wr',
            'Underlord': 'ul',
            'Bloodseeker': 'bs',
            'Hoodwink': 'hw',
            'Terrorblade': 'tb',
            'Bristleback': 'bb',
            'Beastmaster': 'bm'
        };

        // Check if hero has a special case mapping
        if (specialCases[heroName]) {
            return specialCases[heroName];
        }

        // Split by space, hyphen, or capital letters in the middle of words
        const words = heroName
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase: "AntiMage" -> "Anti Mage"
            .split(/[\s-]+/); // Split by space or hyphen

        return words
            .map(word => word.charAt(0).toLowerCase())
            .join('');
    };

    // Helper function to check if hero matches filter
    const heroMatchesFilter = (heroName, filterText) => {
        const lowerHeroName = heroName.toLowerCase();
        const lowerFilter = filterText.toLowerCase();

        // Check if name includes the filter text
        if (lowerHeroName.includes(lowerFilter)) {
            return true;
        }

        // Check if initials match the filter text
        const initials = getHeroInitials(heroName);
        if (initials.includes(lowerFilter)) {
            return true;
        }

        return false;
    };

    // Render hero recommendations for a position
    const renderPositionRecommendations = (position, isAlly) => {
        const recData = getHeroRecommendations[position]?.[isAlly ? 'ally' : 'enemy'];
        const filters = isAlly ? allyFilters : enemyFilters;
        const setFilters = isAlly ? setAllyFilters : setEnemyFilters;
        const filterText = (filters[position] || '').toLowerCase();

        if (!recData) {
            return (
                <div key={position} className="position-recommendation-column">
                    <div className="no-recommendations">All picked</div>
                </div>
            );
        }

        let meetsThreshold = recData.meetsThreshold || [];
        let belowThreshold = recData.belowThreshold || [];

        // Apply filter if there's text
        if (filterText) {
            meetsThreshold = meetsThreshold.filter(rec =>
                heroMatchesFilter(rec.heroName, filterText)
            );
            belowThreshold = belowThreshold.filter(rec =>
                heroMatchesFilter(rec.heroName, filterText)
            );
        }

        const handleFilterChange = (e) => {
            const newValue = e.target.value;
            setFilters(prev => ({
                ...prev,
                [position]: newValue
            }));
        };

        const renderHeroItem = (rec, isGreyedOut = false) => {
            let imageSrc;
            try {
                const imageName = rec.image.substring(rec.image.lastIndexOf('/') + 1);
                imageSrc = require(`./img/heroes/${imageName}`);
            } catch (e) {
                return null;
            }

            return (
                <div
                    key={rec.heroName}
                    className={`recommendation-item ${isGreyedOut ? 'below-threshold' : ''}`}
                    draggable
                    onDragStart={(e) => {
                        const dragData = {
                            heroName: rec.heroName,
                            type: 'hero'
                        };
                        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                        e.dataTransfer.effectAllowed = 'move';
                    }}
                >
                    <img src={imageSrc} alt={rec.heroName} className="recommendation-hero-img" />
                    <span className={`recommendation-value ${getValueClass(rec.total)}`}>
                        {formatValue(rec.total)}
                    </span>
                </div>
            );
        };

        const totalHeroes = meetsThreshold.length + belowThreshold.length;

        return (
            <div key={position} className="position-recommendation-column">
                <input
                    type="text"
                    className="position-filter-input"
                    placeholder="Filter..."
                    value={filters[position] || ''}
                    onChange={handleFilterChange}
                />
                {totalHeroes === 0 ? (
                    <div className="no-recommendations">
                        {filterText ? 'No matches' : 'All picked'}
                    </div>
                ) : (
                    <>
                        {meetsThreshold.map(rec => renderHeroItem(rec, false))}
                        {belowThreshold.map(rec => renderHeroItem(rec, true))}
                    </>
                )}
            </div>
        );
    };

    // Render a single metric row across all positions
    const renderMetricRow = (metricType, picks, isAlly, teamTotal) => {
        return (
            <div className="metric-row">
                <div className="metric-label-cell">{metricType}</div>
                {POSITIONS.map(pos => {
                    const pick = picks.find(p => p.position === pos.id);
                    const heroName = pick?.heroName;

                    if (!heroName) {
                        return <div key={pos.id} className="metric-value-cell">-</div>;
                    }

                    const metrics = calculateHeroMetrics(heroName, pos.id, isAlly);
                    let value;
                    switch(metricType) {
                        case 'Win%':
                            value = metrics.winRate;
                            break;
                        case 'Syn':
                            value = metrics.synergy;
                            break;
                        case 'Cnt':
                            value = metrics.counter;
                            break;
                        case 'Total':
                            value = metrics.total;
                            break;
                        default:
                            value = 0;
                    }

                    return (
                        <div key={pos.id} className={`metric-value-cell ${getValueClass(value)}`}>
                            {formatValue(value)}
                        </div>
                    );
                })}
                <div className={`metric-value-cell team-total ${getValueClass(teamTotal)}`}>
                    {formatValue(teamTotal)}
                </div>
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
                <div className="header-left">
                    <h1>Draft Analysis</h1>
                    <BracketSelector
                        selectedBracket={bracket}
                        onBracketChange={handleBracketChange}
                    />
                </div>
                <div className="header-right">
                    <PickRateFilter
                        heroPickRate={heroPickRateThreshold}
                        positionPickRate={positionPickRateThreshold}
                        onHeroPickRateChange={handleHeroPickRateChange}
                        onPositionPickRateChange={handlePositionPickRateChange}
                    />
                </div>
            </div>

            <div className="analysis-content">
                <div className="teams-container">
                    {/* Ally Team */}
                    <div className="team-section ally">
                        <div className="team-title-container">
                            <h2 className="team-title">Ally Team</h2>
                            <div className="team-total-display">
                                {teamTotals.ally.total > teamTotals.enemy.total && (
                                    <span className="team-differential positive">
                                        {formatValue(teamTotals.ally.total - teamTotals.enemy.total)}
                                    </span>
                                )}
                                <span className={`team-total-value ${getValueClass(teamTotals.ally.total)}`}>
                                    {formatValue(teamTotals.ally.total)}
                                </span>
                            </div>
                        </div>
                        <div className="team-content">
                            <PositionTeamCell
                                teamId="ally"
                                initialPicks={allyPicks}
                                onPicksChange={handleAllyPicksChange}
                                otherTeamPicks={enemyPicks}
                                allAvailableHeroes={HERO_OPTIONS}
                            />
                            <div className="position-recommendations-container">
                                {POSITIONS.map(pos => renderPositionRecommendations(pos.id, true))}
                            </div>
                            <div className="team-metrics">
                                {renderMetricRow('Win%', allyPicks, true, teamTotals.ally.winRate)}
                                {renderMetricRow('Syn', allyPicks, true, teamTotals.ally.synergy)}
                                {renderMetricRow('Cnt', allyPicks, true, teamTotals.ally.counter)}
                                {renderMetricRow('Total', allyPicks, true, teamTotals.ally.total)}
                            </div>
                        </div>
                    </div>

                    {/* Enemy Team */}
                    <div className="team-section enemy">
                        <div className="team-title-container">
                            <h2 className="team-title">Enemy Team</h2>
                            <div className="team-total-display">
                                <span className={`team-total-value ${getValueClass(teamTotals.enemy.total)}`}>
                                    {formatValue(teamTotals.enemy.total)}
                                </span>
                                {teamTotals.enemy.total > teamTotals.ally.total && (
                                    <span className="team-differential positive">
                                        {formatValue(teamTotals.enemy.total - teamTotals.ally.total)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="team-content">
                            <PositionTeamCell
                                teamId="enemy"
                                initialPicks={enemyPicks}
                                onPicksChange={handleEnemyPicksChange}
                                otherTeamPicks={allyPicks}
                                allAvailableHeroes={HERO_OPTIONS}
                            />
                            <div className="position-recommendations-container">
                                {POSITIONS.map(pos => renderPositionRecommendations(pos.id, false))}
                            </div>
                            <div className="team-metrics">
                                {renderMetricRow('Win%', enemyPicks, false, teamTotals.enemy.winRate)}
                                {renderMetricRow('Syn', enemyPicks, false, teamTotals.enemy.synergy)}
                                {renderMetricRow('Cnt', enemyPicks, false, teamTotals.enemy.counter)}
                                {renderMetricRow('Total', enemyPicks, false, teamTotals.enemy.total)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StratzAnalysis;
