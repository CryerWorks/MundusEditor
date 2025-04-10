import React from 'react';
import { CountryCode } from '../types';
import '../styles/Header.css';

interface HeaderProps {
    selectedDatabase: CountryCode;
    onDatabaseChange: (database: CountryCode) => void;
}

const Header: React.FC<HeaderProps> = ({
    selectedDatabase,
    onDatabaseChange
}) => {
    const databases: { code: CountryCode; name: string }[] = [
        { code: 'SWE', name: 'Swedish News' },
        { code: 'DEN', name: 'Danish News' },
        { code: 'FIN', name: 'Finnish News' },
        { code: 'POL', name: 'Polish News' }
    ];

    return (
        <header className="app-header">
            <div className="header-content">
                <h1>Mundus Editor</h1>
                <div className="database-selector">
                    <label>Database:</label>
                    <select 
                        value={selectedDatabase}
                        onChange={(e) => onDatabaseChange(e.target.value as CountryCode)}
                    >
                        {databases.map(db => (
                            <option key={db.code} value={db.code}>
                                {db.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </header>
    );
};

export default Header; 