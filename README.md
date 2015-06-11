Welcome to WashingBot!
----------------------

TODO: "he" or "it" for WashingBot in the whole page?
TODO: Add some emoticons
TODO: Add logo

A [DroidScript](https://play.google.com/store/apps/details?id=com.smartphoneremote.androidscriptfree) app to help you with your laundry. WashingBot monitors your washing machine, keeps you updated, reminds you to hang your clothes, talks and you can even chat with him!

WashingBot feels the vibrations of your washing machine by using your cell's accelerometer, so he knows (or tries to guess :P) how is your washing going. He will notify you when your washing starts, finishes and he will even remind you to go and hang your clothes!

Notifications are verbal (yes, he likes to talk) and by chat, using Slack. You can even ask him for how long he has been washing (yeah, he thinks he's actually doing the laundry, be nice and don't tell him).

The code is very easily extensible, we hope, so you can add new notifications mechanisms and commands very easily (plus we want to see what crazy ideas you have on your mind). And also there a lot of pieces that could be useful for another projects, check it out! 

#### Download & Installation

As there is no config UI yet, you'll need to install it manually in order to be able to configure it. Although we could create an APK with default config values, but that would mean no chatting :(  
So: 

- Make sure you have DroidScript installed on your cell (and that it runs!)
- Clone the repo (or download the zip ;) )
- Check config.js (defaults are ok, but you'll have to fill in your Slack token if you want to chat with him).
- Copy the whole WashingBot folder (you can exclude the .git folder) to the DroidScript folder on your cell.
- Open DroidScript, you should see a new app there!

We are planning on generating an APK and release it freely in Google Play if we complete the UI ;) 

### Workflow

This is an overview and a mix of all the possible states in which WashingBot can be and the events that can occur, for detailed info check the code ;)  
Typically it will notify that each state has been reached and also have in mind that in any state pressing "Stop" will make WashingBot go Idle.

A nice state diagram would be useful here :P

TODO: These states takes up too much space, reformat? move to wiki page or another .md maybe?

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

### Some interesting technical notes

TODO: Complete, explain things could be reutilized, etc, etc

- Explain miniSlackBot.js 
- Explain washingMonitor.js
- Rip it apart and re-use what's useful to you! Just remember to mention us and to drop us a note so we now what cool thing you came up with! <3

### Slack Integration

TODO: Remind of configs

#### Commands

TODO: Explain commands that you can send to WashingBot, when, etc.
Time
Say <Text to Say>

### UDP debugging

If enabled in the configuration, on each detected movement a packet with the accelerometer data will be sent by UDP. This is useful for debugging and also pretty nerdy :P  
We have a simple HTML page that renders the values in a cool graph. Hey we need to share that!

Check the code for more info ;) 

### Known bugs

- Doesn't work properly on Nexus 4, and probably on some other devices too but we didn't have the chance to test it a lot, check the "Device testing list" section for more info ;)  
The accelerometer reports garbage when the screen goes off, didn't find why.
- Unluckily it won't work on old devices, this is a limitation of DroidScript and not from WashingBot itself, but nevertheless it's a pity because it's a great use for old phones :(

### Device testing list

WashingBot has been tested on the following devices with these results:

TODO: Fix table (broken in GitHub)

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
- See if there is a way of generating the APK from the computer so we can include it in the toolchain. 
- Add jsLint, etc. to the toolchain.
- Publish graphing app for sensor data (a gist would be enough for now).
- Testing on more devices and washing machines!

### Bugs, contact & contributions

TODO: Review

- **Got a crazy idea, fixed a bug or included a nice comment?** Just file an issue on GitHub or send a PR!!
- **Have free time?** You can pick some ideas from the "Future improvements & ideas" section ;)  
Idea: File an issue with the topic you want to work on before starting, just to coordinate (is this the right way to do it?).
- **Just wanna contact us?** lucas.devescovi (@) gmail.com 

And make sure to participate on the [great DroidScript forum](https://groups.google.com/forum/#!forum/androidscript)!

### License

Read `LICENSE`

We are in no way affiliated with DroidScript. Kudos to them!

TODO: Review, add trademark, images, Slack, etc
