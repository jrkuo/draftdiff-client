import React, { useState, useEffect, useCallback } from 'react';
import HeroCell from './heroCell';
import { POSITIONS } from '../types/stratzTypes';
import './PositionTeamCell.css';

/**
 * Position-based team cell component with labeled slots (Pos 1-5)
 * Each slot corresponds to a specific Dota 2 position
 *
 * @param {Object} props
 * @param {string} props.teamId - Team identifier ('ally' or 'enemy')
 * @param {Array<{heroName: string, position: number}>} props.initialPicks - Initial hero picks with positions
 * @param {function} props.onPicksChange - Callback when picks change
 * @param {Array} props.otherTeamPicks - Picks from the other team (to prevent duplicates)
 * @param {Array} props.allAvailableHeroes - All available hero options
 */
const PositionTeamCell = ({
    teamId,
    initialPicks = [],
    onPicksChange,
    otherTeamPicks = [],
    allAvailableHeroes = []
}) => {
    // Slots indexed by position (1-5), storing hero name or null
    const [slots, setSlots] = useState({
        1: null,
        2: null,
        3: null,
        4: null,
        5: null
    });

    // Initialize slots from initialPicks
    useEffect(() => {
        const newSlots = { 1: null, 2: null, 3: null, 4: null, 5: null };
        initialPicks.forEach(pick => {
            if (pick.position >= 1 && pick.position <= 5 && pick.heroName) {
                newSlots[pick.position] = pick.heroName;
            }
        });
        setSlots(newSlots);
    }, [initialPicks]);

    const handleDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (event) => {
        event.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (event, position) => {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');

        let droppedItemData;
        try {
            droppedItemData = JSON.parse(event.dataTransfer.getData('application/json'));
        } catch (e) {
            console.error("Failed to parse dropped data:", e);
            return;
        }

        if (droppedItemData && droppedItemData.type === 'hero') {
            const heroName = droppedItemData.heroName;

            // Check if hero is already in this team (any position)
            if (Object.values(slots).includes(heroName)) {
                console.warn(`${heroName} is already in this team.`);
                return;
            }

            // Check if hero is in the other team
            const otherTeamHeroNames = otherTeamPicks.map(h =>
                typeof h === 'string' ? h : (h.heroName || h.value)
            );
            if (otherTeamHeroNames.includes(heroName)) {
                console.warn(`${heroName} is already in the other team.`);
                return;
            }

            const newSlots = { ...slots };

            // If the target position is filled, try to find an empty position
            if (newSlots[position] !== null) {
                const emptyPosition = POSITIONS.find(p => newSlots[p.id] === null);
                if (emptyPosition) {
                    newSlots[emptyPosition.id] = heroName;
                } else {
                    console.warn('Team is full. Cannot add ' + heroName);
                    return;
                }
            } else {
                newSlots[position] = heroName;
            }

            setSlots(newSlots);
            notifyPicksChange(newSlots);
        }
    };

    const notifyPicksChange = useCallback((currentSlots) => {
        // Convert slots object to array of { heroName, position } objects
        const picks = POSITIONS
            .filter(pos => currentSlots[pos.id])
            .map(pos => ({
                heroName: currentSlots[pos.id],
                position: pos.id,
                // Include full hero object if needed
                heroObject: allAvailableHeroes.find(h => h.value === currentSlots[pos.id])
            }));

        onPicksChange(picks);
    }, [allAvailableHeroes, onPicksChange]);

    const handleRemoveHero = useCallback((position) => {
        setSlots(prevSlots => {
            const newSlots = { ...prevSlots };
            newSlots[position] = null;
            notifyPicksChange(newSlots);
            return newSlots;
        });
    }, [notifyPicksChange]);

    return (
        <div className={`position-team-cell-container ${teamId || ''}`}>
            {POSITIONS.map(pos => (
                <div
                    key={pos.id}
                    className={`position-slot ${slots[pos.id] ? 'filled' : 'empty'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, pos.id)}
                >
                    <div className="position-label">{pos.label}</div>
                    <div className="position-hero-area">
                        {slots[pos.id] ? (
                            <HeroCell
                                heroName={slots[pos.id]}
                                onRemove={() => handleRemoveHero(pos.id)}
                                isSmall={true}
                            />
                        ) : (
                            <div className="empty-position-placeholder">
                                Drop Hero
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PositionTeamCell;
