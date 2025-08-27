import React, { useState, useEffect } from 'react';

export function GemSettingsComponent() {
    const [selectedBuild, setSelectedBuild] = useState('');
    const [allBuildNames, setAllBuildNames] = useState<string[]>([]);

    const setBuildDropdownSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBuild(event.target.value);
    };

    // Get initial state for gem dropdown
    useEffect(() => {
        //@ts-ignore
        window.electron.getGemSettingsState().then((build) => {
            setSelectedBuild(build.buildName);
            setAllBuildNames(build.allBuildNames);
        });
    }, []);

    // Subscribe to gem setup updates 

    const handleGemDropdownSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // Post the change to main process and await
        //@ts-ignore
        window.electron.postBuildSelected(event.target.value).then((buildName) => {
            setSelectedBuild(buildName);
        });

        // Update the dropdown selection
        setSelectedBuild(event.target.value);
    }
    
    return (
        <div className="GemSettingsComponent">
            <h3>Gems Settings</h3>
            <label htmlFor="build-select">Select Build:</label>
            <select
                id="build-select"
                value={selectedBuild}
                onChange={handleGemDropdownSelection}
                style={{ marginLeft: '12px', marginBottom: '16px' }}
            >
                {allBuildNames.map((buildName) => (
                    <option key={buildName} value={buildName}>
                        {buildName}
                    </option>
                ))}
            </select>
            {/* Render data relevant to selectedBuild here */}
        </div>
    );
}