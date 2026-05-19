import React, { useEffect, useState, useRef } from "react";
import { LockNoteOption, ZoneNote } from "../../../main/zodSchemas/schemas";

function getLockButtonProps(lockNoteOption: LockNoteOption): {
    label: string;
    title: string;
    className: string;
    disabled: boolean;
} {
    switch (lockNoteOption) {
        case "unlocked":
            return {
                label: "Automatically Update",
                title: "Notes will update when the app is updated. Click to lock.",
                className: "ZoneNotesSettingsLockButton--unlocked",
                disabled: false,
            };
        case "locked":
            return {
                label: "Do Not Update",
                title: "Notes will not update when the app is updated. Click to unlock.",
                className: "ZoneNotesSettingsLockButton--locked",
                disabled: false,
            };
        case "lockedCannotUnlock":
            return {
                label: "Cannot Update (Custom Notes)",
                title: "Custom zone notes cannot be updated. Reset this note for updates.",
                className: "ZoneNotesSettingsLockButton--lockedCannotUnlock",
                disabled: true,
            };
    }
}

export function ZoneNotesSettingsComponent() {
    const [selectedBuild, setSelectedBuild] = useState("");
    const [allBuildNames, setAllBuildNames] = useState<string[]>([]);
    const [addingBuild, setAddingBuild] = useState(false);
    const [newBuildName, setNewBuildName] = useState("");
    const [buildToCopyName, setBuildToCopyName] = useState<string>("");

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

    const handleCopyZoneNotesFromBuild = () => {
        if (!buildToCopyName || buildToCopyName === selectedBuild) return;

        const payload = {
            buildName: selectedBuild,
            buildToCopyName: buildToCopyName
        };

        window.electron.postCopyZoneNotesFromBuild(payload).then((response) => {
            setEditableZoneNotes(response.allZoneNotes || []);
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

    /** Handle changes to the lock option for a Zone */
    const handleLockOptionChange = (zoneCode: string, value: LockNoteOption) => {
        const newNotes = editableZoneNotes.map((zoneNote) => (zoneNote.zoneCode !== zoneCode
            ? zoneNote
            : {
                lockNoteOption: value,
                zoneName: zoneNote.zoneName,
                zoneCode: zoneNote.zoneCode,
                notes: zoneNote.notes
            }));

        setEditableZoneNotes(newNotes);
    };

    const handleLockToggle = (zoneCode: string, lockNoteOption: LockNoteOption) => {
        if (lockNoteOption === "lockedCannotUnlock") return;
        const nextValue: LockNoteOption = lockNoteOption === "unlocked" ? "locked" : "unlocked";
        handleLockOptionChange(zoneCode, nextValue);
    };

    /** Handle edits to Zone Notes */
    const handleNoteChange = (zoneCode: string, value: string) => {
        // Replace the newly edited note in the current set of Zone Notes
        const newNotes = editableZoneNotes.map((zoneNote) => (zoneNote.zoneCode !== zoneCode
            ? zoneNote
            : {
                lockNoteOption: zoneNote.lockNoteOption,
                zoneName: zoneNote.zoneName,
                zoneCode: zoneNote.zoneCode,
                notes: value
            }));

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

    const renderZoneNoteBlock = (zoneNote: ZoneNote) => {
        const lockButton = getLockButtonProps(zoneNote.lockNoteOption);
        return (
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
                    type="button"
                    className={`ZoneNotesSettingsLockButton ${lockButton.className}`}
                    onClick={() => handleLockToggle(zoneNote.zoneCode, zoneNote.lockNoteOption)}
                    title={lockButton.title}
                    disabled={lockButton.disabled}
                    aria-label={lockButton.label}
                >
                    {lockButton.label}
                </button>
                <button
                    className="ZoneNotesSettingsResetZoneButton"
                    onClick={() => handleResetZone(zoneNote.zoneCode)}
                    title={`Reset notes for ${zoneNote.zoneCode} to default`}
                >
                    Reset
                </button>
            </div>
        );
    };

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

            {/* Copy Zone Notes From section */}
            {!addingBuild && (
                <div className="ZoneNotesSettingsCopyRow">
                    <button
                        className="ZoneNotesSettingsCopyButton"
                        onClick={handleCopyZoneNotesFromBuild}
                        disabled={!buildToCopyName || buildToCopyName === selectedBuild}
                        title="Copy zone notes from another build"
                    >
                        Copy Zone Notes From:
                    </button>
                    <select
                        className="ZoneNotesSettingsCopySelect"
                        value={buildToCopyName}
                        onChange={e => setBuildToCopyName(e.target.value)}
                    >
                        <option value="">Select build...</option>
                        {allBuildNames
                            .filter(name => name !== selectedBuild)
                            .map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                    </select>
                </div>
            )}

            {/* Add Build section */}
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
                {editableZoneNotes.map(renderZoneNoteBlock)}
            </div>

            <div className="ZoneNotesSettingsBanner">
                <button className="ZoneNotesSettingsSaveButton" onClick={handleSaveZoneNotes}>
                    Save
                </button>
            </div>
        </div>
    );
}