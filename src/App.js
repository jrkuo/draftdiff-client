import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import DualSelectTable from './SelectTable';
import HeroCell from './component/heroCell';
import { useState } from 'react';
import { HERO_OPTIONS } from './constants/heroes';

const HERO_NAMES = HERO_OPTIONS.map(option => option.value);

function App() {
  const [filter, setFilter] = useState('');
  const [currentMode, setCurrentMode] = useState('diff'); // 'diff' or 'game'

  const toggleMode = () => {
    setCurrentMode(prevMode => prevMode === 'diff' ? 'game' : 'diff');
  };

  const filteredHeroes = HERO_NAMES.filter(name =>
    name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Router>
      <div className="AppLayout">
        {/* Sidebar */}
        <div className="Sidebar">
          <div className="ModeToggleContainer" style={{ marginBottom: '10px', padding: '5px' }}>
            <button
              onClick={toggleMode}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: currentMode === 'diff' ? '#007bff' : '#28a745', // Blue for Diff, Green for Game
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                transition: 'background-color 0.3s ease'
              }}
            >
              {currentMode === 'diff' ? 'Draft Diff' : 'Draft Game'}
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
          {currentMode === 'diff' ? (
            <div className="DualSelectScrollable">
              <DualSelectTable />
            </div>
          ) : (
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
