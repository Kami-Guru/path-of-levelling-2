import { ipcMain, WebContents } from "electron";

//Truthfully I have no idea what this is
// // if we're in the dev env check that we're receiving event from port we chose in vite
// // config if the frame did not come from our index.html then error. This is not foolproof,
// // if we need more than one file or whatever yeah
// export function validateEventFrame(frame: WebFrameMain) {
// 	if (isDev() && new URL(frame.url).host === "localhost:5123") {
// 		return;
// 	}
// 	if (frame.url !== url.pathToFileURL(getUIPath()).toString()) {
// 		throw new Error("Malicious event");
// 	}
// }

/** Type safe wrapper for post requests from Renderer->Main->Renderer that expect a response */
export function ipcMainHandle<K extends keyof channelReturnTypeMapping>(
	channel: K,
	handler: (
		event: any, // I never use this event, can add some type safety later if needed
		request: K extends keyof channelRequestTypeMapping
			? channelRequestTypeMapping[K]
			: undefined
	) => channelReturnTypeMapping[K] | Promise<channelReturnTypeMapping[K]>
) {
	ipcMain.handle(channel as string, (event, request) => {
		return handler(event, request as any);
	});
}

/** Type safe wrapper for Renderer->Main subscriptions */
export function ipcWebContentsSend<K extends keyof channelReturnTypeMapping>(
	channel: K,
	webContents: WebContents,
	payload: channelReturnTypeMapping[K]
) {
	webContents.send(channel, payload);
}
