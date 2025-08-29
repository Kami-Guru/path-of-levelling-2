import React, { useState, useEffect } from 'react';
import type { Build, GemSetup } from '../../../main/trackers/GemTracker'

export function GemSettingsComponent() {
    const [selectedBuild, setSelectedBuild] = useState('');
    const [allBuildNames, setAllBuildNames] = useState<string[]>([]);
    const [allGemSetups, setallGemSetups] = useState<GemSetup[]>([]);
    const [editableGemSetups, setEditableGemSetups] = useState<GemSetup[]>([]);
    const [addingBuild, setAddingBuild] = useState(false);
    const [newBuildName, setNewBuildName] = useState('');

    // Get initial state for gem dropdown
    useEffect(() => {
        //@ts-ignore
        window.electron.getGemSettingsState().then((response) => {
            if (!response.allBuildNames.includes(response.buildName)) {
                response.buildName = 'Default';
            }

            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);
            setallGemSetups(response.allGemSetups);
            setEditableGemSetups(response.allGemSetups.map((setup: GemSetup) => ({
                ...setup,
                gemLinks: [...setup.gemLinks],
            })));
        });
    }, []);

    const handleGemDropdownSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        if (value === '__add__') {
            setAddingBuild(true);
            setNewBuildName('');
        } else {
            setAddingBuild(false);
            // Post the change to main process and get back the new build selected
            //@ts-ignore
            window.electron.postBuildSelected(event.target.value).then((response) => {
                setSelectedBuild(response.buildName);
                setAllBuildNames(response.allBuildNames);
                setallGemSetups(response.allGemSetups);
                setEditableGemSetups(response.allGemSetups.map((setup: GemSetup) => ({
                    ...setup,
                    gemLinks: [...setup.gemLinks],
                })));
            });
        }
    }

    const handleAddBuild = () => {
        if (!newBuildName.trim() || allBuildNames.includes(newBuildName.trim())) return;
        //@ts-ignore
        window.electron.postAddNewBuild(newBuildName.trim()).then((response) => {
            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);
            setallGemSetups(response.allGemSetups);
            setEditableGemSetups(response.allGemSetups.map((setup: GemSetup) => ({
                ...setup,
                gemLinks: [...setup.gemLinks],
            })));
            setAddingBuild(false);
            setNewBuildName('');
        });
    };

    // Handle edits to level
    const handleLevelChange = (index: number, value: number) => {
        const newSetups = editableGemSetups.map((setup, i) =>
            i === index ? { ...setup, level: value } : setup
        );
        setEditableGemSetups(newSetups);
    };

    // Handle edits to gemLinks
    const handleGemLinksChange = (index: number, value: string) => {
        const linksArray = value.split('\n');
        const newSetups = editableGemSetups.map((setup, i) =>
            i === index ? { ...setup, gemLinks: linksArray } : setup
        );
        setEditableGemSetups(newSetups);
    };

    // Save handler for the banner button
    const handleSave = () => {
        const response = {
            buildName: selectedBuild,
            allGemSetups: editableGemSetups,
        };

        // Send updated gem setups and reload
        //@ts-ignore
        window.electron.saveGemSetupsForBuild(response).then((response) => {
            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);
            setallGemSetups(response.allGemSetups);
            setEditableGemSetups(response.allGemSetups.map((setup: GemSetup) => ({
                ...setup,
                gemLinks: [...setup.gemLinks],
            })));
        });
    };
    
    return (
        <div className="GemSettingsComponent">
            <h3>Gems Settings</h3>
            <label htmlFor="build-select">Select Build:</label>
            <select
                id="build-select"
                value={selectedBuild}
                onChange={handleGemDropdownSelection}
                className="GemSettingsBuildSelect"
            >
                {allBuildNames.map((buildName) => (
                    <option key={buildName} value={buildName}>
                        {buildName}
                    </option>
                ))}
                <option value="__add__">Add build...</option>
            </select>
            {addingBuild && (
                <div className="GemSettingsAddBuildContainer">
                    <input
                        type="text"
                        value={newBuildName}
                        onChange={e => setNewBuildName(e.target.value)}
                        placeholder="Enter new build name"
                        className="GemSettingsAddBuildInput"
                    />
                    <button
                        className="GemSettingsAddBuildButton"
                        onClick={handleAddBuild}
                        disabled={!newBuildName.trim() || allBuildNames.includes(newBuildName.trim())}
                    >
                        Create
                    </button>
                </div>
            )}
            <div className="GemSettingsBlocksContainer">
                {editableGemSetups.map((setup, idx) => (
                    <div key={idx} className="GemSettingsBlock">
                        <label>
                            Level:&nbsp;
                            <input
                                type="number"
                                value={setup.level}
                                onChange={e => handleLevelChange(idx, Number(e.target.value))}
                                className="GemSettingsLevelInput"
                            />
                        </label>
                        <label>
                            <textarea
                                value={setup.gemLinks.join('\n')}
                                onChange={e => handleGemLinksChange(idx, e.target.value)}
                                rows={setup.gemLinks.length || 2}
                                className="GemSettingsLinksTextarea"
                            />
                        </label>
                    </div>
                ))}
                <button
                    className="GemSettingsAddBlockButton"
                    onClick={() => {
                        const lastLevel = editableGemSetups.length > 0
                            ? editableGemSetups[editableGemSetups.length - 1].level
                            : 0;
                        setEditableGemSetups([
                            ...editableGemSetups,
                            { level: lastLevel + 1, gemLinks: [], gemSources: [] }
                        ]);
                    }}
                >
                    + Add Block
                </button>
            </div>
            <div className="GemSettingsBanner">
                <button className="GemSettingsSaveButton" onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}