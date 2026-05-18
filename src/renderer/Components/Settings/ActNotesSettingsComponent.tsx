import React, { useEffect, useState } from "react";
import { ActNote, LockNoteOption } from "../../../main/zodSchemas/schemas";

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
                className: "ActNotesSettingsLockButton--unlocked",
                disabled: false,
            };
        case "locked":
            return {
                label: "Do Not Update",
                title: "Notes will not update when the app is updated. Click to unlock.",
                className: "ActNotesSettingsLockButton--locked",
                disabled: false,
            };
        case "lockedCannotUnlock":
            return {
                label: "Cannot Update (Custom Notes)",
                title: "Custom act notes cannot be updated. Reset this note for updates.",
                className: "ActNotesSettingsLockButton--lockedCannotUnlock",
                disabled: true,
            };
    }
}

export function ActNotesSettingsComponent() {
    const [selectedBuild, setSelectedBuild] = useState("");
    const [allBuildNames, setAllBuildNames] = useState<string[]>([]);
    const [addingBuild, setAddingBuild] = useState(false);
    const [newBuildName, setNewBuildName] = useState("");

    const [editableActNotes, setEditableActNotes] = useState<ActNote[]>([]);

    // Load initial act names & notes from main
    useEffect(() => {
        window.electron.getActNotesSettingsState().then((response) => {
            if (!response.allBuildNames.includes(response.buildName)) {
                response.buildName = "Default";
            }

            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);

            setEditableActNotes(response.allActNotes || []);
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
            window.electron.postBuildSelectedFromActNotes(event.target.value).then((response) => {
                setSelectedBuild(response.buildName);
                setAllBuildNames(response.allBuildNames);

                setEditableActNotes(response.allActNotes || []);
            });
        }
    };

    const handleAddBuild = () => {
        if (!newBuildName.trim() || allBuildNames.includes(newBuildName.trim())) return;
        window.electron.postAddNewBuildFromActNotes(newBuildName.trim()).then((response) => {
            setSelectedBuild(response.buildName);
            setAllBuildNames(response.allBuildNames);
            setAddingBuild(false);
            setNewBuildName("");

            setEditableActNotes(response.allActNotes || []);
        });
    };

    const handleDeleteBuild = () => {
        if (
            selectedBuild &&
            window.confirm(`Are you sure you want to delete build "${selectedBuild}"?`)
        ) {
            window.electron.postDeleteBuildFromActNotes(selectedBuild).then((response) => {
                setSelectedBuild(response.buildName);
                setAllBuildNames(response.allBuildNames);
                setEditableActNotes(response.allActNotes || []);
            });
        }
    };

    const handleSaveActNotes = () => {
        const payload = {
            buildName: selectedBuild,
            allActNotes: editableActNotes,
        };
        // Save notes in main process and use returned state to refresh local state
        window.electron.saveActNotesForBuild(payload).then((response) => {
            setEditableActNotes(response.allActNotes || editableActNotes);
        });
    };

    /** Handle resetting the notes for an Act */
    const handleResetAct = (actName: string) => {
        // Ask main process to reset this act to default, then update ONLY that act in local state
        window.electron.postResetActNoteForAct(actName).then((defaultActNoteForAct) => {
            const actNotesWithDefault = editableActNotes.map((actNote) =>
                actNote.actName === defaultActNoteForAct.actName ? defaultActNoteForAct : actNote);
            setEditableActNotes(actNotesWithDefault);
        });
    };

    /** Handle changes to the lock option for an Act */
    const handleLockOptionChange = (actName: string, value: LockNoteOption) => {
        const newNotes = editableActNotes.map((actNote) => (actNote.actName !== actName
            ? actNote
            : {
                lockNoteOption: value,
                actName: actNote.actName,
                notes: actNote.notes
            }));

        setEditableActNotes(newNotes);
    };

    const handleLockToggle = (actName: string, lockNoteOption: LockNoteOption) => {
        if (lockNoteOption === "lockedCannotUnlock") return;
        const nextValue: LockNoteOption = lockNoteOption === "unlocked" ? "locked" : "unlocked";
        handleLockOptionChange(actName, nextValue);
    };

    /** Handle edits to Act Notes */
    const handleNoteChange = (actName: string, value: string) => {
        const newNotes = editableActNotes.map((actNote) => (actNote.actName !== actName
            ? actNote
            : {
                lockNoteOption: actNote.lockNoteOption,
                actName: actNote.actName,
                notes: value
            }));

        setEditableActNotes(newNotes);
    };

    const renderActNoteBlock = (actNote: ActNote) => {
        const lockButton = getLockButtonProps(actNote.lockNoteOption);
        return (
            <div key={actNote.actName} className="ActNotesSettingsBlock">
                <label>{actNote.actName}</label>
                <label>
                    <textarea
                        value={actNote.notes ?? ""}
                        onChange={(e) => handleNoteChange(actNote.actName, e.target.value)}
                        rows={actNote.notes.split('\n').length || 4}
                        className="ActNotesSettingsTextarea"
                    />
                </label>
                <button
                    type="button"
                    className={`ActNotesSettingsLockButton ${lockButton.className}`}
                    onClick={() => handleLockToggle(actNote.actName, actNote.lockNoteOption)}
                    title={lockButton.title}
                    disabled={lockButton.disabled}
                    aria-label={lockButton.label}
                >
                    {lockButton.label}
                </button>
                <button
                    className="ActNotesSettingsResetActButton"
                    onClick={() => handleResetAct(actNote.actName)}
                    title={`Reset notes for ${actNote.actName} to default`}
                >
                    Reset
                </button>
            </div>
        );
    };

    return (
        <div className="ActNotesSettingsComponent">
            <h3>Act Notes</h3>
            {/* Row at the top for selecting/adding/deleting build */}
            <div className="ActNotesSettingsBuildRow">
                <label htmlFor="build-select">Select Build:</label>
                <select
                    id="build-select"
                    value={addingBuild ? "__add__" : selectedBuild}
                    onChange={handleBuildDropdownSelection}
                    className="ActNotesSettingsBuildSelect"
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
                        className="ActNotesSettingsDeleteBuildButton"
                        onClick={handleDeleteBuild}
                        title="Delete current build"
                    >
                        Delete Build
                    </button>
                )}
            </div>
            {addingBuild && (
                <div className="ActNotesSettingsAddBuildContainer">
                    <input
                        type="text"
                        value={newBuildName}
                        onChange={(e) => setNewBuildName(e.target.value)}
                        placeholder="Enter new build name"
                        className="ActNotesSettingsAddBuildInput"
                    />
                    <button
                        className="ActNotesSettingsAddBuildButton"
                        onClick={handleAddBuild}
                        disabled={
                            !newBuildName.trim() || allBuildNames.includes(newBuildName.trim())
                        }
                    >
                        Create
                    </button>
                </div>
            )}
            {/* List of text boxes to add Act Notes */}
            <div className="ActNotesSettingsBlocksContainer">
                {editableActNotes.map(renderActNoteBlock)}
            </div>

            <div className="ActNotesSettingsBanner">
                <button className="ActNotesSettingsSaveButton" onClick={handleSaveActNotes}>
                    Save
                </button>
            </div>
        </div>
    );
}
