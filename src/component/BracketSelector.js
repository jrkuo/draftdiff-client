import React from 'react';
import { BRACKETS, DEFAULT_BRACKET } from '../types/stratzTypes';
import './BracketSelector.css';

/**
 * Dropdown selector for Dota 2 rank brackets
 *
 * @param {Object} props
 * @param {string} props.selectedBracket - Currently selected bracket
 * @param {function} props.onBracketChange - Callback when bracket changes
 */
const BracketSelector = ({ selectedBracket = DEFAULT_BRACKET, onBracketChange }) => {
    const handleChange = (e) => {
        onBracketChange(e.target.value);
    };

    return (
        <div className="bracket-selector-container">
            <label htmlFor="bracket-select" className="bracket-label">
                Rank Bracket:
            </label>
            <select
                id="bracket-select"
                className="bracket-select"
                value={selectedBracket}
                onChange={handleChange}
            >
                {BRACKETS.map(bracket => (
                    <option key={bracket} value={bracket}>
                        {bracket}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default BracketSelector;
