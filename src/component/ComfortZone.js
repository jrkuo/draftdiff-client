import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeroCell from './heroCell';
import './ComfortZone.css'; // We will create this CSS file next

const ComfortZone = ({
  zoneId,
  initialHeroes = [], // Expects array of full hero objects {value, label, image}
  onComfortHeroesChange, // (newHeroes: Array<{value, label, image}>) => void
  allAvailableHeroes = [] // Full HERO_OPTIONS for lookup
}) => {
  const [comfortHeroes, setComfortHeroes] = useState([]);
  const scrollContainerRef = useRef(null); // Ref for the scrollable container

  useEffect(() => {
    // Ensure initialHeroes are actual hero objects, not just names
    const validInitialHeroes = initialHeroes
      .map(hero => {
        if (typeof hero === 'string') {
          return allAvailableHeroes.find(h => h.value === hero);
        }
        return hero;
      })
      .filter(Boolean); // Remove any undefined if a string name wasn't found
    setComfortHeroes(validInitialHeroes);
  }, [initialHeroes, allAvailableHeroes]);

  // Effect for handling mouse wheel scroll to horizontal scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheelScroll = (event) => {
      if (event.deltaY === 0) return; // Do nothing if no vertical scroll data

      event.preventDefault(); // Prevent default vertical page scroll
      
      // Adjust scrollLeft based on deltaY. deltaY is typically around 100 per scroll notch.
      // A multiplier can adjust sensitivity. Let's use a fairly direct mapping for now.
      container.scrollLeft += event.deltaY;
    };

    container.addEventListener('wheel', handleWheelScroll, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelScroll);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    let droppedItemData;
    try {
      droppedItemData = JSON.parse(event.dataTransfer.getData('application/json'));
    } catch (e) {
      console.error("Failed to parse dropped comfort hero data:", e);
      return;
    }

    if (droppedItemData && droppedItemData.type === 'hero') {
      const heroName = droppedItemData.heroName;
      const heroIsAlreadyInZone = comfortHeroes.some(hero => hero.value === heroName);

      if (heroIsAlreadyInZone) {
        console.warn(`${heroName} is already in this comfort zone.`);
        return;
      }

      const heroObject = allAvailableHeroes.find(h => h.value === heroName);
      if (heroObject) {
        const newComfortHeroes = [...comfortHeroes, heroObject];
        setComfortHeroes(newComfortHeroes);
        if (onComfortHeroesChange) {
          onComfortHeroesChange(newComfortHeroes);
        }
      }
    }
  };

  const handleRemoveHero = useCallback((heroNameToRemove) => {
    const newComfortHeroes = comfortHeroes.filter(hero => hero.value !== heroNameToRemove);
    setComfortHeroes(newComfortHeroes);
    if (onComfortHeroesChange) {
      onComfortHeroesChange(newComfortHeroes);
    }
  }, [comfortHeroes, onComfortHeroesChange]);

  return (
    <div
      id={zoneId}
      ref={scrollContainerRef} // Attach the ref here
      className={`comfort-zone-container ${comfortHeroes.length === 0 ? 'empty-zone' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {comfortHeroes.length > 0 ? (
        comfortHeroes.map(hero => (
          <HeroCell
            key={hero.value} // Hero names should be unique within this list
            heroName={hero.value}
            onRemove={() => handleRemoveHero(hero.value)}
            isSmall={true}
          />
        ))
      ) : (
        <div className="empty-zone-placeholder">Drop Comfort Heroes Here</div>
      )}
    </div>
  );
};

export default ComfortZone; 