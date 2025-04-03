import { ipcMain, WebContents, webFrameMain, WebFrameMain } from 'electron';
import url from 'url';
import { getUIPath } from '../pathResolver.js';
import { isDev } from '../util.js';

// if we're in the dev env check that we're receiving event from port we chose in vite
// config if the frame did not come from our index.html then error this is not foolproof,
// if we need more than one file or whatever yeah
export function validateEventFrame(frame: WebFrameMain) {
	if (isDev() && new URL(frame.url).host === 'localhost:5123') {
		return;
	}
	if (frame.url !== url.pathToFileURL(getUIPath()).toString()) {
		throw new Error('Malicious event');
	}
}

// export function ipcMainHandle<Key extends keyof channelReturnType>(
// 	key: Key,
// 	handler: () => channelReturnType[Key]
// ) {
// 	ipcMain.handle(key, (event) => {
// 		validateEventFrame(event.senderFrame ?? new webFrameMain());
// 		return handler();
// 	});
// }

// //POST main -> renderer
// export function ipcWebContentsSend<Key extends keyof channelReturnType>(
// 	key: Key,
// 	webContents: WebContents,
// 	payload: channelReturnType[Key]
// ) {
// 	webContents.send(key, payload);
// }

// if someone calls ipcOn then ipcOn will return the ubsubscribe function, if we return
// this inside the UseEffect in app.tsx where we're subscribing then that will
// unsubscribe check https://react.dev/reference/react/useEffect
