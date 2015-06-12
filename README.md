Welcome to WashingBot!
----------------------

A [DroidScript](https://play.google.com/store/apps/details?id=com.smartphoneremote.androidscriptfree) app to help you with your laundry. WashingBot monitors your washing machine, keeps you updated, reminds you to hang your clothes, talks and you can even chat with him!

Low water pressure, different washing options and your mental state can affect the duration of your washing cycle, if you like us are too lazy to care and hate going to check in vane, then this app is for you!

![WashingBot!](https://github.com/MetalBunker/WashingBot/blob/master/Img/WashingBot.png)
  
WashingBot feels the vibrations of your washing machine by using your cell's accelerometer, so he knows (or tries to guess :P) how is your washing going. He will notify you when your washing starts, finishes and he will even remind you to go and hang your clothes!  
Notifications are verbal (yes, he likes to talk) and by chat, using [Slack](https://slack.com/). You can even ask him for how long he has been washing (yeah, he thinks he's actually doing the laundry, be nice and don't tell him).

The code is easily extensible, we hope, so you can add new notification mechanisms and commands very easily (plus, we want to see what crazy ideas you have on your mind). And also there are a lot of pieces that could be useful for another projects, check it out & hack it! 

#### Download & Installation

As there is no config UI yet, you'll need to install it manually in order to be able to configure it. Although we could create an APK with default config values, but that would mean no chatting :(  
So: 

- Make sure you have [DroidScript](https://play.google.com/store/apps/details?id=com.smartphoneremote.androidscriptfree) installed on your cell (and that it runs!)
- Clone the repo (or download the zip ;) )
- Check config.js (defaults are ok, but you'll have to fill in your Slack token if you want to chat with him).
- Copy the whole WashingBot folder (you can exclude the .git folder) to the DroidScript folder on your cell.
- Open DroidScript, you should see a new app there!

We should generate a DroidScript SPK, include it in the repo and explain how to install it, it's easier. Sorry on this one guys :(  
We also have in mind generating an APK and releasing it freely in Google Play if we complete the UI ;) 

### Usage & Operation Workflow

Just open the app, press START and listen!

Anyway, here you have an overview and a mix of all the possible states in which WashingBot can be and the events that can occur, but basically it will notify upon reaching each state and also have in mind that in any state pressing "Stop" will make WashingBot go Idle. For detailed info check the code ;)  

A nice state diagram would be useful here :P

- **Init:** After booting up WashingBot has finished configuring itself and it's ready for receiving commands.
- **Idle:** Nothing going on, ready for receiving commands!
- **Start:** Start button has been pressed and WashingBot is waiting a bit before start sensing movement to detect the beginning of the washing process. This is done in order to give the user time to place the phone over the washing machine.
- **Waiting Washing Start:** WashingBot assumes it's placed on the washing machine and it's waiting to detect some movement. When he does, the washing will have started! If washing start is not detected, he will notify it.
- **Washing started:** Movement indicating washing start has been detected, washing is in progress.
- **Washing in progress:** Movement indicating washing is still in progress is being detected. Now you can ask WashingBot how the washing is going ;)
- **Washing finished:** No more movement has been detected, washing has finished. WashingBot will start waiting for a Human to go and hang the clothes.
- **Waiting for Human:** Washing has finished and WashingBot is waiting for a Human to go and hang the clothes. If Human is not detected, he will notify it.
- **Human detected:** WashingBot has detected movement indicating that a Human has opened the washing machine. The cycle has finished and WashingBot goes now to Idle state.

### Slack Integration

TODO: Explain config, usage, etc

#### Chat Commands

- `Time` : Will tell you for how long he have been washing or how long it took if washing has already finished.
- `Say <Text to Say>` : Will talk aloud whatever you order him to! Works at anytime, useful for playing jokes :P

### Some misc. technical notes

TODO: Complete

- Rip it apart and re-use what's useful to you! Just remember to mention the repo and to drop us a note so we now what cool thing you came up with! :heart:

#### Modules

TODO: explain what things could be reutilized: miniSlackBot.js (saves messages when untils reconnection, etc), washingMonitor.js, etc

#### UDP debugging

If enabled in the configuration, on each detected movement a packet with the accelerometer data will be sent by UDP. This is useful for debugging and also pretty nerdy :P  
We have a simple HTML page that renders the values in a cool graph. Hey we need to share that!

Check the code for more info ;) 

### Known bugs :beetle:

- Doesn't work properly on Nexus 4, and probably on some other devices either but we didn't have the chance to test it a lot, check the "Device testing list" section for more info ;)  
The accelerometer reports garbage when the screen goes off, didn't find why.
- Unluckily it won't work on old devices, this is a limitation of DroidScript and not from WashingBot itself, but nevertheless it's a pity because it's a great use for old phones :(

### Device testing list

WashingBot has been tested on the following devices with these results:

| Device | Results | Comments |
|--------|:---------:|----------|
|LG Nexus 4 | :x: | Accelerometer reports garbage when screen is off.
|Samsung Galaxy S4 | :white_check_mark: ||

If you test it, just tell us and we'll add your device to the list ;)
  
### Future improvements & ideas

- Improve UI (graphics, etc.).
- Publish APK to Google Play (need to buy the ApkBuilder plugin).
- Configuration editor (include for APK).
- Ability to add/choose different notification mechanisms.
- Ability to calibrate accelerometer (or define a threshold, etc) (PRs are welcome!).
- Maybe decoupling the sensor from the monitor.
- Maybe separating the sensor into another project.
- Add DroidScript SPK to the repository, so people can easily try it.
- See if there is a way of generating the SPK from the computer so we can include it in the toolchain. 
- Add jsLint, etc. to the toolchain.
- Publish graphing app for sensor data (a gist would be enough for now).
- Testing on more devices and washing machines!
- Maybe explain the UI here? :P
- Check what happens if the device doesn't have accelerometer but runs DroidScript. Is that possible?
- Detail and publish the workflow and toolchain used for developing.

### Troubleshooting :feelsgood:

- **Washing start is never detected:** you could do some tests by shaking you phone, does it work? Maybe you have an ultra-quiet washing machine? The bot doesn't have any low level threshold, it understands "movement" from the most minimal accelerometer readings, so maybe your device is not sensitive enough? Maybe you could try placing the phone over different areas of the washing machine and see how it goes.
- **Washing end is never detected:** make sure you have waited long enough for the threshold to be reached (`washingThresholdMinutes` in config.js), default is 10 minutes. You should also make sure that your phone's accelerometer doesn't report garbage when the screen goes off, you can use the UDP debugging for this (or the DroidScript IDE directly also).
- **The cycle ends at lightning speed:** make sure you didn't enabled `useSecondsInsteadOfMinutes` in the config :P
- **Never connects to Slack:** make sure it's properly configured, see "Slack Integration" section.

### Bugs, contact & contributions :shipit:

- **Got a crazy idea/problem, fixed/found a bug or included a nice comment?** Just file an issue on GitHub or send a PR!!
- **Have free time?** You can pick some ideas from the "Future improvements & ideas" section ;)  
Idea: File an issue with the topic you want to work on before starting, just to coordinate (is this the right way to do it?).
- **Just wanna contact us?** lucas.devescovi :recycle: gmail.com 

And make sure to participate on the [great DroidScript forum](https://groups.google.com/forum/#!forum/androidscript)!

### License

- Read `LICENSE`
- We are in no way affiliated with DroidScript or Slack. Kudos to them for their great products!
- We don't remember where we took the logo from, if you know please tell us! It's nice :)

