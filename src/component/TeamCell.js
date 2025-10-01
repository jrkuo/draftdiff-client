import React, { useState, useEffect, useCallback } from 'react';
import HeroCell from './heroCell';
import './TeamCell.css';

const MAX_HEROES = 5;

const TeamCell = ({
  teamId, // e.g., 'ally' or 'enemy',
  initialPicks = [], // Array of hero names { value: string, label: string, image: string }
  onPicksChange, // (newPicks: Array<{value: string, label: string, image: string}>) => void
  otherTeamPicks = [], // Array of hero names (strings) from the other team
  allAvailableHeroes = [] // HERO_OPTIONS from constants, used to get full hero object
}) => {
  const [slots, setSlots] = useState(Array(MAX_HEROES).fill(null));

  useEffect(() => {
    const newSlots = Array(MAX_HEROES).fill(null);
    initialPicks.slice(0, MAX_HEROES).forEach((hero, index) => {
      // Ensure we store the full hero object or at least the name for HeroCell
      newSlots[index] = typeof hero === 'string' ? hero : hero.value;
    });
    setSlots(newSlots);
  }, [initialPicks]);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    // Optionally, add a class to the drop target for visual feedback
    if (event.currentTarget.classList.contains('empty')) {
      event.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (event) => {
    if (event.currentTarget.classList.contains('empty')) {
      event.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (event, slotIndex) => {
    event.preventDefault();
    if (event.currentTarget.classList.contains('empty')) {
      event.currentTarget.classList.remove('drag-over');
    }

    let droppedItemData;
    try {
      droppedItemData = JSON.parse(event.dataTransfer.getData('application/json'));
    } catch (e) {
      console.error("Failed to parse dropped data:", e);
      return;
    }

    if (droppedItemData && droppedItemData.type === 'hero') {
      const heroName = droppedItemData.heroName;

      if (slots.includes(heroName)) {
        console.warn(`${heroName} is already in this team.`);
        return;
      }
      if (otherTeamPicks.map(h => typeof h === 'string' ? h : h.value).includes(heroName)) {
        console.warn(`${heroName} is already in the other team.`);
        return;
      }

      const newSlots = [...slots];
      let targetSlot = slotIndex;

      // If the target slot is filled, try to find the first empty slot
      if (newSlots[targetSlot] !== null) {
        const emptyIndex = newSlots.findIndex(slot => slot === null);
        if (emptyIndex !== -1) {
          targetSlot = emptyIndex;
        } else {
          console.warn('Team is full. Cannot add '+ heroName);
          return; // No empty slot available
        }
      }
      
      newSlots[targetSlot] = heroName; // Store hero name
      setSlots(newSlots);

      // Find full hero objects for onPicksChange
      const newPicksFullObjects = newSlots
        .filter(Boolean)
        .map(name => allAvailableHeroes.find(h => h.value === name))
        .filter(Boolean); // Ensure no undefined objects if a name wasn't found (should not happen)
      
      onPicksChange(newPicksFullObjects);
    }
  };

  const handleRemoveHero = useCallback((heroNameToRemove) => {
    const newSlots = slots.map(slot => (slot === heroNameToRemove ? null : slot));
    setSlots(newSlots);
    const newPicksFullObjects = newSlots
      .filter(Boolean)
      .map(name => allAvailableHeroes.find(h => h.value === name))
      .filter(Boolean);
    onPicksChange(newPicksFullObjects);
  }, [slots, onPicksChange, allAvailableHeroes]);

  return (
    <div className={`team-cell-container ${teamId || ''}`}>
      {slots.map((heroName, index) => (
        <div
          key={index}
          className={`team-slot ${heroName ? 'filled' : 'empty'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave} // Remove highlight when not dragging over anymore
          onDrop={(e) => handleDrop(e, index)}
        >
          {heroName ? (
            <HeroCell 
              heroName={heroName} 
              onRemove={() => handleRemoveHero(heroName)} 
              isSmall={true}
            />
          ) : (
            <div className="empty-slot-placeholder">Drop Hero</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TeamCell; 