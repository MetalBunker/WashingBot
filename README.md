Welcome to WashingBot!
----------------------

TODO: Add nice explanation

#### Download & Installation

TODO: Complete
For now the only way is to clone the repo and 

### Workflow

This is an overview and a mix of all the possible states in which WashingBot can be and the events that can occur, for detailed info check the code ;)  
Typically it will notify that each state has been reached and also have in mind that in any state pressing "Stop" will make WashingBot go Idle.

A nice state diagram could be useful here :P

#### Init

After booting up WashingBot has finished configuring itself and it's ready for receiving commands.

#### Idle

Nothing going on, ready for receiving commands!

#### Start

Start button has been pressed and WashingBot is waiting a bit before start sensing movement to detect washing start. This is done in order to give the user time to place the phone over the washing machine.

#### Waiting Washing Start

WashingBot assumes it's placed on the washing machine and it's waiting to detect some movement. When he does, the washing will have started!
If washing start is not detected, he will notify it.

#### Washing started

Movement indicating washing start has been detected, washing is in progress.

#### Washing in progress

Movement indicating washing is still in progress is being detected. Now you can ask WashingBot how the washing is going ;)

#### Washing finished

No more movement has been detected, washing has finished. WashingBot will start waiting for a Human to go and hang the clothes.

#### Waiting for Human

Washing has finished and WashingBot is waiting for a Human to go and hang the clothes.
If Human is not detected, he will notify it.

#### Human detected

WashingBot has detected movement indicating that a Human has opened the washing machine. The cycle has finished and WashingBot goes now to Idle state.

### Slack Integration

TODO: Explain that it could be separated, etc.

#### Commands

TODO: Add commands that you can send to WashingBot.

### UDP debugging

If enabled in the configuration, on each detected movement a packet with the accelerometer data will be sent by UDP. This is useful for debugging and also pretty nerdy :P  
We have a simple HTML page that renders the values in a cool graph, we need to share that!

Check the code for more info ;) 

### Known bugs

- Doesn't work properly on Nexus 4, and probably on some other devices too but we didn't have the chance to test it a lot, check the "Device testing list" section for more info ;)  
The accelerometer reports garbage when the screen goes off, didn't find why.
- Unluckily it won't work on old devices, this is a limitation of DroidScript and not from WashingBot itself, but nevertheless it's a pity because it's a great use for old phones :(

### Device testing list

WashingBot has been tested on the following devices with these results:

| Device | Results | Comments
|---------|--------|
|LG Nexus 4 | Fails | Accel. reports garbage when screen is off.
|Samsung Galaxy S4 | OK ||
  
### Future improvements & ideas

- Improve UI (graphics, etc.).
- Publish APK to Google Play (need to buy the APK plugin) // TODO: Review name of this.
- Configuration editor (included for APK).
- Ability to add/choose different notification mechanisms.
- Ability to calibrate accelerometer (or define a threshold, etc). (PRs are welcome!)
- Maybe decoupling the sensor from the monitor.
- Maybe separating the sensor into another project.
- See if there is a way of generating the APK from the computer. 
- Add jsLint, etc. to the toolchain.

### Bugs, contact & contributions

Just file an issue on GitHub or send a PR!!  
Although it would be cool we think, to file an issue with the topic you want to work on before starting, just to coordinate. You can pick some ideas from the "Future improvements & ideas" section ;)

And make sure to participate on the [great DroidScript forum!](https://groups.google.com/forum/#!forum/androidscript)

### License

Read `LICENSE`

TODO: Review, add trademark, etc
We are in no way affiliated with DroidScript. Kudos to them!
