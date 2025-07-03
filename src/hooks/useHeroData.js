import { useState, useEffect } from 'react';
import { loadGzippedData } from '../utils/s3DataLoader';
import { HERO_DATA_CONFIG } from '../types/heroTypes';

export function useHeroData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchHeroData() {
            try {
                console.log('Starting to fetch hero data from:', HERO_DATA_CONFIG.bucketUrl);
                setLoading(true);

                const heroData = await loadGzippedData(HERO_DATA_CONFIG);

                console.log('Successfully loaded hero data:', Object.keys(heroData).length, 'heroes');
                setData(heroData);
                setError(null);
            } catch (err) {
                console.error('Failed to load hero data:', err);
                setError(err instanceof Error ? err : new Error('Failed to load hero data'));
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        fetchHeroData();
    }, []);

    return { data, loading, error };
}
