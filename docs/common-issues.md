# Common Issues (Bugs pending fixes)

## My Client.txt path is correct, but I still get an error!
This is likely caused by the Client.txt itself not existing, i.e. the Client.txt has been deleted and has not been generated yet. It should generate when you enter any zone in game, after that you can paste and save the path again to re-check.

## One of the overlay windows disappeared offscreen!
This should be impossible now, if you experience this issue you can raise an issue at [Github Issues](https://github.com/Kami-Guru/path-of-levelling-2/issues). In the meantime, you can reset the window locations by closing the app and deleting the config.json in the user data folder, which should be located at either of:

Windows: `C:\users\<your user>\AppData\Local\Path of Levelling 2\config.json`  
Linux: `~/home/<your user>/.config/Path Of Levelling 2/config.json`