import React, { useEffect, useState, useRef } from "react";
import { ZoneNote } from "../../../main/zodSchemas/schemas";

export function ZoneNotesSettingsComponent() {
    const [selectedBuild, setSelectedBuild] = useState("");
    const [allBuildNames, setAllBuildNames] = useState<string[]>([]);
    const [addingBuild, setAddingBuild] = useState(false);
    const [newBuildName, setNewBuildName] = useState("");

    const [editableZoneNotes, setEditableZoneNotes] = useState<ZoneNote[]>([]);
    const textareaRefs = React.useRef<{ [zoneCode: string]: HTMLTextAreaElement | null; }>({});
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Load initial zone names & notes from main
    useEffect(() => {
        window.electron.getZoneNotesSettingsState().then((response) => {
            if (!response.allBuildNames.includes(response.buildName)) {
                response.buildName = "Default";
            }

            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);

            setEditableZoneNotes(response.allZoneNotes || []);
        });
    }, []);

    const handleBuildDropdownSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        if (value === "__add__") {
            setAddingBuild(true);
            setNewBuildName("");
        } else {
            setAddingBuild(false);
            // Post the change to main process and get back the new build selected
            window.electron.postBuildSelectedFromZoneNotes(event.target.value).then((response) => {
                setSelectedBuild(response.buildName);
                setAllBuildNames(response.allBuildNames);

                setEditableZoneNotes(response.allZoneNotes || []);
            });
        }
    };

    const handleAddBuild = () => {
        if (!newBuildName.trim() || allBuildNames.includes(newBuildName.trim())) return;
        window.electron.postAddNewBuildFromZoneNotes(newBuildName.trim()).then((response) => {
            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);
            setAddingBuild(false);
            setNewBuildName("");

            setEditableZoneNotes(response.allZoneNotes || []);
        });
    };

    const handleDeleteBuild = () => {
        if (
            selectedBuild &&
            window.confirm(`Are you sure you want to delete build "${selectedBuild}"?`)
        ) {
            window.electron.postDeleteBuildFromZoneNotes(selectedBuild).then((response) => {
                setSelectedBuild(response.buildName);
                setAllBuildNames(response.allBuildNames);
                setEditableZoneNotes(response.allZoneNotes || []);
            });
        }
    };

    const handleSaveZoneNotes = () => {
        const payload = {
            buildName: selectedBuild,
            allZoneNotes: editableZoneNotes,
        };
        // Save notes in main process and use returned state to refresh local state
        window.electron.saveZoneNotesForBuild(payload).then((response) => {
            setEditableZoneNotes(response.allZoneNotes);
        });
    };

    /** Handle resetting the notes for an Zone */
    const handleResetZone = (zoneCode: string) => {
        // Ask main process to reset this zone to default, then update ONLY that zone in local state
        window.electron.postResetZoneNoteForZone(zoneCode).then((defaultZoneNoteForZone) => {
            const zoneNotesWithDefault = editableZoneNotes.map((zoneNote) =>
                zoneNote.zoneCode === defaultZoneNoteForZone.zoneCode ? defaultZoneNoteForZone : zoneNote);
            setEditableZoneNotes(zoneNotesWithDefault);
        });
    };

    /** Handle edits to Zone Notes */
    const handleNoteChange = (zoneCode: string, value: string) => {
        // Replace the newly edited note in the current set of Zone Notes
        const newNotes = editableZoneNotes.map((zoneNote) => (zoneNote.zoneCode !== zoneCode
            ? zoneNote
            : {
                zoneName: zoneNote.zoneName,
                zoneCode: zoneNote.zoneCode,
                notes: value
            }));

        setEditableZoneNotes(newNotes);

        setEditableZoneNotes(newNotes);
        setTimeout(() => autoResize(zoneCode), 0); // Wait for DOM update
    };

    const autoResize = (zoneCode: string) => {
        const ref = textareaRefs.current[zoneCode];
        const container = containerRef.current;
        if (ref && container) {
            // Save parent scroll position
            const prevScrollTop = container.scrollTop;
            const prevScrollHeight = container.scrollHeight;

            // Save caret position
            const { selectionStart, selectionEnd } = ref;

            ref.style.height = 'auto';
            ref.style.height = ref.scrollHeight + 'px';

            // Restore caret position
            ref.selectionStart = selectionStart;
            ref.selectionEnd = selectionEnd;

            // Adjust scroll so the caret stays in view, but don't jump to top
            const scrollDiff = container.scrollHeight - prevScrollHeight;
            if (scrollDiff > 0) {
                container.scrollTop = prevScrollTop + scrollDiff;
            }
        }
    };

    useEffect(() => {
        editableZoneNotes.forEach((zoneNote) => autoResize(zoneNote.zoneCode));
    }, [editableZoneNotes]);

    return (
        <div className="ZoneNotesSettingsComponent" ref={containerRef}>
            <h3>Zone Notes</h3>
            {/* Row at the top for selecting/adding/deleting build */}
            <div className="ZoneNotesSettingsBuildRow">
                <label htmlFor="build-select">Select Build:</label>
                <select
                    id="build-select"
                    value={addingBuild ? "__add__" : selectedBuild}
                    onChange={handleBuildDropdownSelection}
                    className="ZoneNotesSettingsBuildSelect"
                >
                    {allBuildNames.map((buildName) => (
                        <option key={buildName} value={buildName}>
                            {buildName}
                        </option>
                    ))}
                    <option value="__add__">Add build...</option>
                </select>
                {!addingBuild && (
                    <button
                        className="ZoneNotesSettingsDeleteBuildButton"
                        onClick={handleDeleteBuild}
                        title="Delete current build"
                    >
                        Delete Build
                    </button>
                )}
            </div>
            {addingBuild && (
                <div className="ZoneNotesSettingsAddBuildContainer">
                    <input
                        type="text"
                        value={newBuildName}
                        onChange={(e) => setNewBuildName(e.target.value)}
                        placeholder="Enter new build name"
                        className="ZoneNotesSettingsAddBuildInput"
                    />
                    <button
                        className="ZoneNotesSettingsAddBuildButton"
                        onClick={handleAddBuild}
                        disabled={
                            !newBuildName.trim() || allBuildNames.includes(newBuildName.trim())
                        }
                    >
                        Create
                    </button>
                </div>
            )}
            {/* List of text boxes to add Zone Notes */}
            <div className="ZoneNotesSettingsBlocksContainer">
                {editableZoneNotes.map((zoneNote) => (
                    <div key={zoneNote.zoneCode} className="ZoneNotesSettingsBlock">
                        <label>{zoneNote.zoneName}</label>
                        <label>
                            <textarea
                                ref={el => { textareaRefs.current[zoneNote.zoneCode] = el; }}
                                value={zoneNote.notes ?? ""}
                                onChange={(e) => handleNoteChange(zoneNote.zoneCode, e.target.value)}
                                className="ZoneNotesSettingsTextarea"
                                style={{ overflow: "hidden", resize: "vertical" }}
                            />
                        </label>
                        <button
                            className="ZoneNotesSettingsResetZoneButton"
                            onClick={() => handleResetZone(zoneNote.zoneCode)}
                            title={`Reset notes for ${zoneNote.zoneCode} to default`}
                        >
                            Reset
                        </button>
                    </div>
                ))}
            </div>

            <div className="ZoneNotesSettingsBanner">
                <button className="ZoneNotesSettingsSaveButton" onClick={handleSaveZoneNotes}>
                    Save
                </button>
            </div>
        </div>
    );
}