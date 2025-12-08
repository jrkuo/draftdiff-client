import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import DualSelectTable from './SelectTable';
import StratzAnalysis from './StratzAnalysis';
import HeroCell from './component/heroCell';
import { useState } from 'react';
import { HERO_OPTIONS } from './constants/heroes';

const HERO_NAMES = HERO_OPTIONS.map(option => option.value);

const MODES = ['diff', 'diff2', 'game'];
const MODE_LABELS = {
  diff: 'Draft Diff',
  diff2: 'Draft Diff 2',
  game: 'Draft Game'
};
const MODE_COLORS = {
  diff: '#007bff',   // Blue
  diff2: '#9c27b0',  // Purple
  game: '#28a745'    // Green
};

function App() {
  const [filter, setFilter] = useState('');
  const [currentMode, setCurrentMode] = useState('diff2'); // 'diff', 'diff2', or 'game'

  const cycleMode = () => {
    setCurrentMode(prevMode => {
      const currentIndex = MODES.indexOf(prevMode);
      const nextIndex = (currentIndex + 1) % MODES.length;
      return MODES[nextIndex];
    });
  };

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

  const filteredHeroes = HERO_NAMES.filter(name =>
    heroMatchesFilter(name, filter)
  );

  return (
    <Router>
      <div className="AppLayout">
        {/* Sidebar */}
        <div className="Sidebar">
          <div className="ModeToggleContainer" style={{ marginBottom: '10px', padding: '5px' }}>
            <button
              onClick={cycleMode}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: MODE_COLORS[currentMode],
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                transition: 'background-color 0.3s ease'
              }}
            >
              {MODE_LABELS[currentMode]}
            </button>
          </div>
          <input
            className="FilterInput"
            type="text"
            placeholder="Filter heroes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="HeroList">
            {filteredHeroes.map(hero => (
              <HeroCell key={hero} heroName={hero} />
            ))}
          </div>
        </div>

        <div className="MainContent">
          {currentMode === 'diff' && (
            <div className="DualSelectScrollable">
              <DualSelectTable />
            </div>
          )}
          {currentMode === 'diff2' && (
            <StratzAnalysis />
          )}
          {currentMode === 'game' && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#333' }}>
              <h1>Draft Game Mode</h1>
              <p style={{ fontSize: '18px' }}>Content for Draft Game mode will be implemented here.</p>
            </div>
          )}
        </div>


      </div>
    </Router>
  );
}

export default App;
