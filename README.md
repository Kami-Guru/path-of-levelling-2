# Path of Levelling 2

A levelling overlay for Path Of Exile 2

## Documentation
To see the full documentation, including the quick start guide, go here: https://kami-guru.github.io/path-of-levelling-2/

## Features
Feature List:
 - Display Act and Zone notes that automatically update when changing zone
 - Display Gem Setups that automatically update when levelling up
 - Display Level Diff, the difference between player level and monster level, and EXP modifier, which updates when levelling up and when changing zone
 - Builds:
     - Customisable per-build Act and Zone notes
         - Ability to copy Act and Zone notes from another build
     - Customisable per-build Gem Setups at different level breakpoints
 - Misc:
     - Hotkeys to show/hide any part of the overlay
     - Fully resizable/movable overlay elements
     - Adjustable font sizing
  
## To-Do:
Backlog:
 - Show diff between gem setups (e.g. Green for new gems, Blue for upgrades, Red for removed)
 - Add the ability for hiding images/notes/gem setups after a customisable duration in each zone
 - Better updating system, only checking on startup and only updating on next startup is not good enough
 - Put overlay on second monitor (probably need to just put it in a browser tab cuz Electron)

 - Bug: Input textboxes are wonky (any wrapped lines cause a variety of display issues)
 - Bug: Gem Setups Tracker is adding an extra empty line at the bottom, for whatever reason

In Progress:
 - Bug URGENT: Changing page on the settings screen will wipe any unsaved changes without warning
 - Bug: Adding a new build will copy all the changes from the previous build in the UI but not actually save them. New build should be added with no changes from Default build.

Recently Completed:
 - Update some zones I forgot about in 0.4 (Clearfell, Mud Burrow)
 - Another pass on some of the more egregiously-sized images (Sisters of Garukhan tile image lmao)
 - Add a PR that adds notes from the recent [0.5 Campaign Streamlining teaser](https://www.youtube.com/watch?v=miL0Ms-VwGI)
     - Will merge this & publish a release ~72 hours before launch



Canned:
 - ~~An overlay which shows a screenshot of a passive skill tree (presumably from POB), with many potential screenshots~~
     - The in-game builds added in 0.5 are just better
 - ~~Custom Hotkeys~~
     - This is not really possible in Electron, any pre-registered system shortcuts (e.g. Ctrl+C) will result in the hotkey not working at all. There is a small set of available hotkeys
     - Could potentially have hotkeys that are Ctrl+Alt+[Custom Key], but whatever that's low prio 

## Support: 
If you would like to support my work, you can buy me a coffee at https://ko-fi.com/kamiguru

Also XTheFarmerX is bald
