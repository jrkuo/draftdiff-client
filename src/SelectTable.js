import { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { useSearchParams } from 'react-router-dom';
import { HERO_OPTIONS as ALL_HERO_OPTIONS, HERO_COLUMNS as allColumns } from './constants/heroes';
import { useHeroData } from './hooks/useHeroData';
import TeamCell from './component/TeamCell';
import ComfortZone from './component/ComfortZone';
import HeroCell from './component/heroCell.js';
import './SelectTable.css';

const MAX_HERO_PICKS = 5;
const NAME_COLUMN_WIDTH = '100px';
const COMFORT_COLUMN_WIDTH = '60px';
const HERO_PICK_COLUMN_WIDTH = '70px';
const TOTAL_COLUMN_WIDTH = '80px';

function updateTableData(selectedItems, ownComfortHeroes, oppositeComfortHeroes, isEnemyTable, setColumns, setData, heroData) {
    const nameColumn = {
        name: 'Hero',
        sortable: true,
        sortField: 'name',
        cell: (row) => <HeroCell heroName={row.name} isSmall={true} />,
        width: NAME_COLUMN_WIDTH,
        minWidth: NAME_COLUMN_WIDTH,
        grow: 0,
    };

    const comfortColumn = {
        name: 'Comfort',
        selector: row => row.comfort || '',
        sortable: true,
        width: COMFORT_COLUMN_WIDTH,
        minWidth: COMFORT_COLUMN_WIDTH,
        grow: 0,
    };

    const grandTotalColumn = {
        name: 'Total',
        sortable: true,
        sortFunction: (a, b) => (b.grandTotal || 0) - (a.grandTotal || 0),
        cell: (row) => {
            const value = row.grandTotal;
            if (typeof value === 'number') {
                const roundedValue = value.toFixed(2);
                if (value > 0) {
                    return <span style={{ color: 'green', fontWeight: 'bold' }}>{roundedValue}</span>;
                } else if (value < 0) {
                    return <span style={{ color: 'red', fontWeight: 'bold' }}>{roundedValue}</span>;
                }
                return roundedValue;
            }
            return '0.00'; 
        },
        width: TOTAL_COLUMN_WIDTH,
        minWidth: TOTAL_COLUMN_WIDTH,
        grow: 0,
    };
    
    const heroPickColumns = [];
    for (let i = 0; i < MAX_HERO_PICKS; i++) {
        const currentSelectedItem = selectedItems[i]; // Will be undefined if i >= selectedItems.length

        heroPickColumns.push({
            name: currentSelectedItem ? currentSelectedItem.value : '',
            cell: (row) => {
                if (currentSelectedItem && row[currentSelectedItem.value] !== undefined) {
                    const value = row[currentSelectedItem.value];
                    if (typeof value === 'number') {
                        const roundedValue = value.toFixed(2);
                        if (value > 0) {
                            return <span style={{ color: 'green', fontWeight: 'bold' }}>{roundedValue}</span>;
                        } else if (value < 0) {
                            return <span style={{ color: 'red', fontWeight: 'bold' }}>{roundedValue}</span>;
                        }
                        return roundedValue;
                    }
                    return value; // Should be '-' or some placeholder if not a number but exists
                }
                return ''; // Empty string for empty cells
            },
            sortable: !!currentSelectedItem,
            sortFunction: currentSelectedItem ? (a, b) => {
                const valA = a[currentSelectedItem.value] || 0;
                const valB = b[currentSelectedItem.value] || 0;
                return valB - valA;
            } : undefined,
            width: HERO_PICK_COLUMN_WIDTH,
            minWidth: HERO_PICK_COLUMN_WIDTH,
            grow: 0,
        });
    }

    setColumns([nameColumn, comfortColumn, ...heroPickColumns, grandTotalColumn]);

    // Data processing logic remains largely the same, driven by actual selectedItems
    if (selectedItems && selectedItems.length > 0 && heroData) {
        const heroMap = {};
        selectedItems.forEach(item => {
            if (heroData[item.value]) {
                heroData[item.value].forEach(row => {
                    if (!heroMap[row.name]) {
                        heroMap[row.name] = { name: row.name, grandTotal: 0, comfort: '' };
                    }
                });
            }
        });

        selectedItems.forEach(item => {
            if (heroData[item.value]) {
                heroData[item.value].forEach((row) => {
                    if (heroMap[row.name]) {
                        const value = row.name === item.value ? 0 : row[item.value];
                        heroMap[row.name][item.value] = value;
                        heroMap[row.name].grandTotal = (heroMap[row.name].grandTotal || 0) + value;
                    }
                });
            }
        });

        Object.keys(heroMap).forEach(key => {
            let comfortEmojis = '';
            ownComfortHeroes.forEach(hero => {
                if (key === hero.value) {
                    comfortEmojis += isEnemyTable ? '😈' : '😊';
                }
            });
            oppositeComfortHeroes.forEach(hero => {
                if (key === hero.value) {
                    comfortEmojis += isEnemyTable ? '😊' : '😈';
                }
            });
            heroMap[key].comfort = comfortEmojis;
        });

        const selectedData = Object.values(heroMap);
        selectedData.sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0));

        setData(selectedData);
    } else {
        // When no items are selected, create a list of all heroes with 0 totals
        // And appropriate comfort emojis
        const allHeroesData = ALL_HERO_OPTIONS.map(heroOption => {
            let comfortEmojis = '';
            ownComfortHeroes.forEach(hero => {
                if (heroOption.value === hero.value) {
                    comfortEmojis += isEnemyTable ? '😈' : '😊';
                }
            });
            oppositeComfortHeroes.forEach(hero => {
                if (heroOption.value === hero.value) {
                    comfortEmojis += isEnemyTable ? '😊' : '😈';
                }
            });
            return {
                name: heroOption.value,
                grandTotal: 0,
                comfort: comfortEmojis,
                // Add empty placeholders for the 5 hero pick columns
                ...Array(MAX_HERO_PICKS).fill(null).reduce((acc, _, index) => {
                    // This part is tricky, as heroMap keys are dynamic. 
                    // For empty state, we just need the rows to have some value for these potential columns if DataTable requires it
                    // However, cell renderers will show '' if currentSelectedItem for that column is null.
                    // So, it might be okay to not add explicit keys here.
                    return acc;
                }, {})
            };
        });
        allHeroesData.sort((a,b) => { 
            const comfortA = a.comfort.length;
            const comfortB = b.comfort.length;
            if (comfortB !== comfortA) return comfortB - comfortA;
            return a.name.localeCompare(b.name);
        });
        setData(allHeroesData);
    }
}

function SelectTable({ 
    onComfortSelect,
    ownComfortHeroes,
    oppositeComfortHeroes,
    isEnemyTable,
    urlParam,
    otherTeamPickedHeroes,
    onMainTeamPicksChange
}) {
    const [pickedHeroes, setPickedHeroes] = useState([]);
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: heroData, loading, error } = useHeroData();
    
    const handleTeamCellPicksUpdate = useCallback((newPicks) => {
        setPickedHeroes(newPicks);
        const pickValuesForURL = newPicks.map(item => item.value);
        searchParams.set(`${urlParam}Picks`, pickValuesForURL.join(','));
        setSearchParams(searchParams);
        if (onMainTeamPicksChange) {
            onMainTeamPicksChange(newPicks);
        }
    }, [searchParams, setSearchParams, urlParam, onMainTeamPicksChange]);

    useEffect(() => {
        const comfortValues = ownComfortHeroes.map(item => item.value);
        const currentURLComfort = searchParams.get(`${urlParam}Comfort`) || '';
        const newURLComfort = comfortValues.join(',');
        if (currentURLComfort !== newURLComfort) {
            searchParams.set(`${urlParam}Comfort`, newURLComfort);
            setSearchParams(searchParams);
        }
    }, [ownComfortHeroes, searchParams, setSearchParams, urlParam]);

    useEffect(() => {
        const initialComfortNames = searchParams.get(`${urlParam}Comfort`)?.split(',').filter(Boolean) || [];
        const initialPickNames = searchParams.get(`${urlParam}Picks`)?.split(',').filter(Boolean) || [];

        const initialComfortObjects = initialComfortNames
            .map(name => ALL_HERO_OPTIONS.find(h => h.value === name))
            .filter(Boolean);
        const initialPickObjects = initialPickNames
            .map(name => ALL_HERO_OPTIONS.find(h => h.value === name))
            .filter(Boolean);

        onComfortSelect(initialComfortObjects);
        
        setPickedHeroes(initialPickObjects);
        if (onMainTeamPicksChange) {
            onMainTeamPicksChange(initialPickObjects);
        }
    }, [searchParams, urlParam, onComfortSelect, onMainTeamPicksChange]);

    useEffect(() => {
        // Pass pickedHeroes (which is selectedItems for updateTableData) to the function
        updateTableData(
            pickedHeroes, 
            ownComfortHeroes, 
            oppositeComfortHeroes, 
            isEnemyTable, 
            setColumns, 
            setData, 
            heroData
        );
    }, [heroData, pickedHeroes, ownComfortHeroes, oppositeComfortHeroes, isEnemyTable]); // Added pickedHeroes dependency

    if (loading) {
        return <div>Loading hero data...</div>;
    }

    if (error) {
        return <div>Error loading hero data: {error.message}</div>;
    }
    
    const tableContentMinWiidth = `calc(${NAME_COLUMN_WIDTH} + ${COMFORT_COLUMN_WIDTH} + ${HERO_PICK_COLUMN_WIDTH} * ${MAX_HERO_PICKS} + ${TOTAL_COLUMN_WIDTH})`;
    const teamCellEffectiveWidth = `${MAX_HERO_PICKS * parseInt(HERO_PICK_COLUMN_WIDTH)}px`;

    return (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <ComfortZone 
              zoneId={`${urlParam}-comfort-zone`}
              initialHeroes={ownComfortHeroes}
              onComfortHeroesChange={onComfortSelect}
              allAvailableHeroes={ALL_HERO_OPTIONS}
            />
          </div>
      
          <div style={{ 
              marginTop: '10px', 
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}> 
            <TeamCell 
              teamId={`${urlParam}-team-cell`}
              initialPicks={pickedHeroes}
              onPicksChange={handleTeamCellPicksUpdate}
              otherTeamPicks={otherTeamPickedHeroes || []}
              allAvailableHeroes={ALL_HERO_OPTIONS}
              style={{ width: teamCellEffectiveWidth }}
              // Assuming TeamCell might need to know MAX_HERO_PICKS to limit selections
              // and heroColumnWidth for its internal alignment if it also renders fixed-width slots.
              // maxPicks={MAX_HERO_PICKS} 
              // heroColumnWidth={HERO_PICK_COLUMN_WIDTH}
            />
          </div>
      
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <DataTable
              columns={columns}
              data={data}
              defaultSortFieldId="Total"
              defaultSortAsc={false}
              responsive={false}
              fixedHeader
              persistTableHead
              style={{ minWidth: tableContentMinWiidth }}
            />
          </div>
        </div>
      );
    }

function DualSelectTable() {
    const [enemyComfortHeroes, setEnemyComfortHeroes] = useState([]);
    const [allyComfortHeroes, setAllyComfortHeroes] = useState([]);
    const [enemyNotes, setEnemyNotes] = useState('');
    const [allyNotes, setAllyNotes] = useState('');

    const [enemyPickedHeroes, setEnemyPickedHeroes] = useState([]);
    const [allyPickedHeroes, setAllyPickedHeroes] = useState([]);

    const handleEnemyPicksChange = useCallback((newPicks) => {
        setEnemyPickedHeroes(newPicks);
    }, []);

    const handleAllyPicksChange = useCallback((newPicks) => {
        setAllyPickedHeroes(newPicks);
    }, []);

    return (
        <div style={{ display: 'flex', width: '100%'}}>
          {/* Ally Team */}
          <div style={{ flex: '1 0 0', minWidth: 0, paddingRight: '10px', boxSizing: 'border-box' }}>

            <h2>Ally Team Picks</h2>
            <textarea 
              value={allyNotes} 
              onChange={(e) => setAllyNotes(e.target.value)} 
              placeholder="Write notes for Ally Team..." 
              style={{ width: '99%', marginBottom: '10px' }} 
            />
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <SelectTable 
                onComfortSelect={setAllyComfortHeroes}
                ownComfortHeroes={allyComfortHeroes}
                oppositeComfortHeroes={enemyComfortHeroes}
                isEnemyTable={false}
                urlParam="ally"
                otherTeamPickedHeroes={enemyPickedHeroes.map(h => h.value)}
                onMainTeamPicksChange={handleAllyPicksChange}
              />
            </div>
          </div>
      
          {/* Enemy Team */}
          <div style={{ flex: '1 0 0', minWidth: 0, paddingLeft: '10px', boxSizing: 'border-box' }}>

            <h2>Enemy Team Picks</h2>
            <textarea 
              value={enemyNotes} 
              onChange={(e) => setEnemyNotes(e.target.value)} 
              placeholder="Write notes for Enemy Team..." 
              style={{ width: '99%', marginBottom: '10px' }} 
            />
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <SelectTable 
                onComfortSelect={setEnemyComfortHeroes}
                ownComfortHeroes={enemyComfortHeroes}
                oppositeComfortHeroes={allyComfortHeroes}
                isEnemyTable={true}
                urlParam="enemy"
                otherTeamPickedHeroes={allyPickedHeroes.map(h => h.value)}
                onMainTeamPicksChange={handleEnemyPicksChange}
              />
            </div>
          </div>
        </div>
      );
      
      
}

export default DualSelectTable;