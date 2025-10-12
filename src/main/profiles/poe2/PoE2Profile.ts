import { GameProfile } from "../profiles.js";
import path from 'path';
import { app } from 'electron';

export const poe2Profile: GameProfile = {
    Id: "poe2",
    windowName: "Path of Exile 2",
    assetDir: "",
    configFile: "",
    defaultLogFilePath: process.platform === "win32"
        ? path.join('C:/Program Files (x86)/Steam/steamapps/common/Path of Exile 2/logs/Client.txt')
        : path.join(app.getPath('home'), '/.steam/root/steamapps/common/Path of Exile 2/logs/Client.txt'),
    logFilePathGuesses: process.platform === "win32"
        ? [
            path.join('C:/Program Files (x86)/Steam/steamapps/common/Path of Exile 2/logs/Client.txt'),
            path.join('D:/SteamLibrary/steamapps/common/Path of Exile 2/logs/Client.txt')
        ]
        : [
            path.join(app.getPath('home'), '/.steam/root/steamapps/common/Path of Exile 2/logs/Client.txt'),
        ]
}