import React from 'react';
import { HERO_OPTIONS } from '../constants/heroes';
import './heroCell.css';

export const HeroCell = ({ heroName, onRemove, isSmall }) => {
  const hero = HERO_OPTIONS.find(option => option.value === heroName);
  const cellClassName = isSmall ? 'hero-cell-small' : 'hero-cell';

  if (!hero || !hero.image) {
    // console.warn(`Hero or hero image not found for: ${heroName}`);
    // Use a consistent error class name structure based on cellClassName
    return <div className={`${cellClassName.replace('-small', '')}-error`} title={`Hero not found: ${heroName}`}>?</div>;
  }

  let imageSrc;
  try {
    // hero.image is like "src/img/heroes/alchemist.png"
    // We need to extract "alchemist.png" for the require statement
    const imageName = hero.image.substring(hero.image.lastIndexOf('/') + 1);
    // This require path is relative from src/component/ to src/img/heroes/
    imageSrc = require(`../img/heroes/${imageName}`);
  } catch (e) {
    console.error(`Error loading image for hero: ${heroName} (path: ${hero.image})`, e);
    return <div className={`${cellClassName.replace('-small', '')}-error`} title={`Image load error: ${heroName}`}>!</div>;
  }

  const handleDragStart = (event) => {
    const dragData = {
      heroName: hero.value,
      type: 'hero',
      // Add origin information if it's a small cell (likely from a TeamCell)
      isSmallOrigin: !!isSmall 
    };
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
    if (event.currentTarget.style) {
        event.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleDragEnd = (event) => {
    if (event.currentTarget.style) {
        event.currentTarget.style.cursor = 'grab';
    }
    // More complex drag-away logic could be added here if needed,
    // for example, if event.dataTransfer.dropEffect === 'none' and dragData.isSmallOrigin
    // and onRemove is present, then call onRemove(heroName).
    // However, this can be tricky to get right with user intent (e.g. cancelled drag).
    // The 'X' button is a more direct removal method for now.
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation(); // Prevent any parent click handlers
    if (onRemove) {
      onRemove(heroName);
    }
  };

  return (
    <div
      className={cellClassName} // Apply hero-cell or hero-cell-small
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={hero.label}
    >
      {isSmall && onRemove && (
        <button className="remove-hero-button" onClick={handleRemoveClick} title={`Remove ${hero.label}`}>
          &times;
        </button>
      )}
      <img
        src={imageSrc.default || imageSrc} // Handles ES modules from require
        alt={hero.label}
        // Image styling is primarily in heroCell.css
      />
    </div>
  );
};

export default HeroCell;
