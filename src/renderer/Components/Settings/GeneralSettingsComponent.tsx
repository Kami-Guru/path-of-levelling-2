import { electron } from 'process';
import { useEffect, useState } from 'react';

export function GeneralSettingsComponent({
    fontSize,
    setFontSizeFunction,
}: {
    fontSize: number;
    setFontSizeFunction: (n: number) => void;
}) {
    // Setting up the Client Path inputs
    const [clientPath, setClientPath] = useState('');
    const [isClientPathSaveClicked, setIsClientPathSaveClicked] = useState(false);
    const [isClientWatcherActive, setIsClientWatcherActive] = useState(Boolean);

    // This basically just records keystrokes in the input component so that the text
    // is actually stored.
    const handleClientPathChange = (event: any) => {
        setClientPath(event.target.value);
        setIsClientPathSaveClicked(true);
    };

    // Setting up the Font Size inputs
    const [fontSizeInput, setFontSizeInput] = useState(String(fontSize));

    useEffect(() => {
        setFontSizeInput(String(fontSize));
    }, [fontSize]);

    const handleSaveFontSize = () => {
        const parsed = parseInt(fontSizeInput, 10);
        if (!isNaN(parsed)) {
            window.electron.saveFontSize(parsed);
            setFontSizeFunction(parsed);
        }
    };

    // Get initial state - this is required for the input to show the current client path.
    useEffect(() => {
        window.electron.getClientPath().then((clientPath) => {
            setClientPath(clientPath);
        });
    }, []);

    // Post the clientPath provided by the user and get a bool saying whether or not the
    // log watcher was activated.
    const handleSaveClientPathClicked = (event: any) => {
        window.electron.saveClientPath(clientPath).then((isWatcherActive) => {
            setIsClientWatcherActive(isWatcherActive);
            setIsClientPathSaveClicked(true);
        });
    };

    // Get initial state for whether or not the client log reader was attached.
    useEffect(() => {
        window.electron.getIsClientWatcherActive()
            .then((isClientWatcherActive: boolean) => {
                setIsClientWatcherActive(isClientWatcherActive);
            });
    }, []);

    const getClientPathSaveButtonText = () => {
        if (isClientPathSaveClicked) {
            return 'Saved!';
        }
        return 'Save';
    };

    const conditionalDisplayClientWatcherWarning = () => {
        if (isClientWatcherActive) {
            return;
        }

        return (
            <p className="ClientWatcherNotActiveWarning">
                Cannot access Path Of Exile 2 logs! Please update your path!
            </p>
        );
    };

    return (
        <div className="GeneralSettingsComponent">
            <h3>General Settings</h3>
            <div className="FontSizeUpdaterWrapper">
                <label className="SettingsLabel">Font Size:</label>
                <input
                    autoComplete={fontSize.toString()}
                    className="FontSizeInput"
                    name="fontSize"
                    value={fontSizeInput}
                    onChange={(e) => setFontSizeInput(e.target.value)}
                    type="number"
                />
                <button onClick={handleSaveFontSize} style={{ marginLeft: 8 }}>
                    Save
                </button>
            </div>
            <div className="HotkeysWrapper">
                <h3>Hotkeys</h3>
                <div className="HotkeysRow">
                    <p>Show/hide settings: Ctrl+Alt+s</p>
                    <p>Show/hide zone notes: Ctrl+Alt+z</p>
                    <p>Show/hide layout images: Ctrl+Alt+i</p>
                    <p>Show/hide level tracker: Ctrl+Alt+l</p>
                    <p>Show/hide gem tracker: Ctrl+Alt+g</p>
                </div>
            </div>
            <div className="ClientPathUpdaterWrapper">
                <h3>Enter your Client.txt Path here</h3>
                <div>
                    <p>Required for automatic updating. Path should look like this:</p>
                    <p>{'<path-to-steam>'}/steamapps/common/Path of Exile 2/logs/Client.txt</p>
                    {conditionalDisplayClientWatcherWarning()}
                    <label className="SettingsLabel">
                        Path:
                        <input
                            autoComplete={clientPath}
                            className="ClientPathInput"
                            name="clientPath"
                            value={clientPath}
                            onChange={handleClientPathChange}
                        />
                        <button
                            className="SaveClientPathSettingsButton"
                            title="saveClientPath"
                            onClick={handleSaveClientPathClicked}
                        >
                            {getClientPathSaveButtonText()}
                        </button>
                    </label>
                </div>
            </div>
        </div>
    );
}