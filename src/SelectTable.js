import Select from 'react-select';
import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { useSearchParams } from 'react-router-dom';
import { HERO_OPTIONS as options, HERO_COLUMNS as allColumns } from './constants/heroes';
import { useHeroData } from './hooks/useHeroData';

function updateTableData(selectedItems, ownComfortHeroes, oppositeComfortHeroes, isEnemyTable, setColumns, setData, heroData) {
    const nameColumn = {
        name: 'Counter',
        selector: row => row.name,
        sortable: true,
    };

    const comfortColumn = {
        name: 'Comfort',
        selector: row => row.comfort || '', // Add comfort emoji if available
        sortable: true,
    };

    const grandTotalColumn = {
        name: 'Grand Total',
        selector: row => row.grandTotal?.toFixed(3) || '0.000', // Round to 3 decimal places, fallback to 0
        sortable: true,
        sortFunction: (a, b) => b.grandTotal - a.grandTotal // Custom sorting function
    };
    
    // Ensure that these base columns are always present
    let selectedColumns = [nameColumn, comfortColumn, grandTotalColumn];

    if (selectedItems.length > 0) {
        // Filter out any undefined columns before adding them to selectedColumns
        const heroColumns = selectedItems
            .map(item => allColumns[item.value])
            .filter(column => column !== undefined);

        selectedColumns = [nameColumn, comfortColumn, ...heroColumns, grandTotalColumn];
    }

    setColumns(selectedColumns);

    if (selectedItems.length > 0 && heroData) {
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
                    comfortEmojis += isEnemyTable ? '😈' : '😊'; // Own comfort emoji
                }
            });
            oppositeComfortHeroes.forEach(hero => {
                if (key === hero.value) {
                    comfortEmojis += isEnemyTable ? '😊' : '😈'; // Opposite comfort emoji
                }
            });
            heroMap[key].comfort = comfortEmojis; // Assign the concatenated emojis to the comfort column
        });

        const selectedData = Object.values(heroMap);
        selectedData.sort((a, b) => b.grandTotal - a.grandTotal);

        setData(selectedData);
    } else {
        setData([]);
    }
}

function SelectTable({ onComfortSelect, ownComfortHeroes, oppositeComfortHeroes, isEnemyTable, urlParam }) {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: heroData, loading, error } = useHeroData();
    
    useEffect(() => {
        // Initialize selected options from URL parameters
        const initialComfort = searchParams.get(`${urlParam}Comfort`)?.split(',') || [];
        const initialPicks = searchParams.get(`${urlParam}Picks`)?.split(',') || [];

        // Map the values to the format expected by the Select component
        const initialComfortOptions = initialComfort
            .filter(Boolean)
            .map(value => ({ value, label: value }));
        const initialPickOptions = initialPicks
            .filter(Boolean)
            .map(value => ({ value, label: value }));

        // Set the initial values for the selects
        onComfortSelect(initialComfortOptions);
        setSelectedOptions(initialPickOptions);
    }, [searchParams, onComfortSelect, urlParam]);

    useEffect(() => {
        if (heroData) {
            updateTableData(
                selectedOptions,
                ownComfortHeroes,
                oppositeComfortHeroes,
                isEnemyTable,
                setColumns,
                setData,
                heroData
            );
        }
    }, [heroData, ownComfortHeroes, oppositeComfortHeroes, selectedOptions, isEnemyTable]);

    if (loading) {
        return <div>Loading hero data...</div>;
    }

    if (error) {
        return <div>Error loading hero data: {error.message}</div>;
    }

    function onSelect(selectedItems) {
        setSelectedOptions(selectedItems);
        const pickValues = selectedItems.map(item => item.value);
        searchParams.set(`${urlParam}Picks`, pickValues.join(','));
        setSearchParams(searchParams);
    }

    return (
        <div className="">
            <div>
                <Select
                    defaultValue={searchParams.get(`${urlParam}Comfort`)?.split(',')
                        .filter(Boolean)
                        .map(value => ({ value, label: value })) || []}
                    isMulti
                    onChange={selectedItems => {
                        onComfortSelect(selectedItems);
                        const comfortValues = selectedItems.map(item => item.value);
                        searchParams.set(`${urlParam}Comfort`, comfortValues.join(','));
                        setSearchParams(searchParams);
                    }}
                    name="comfortSelect"
                    options={options}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Select Comfort Heroes..."
                    filterOption={(candidate, input) => {
                        if (!input) return true;
                        const searchInput = input.toLowerCase();
                        const label = candidate.label.toLowerCase();
                        const words = label.split(' ');
                        const initials = words.length > 1 ? words.map(word => word[0]).join('').toLowerCase() : '';
                        return label.includes(searchInput) || (initials && initials === searchInput);
                    }}
                />
            </div>
            <div>
                <Select
                    defaultValue={searchParams.get(`${urlParam}Picks`)?.split(',')
                        .filter(Boolean)
                        .map(value => ({ value, label: value })) || []}
                    isMulti
                    onChange={onSelect}
                    name="pickSelect"
                    options={options}
                    className="basic-multi-select"
                    classNamePrefix="select" 
                    placeholder="Select Picked Heroes..."
                    filterOption={(candidate, input) => {
                        if (!input) return true;
                        const searchInput = input.toLowerCase();
                        const label = candidate.label.toLowerCase();
                        const words = label.split(' ');
                        const initials = words.length > 1 ? words.map(word => word[0]).join('').toLowerCase() : '';
                        return label.includes(searchInput) || (initials && initials === searchInput);
                    }}
                />
            </div>
            <div>
                <DataTable
                columns={columns}
                data={data}
                defaultSortField="Grand Total" // Sort by Grand Total
                defaultSortAsc={false} // Descending order
                />
            </div>
        </div>
    );
}


function DualSelectTable() {
    const [enemyComfortHeroes, setEnemyComfortHeroes] = useState([]);
    const [allyComfortHeroes, setAllyComfortHeroes] = useState([]);
    const [enemyNotes, setEnemyNotes] = useState('');  // State for enemy notes
    const [allyNotes, setAllyNotes] = useState('');    // State for ally notes

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, marginRight: '10px' }}>
                <h2>Enemy Team Picks</h2>
                <textarea 
                    value={enemyNotes} 
                    onChange={(e) => setEnemyNotes(e.target.value)} 
                    placeholder="Write notes for Enemy Team..." 
                    style={{ width: '100%', marginBottom: '10px' }} 
                />
                <SelectTable 
                    onComfortSelect={setEnemyComfortHeroes} // Affects Enemy table
                    ownComfortHeroes={enemyComfortHeroes} // Enemy comfort affects Enemy table
                    oppositeComfortHeroes={allyComfortHeroes} // Ally comfort affects Enemy table
                    isEnemyTable={true} // Flag to indicate it's the enemy table
                    urlParam="enemy"
                />
            </div>
            <div style={{ flex: 1, marginLeft: '10px' }}>
                <h2>Ally Team Picks</h2>
                <textarea 
                    value={allyNotes} 
                    onChange={(e) => setAllyNotes(e.target.value)} 
                    placeholder="Write notes for Ally Team..." 
                    style={{ width: '100%', marginBottom: '10px' }} 
                />
                <SelectTable 
                    onComfortSelect={setAllyComfortHeroes} // Affects Ally table
                    ownComfortHeroes={allyComfortHeroes} // Ally comfort affects Ally table
                    oppositeComfortHeroes={enemyComfortHeroes} // Enemy comfort affects Ally table
                    isEnemyTable={false} // Flag to indicate it's the ally table
                    urlParam="ally"
                />
            </div>
        </div>
    );
}

export default DualSelectTable;