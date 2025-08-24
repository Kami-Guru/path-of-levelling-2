---
# https://vitepress.dev/reference/default-theme-home-page
title: Download - Path of Levelling 2
---

<script setup>
import { data } from '/reference.data.js'
</script>

# Download
You can download Path of Levelling 2 on the following platforms:

| PLatform             | Automatic Updates |
| -------------------- | ----------------- |
| <a :href="`${data.github.releasesUrl}/download/v${data.appVersion}/Path-of-Levelling-2-Setup-${data.appVersion}.exe`">Windows 10+ (installer)</a>   | ✅                |
| Windows (portable)   | ❌                |
| Linux (AppImage)     | ✅                |

*Note that the Windows installer is unsigned, so you will have to bypass a security check the first time you run the application.

**Path of Exile 2 must be Windowed or Windowed Fullscreen for the overlay to function.**

### Additional Linux Setup Steps
Linux requires some additional steps to get up and running. First, until [this issue](https://github.com/SnosMe/electron-overlay-window/issues/44) is resolved, if you have a second monitor on the left of your primary monitor, you need to start Path of Levelling 2 *before* running Path of Exile 2. I have a PR up to fix this issue, so hopefully I can remove this step soon. 

Next, if you use Windowed Fullscreen on KDE, create the following window rule:
![Linux Window Rule Overlay Fix](/images/linux-window-rule-overlay-fix.png)

This rule sets the layer for both the levelling overlay and PoE2 to OSD (On-screen display) so that the overlay can overlap while PoE 2 is in focus.

If you use KDE at all, also create the following window rule:
![Linux Window Rule Overlay Fix](/images/linux-window-rule-taskbar-fix.png)

This gets rid of the annoying flashing taskbar icon created whenever the overlay hides then reappears by blocking it from appearing on the taskbar. You can still exit the app by right clicking it in the tray. The same rule can be used with window class `exiled-exchange-2` to fix the same issue with Exiled Exchange 2, if you use it.
