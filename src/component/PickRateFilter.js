import React from 'react';
import { PICK_RATE_THRESHOLDS } from '../types/stratzTypes';
import './PickRateFilter.css';

/**
 * Component for filtering heroes by pick rate thresholds
 * @param {number} heroPickRate - Current hero pick rate threshold
 * @param {number} positionPickRate - Current position pick rate threshold
 * @param {function} onHeroPickRateChange - Callback when hero pick rate changes
 * @param {function} onPositionPickRateChange - Callback when position pick rate changes
 */
const PickRateFilter = ({
    heroPickRate,
    positionPickRate,
    onHeroPickRateChange,
    onPositionPickRateChange
}) => {
    return (
        <div className="pick-rate-filter-container">
            <div className="pick-rate-filter-item">
                <label htmlFor="hero-pick-rate" className="filter-label">
                    Hero Pick Rate ≥
                </label>
                <select
                    id="hero-pick-rate"
                    className="filter-select"
                    value={heroPickRate}
                    onChange={(e) => onHeroPickRateChange(parseFloat(e.target.value))}
                >
                    {PICK_RATE_THRESHOLDS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="pick-rate-filter-item">
                <label htmlFor="position-pick-rate" className="filter-label">
                    Position Pick Rate ≥
                </label>
                <select
                    id="position-pick-rate"
                    className="filter-select"
                    value={positionPickRate}
                    onChange={(e) => onPositionPickRateChange(parseFloat(e.target.value))}
                >
                    {PICK_RATE_THRESHOLDS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default PickRateFilter;
