app.LoadScript("config.js");
app.LoadScript("washingMonitor.js");
app.LoadScript("miniSlackBot.js");

var btnStart = null,
    btnStop = null,
    txtStatus = null,
    txtConnection = null,
    monitor = null,
    miniSlackBotInstance = null,
    netClient = null,
    udpIpAddress = null;

function OnStart() {

    setupUI();
    setupNetClient();
    setupMonitor();
    setupSlackBot();

    say("Happy washing!");
}

function setupNetClient(){
    if (!config.sendUdpUpdates) return;   
    
    netClient = app.CreateNetClient("UDP");
    udpIpAddress = config.udpIpAddress ? config.udpIpAddress : netClient.GetBroadcastAddress();    
}

function setupUI(){
    lay = app.CreateLayout("Linear", "VCenter,FillXY");

    txtStatus = app.CreateText("", 0.8, 0.3, "Multiline");
    lay.AddChild(txtStatus);
    txtStatus.SetText("Ready to serve!");

    btnStart = app.CreateButton("Start Washing", 0.5, 0.3, "Alum");
    lay.AddChild(btnStart);
    btnStart.SetOnTouch(btnStart_OnTouch);

    btnStop = app.CreateButton("Stop!", 0.5, 0.3, "Alum");
    lay.AddChild(btnStop);
    btnStop.SetOnTouch(btnStop_OnTouch);
    btnStop.SetVisibility("Hide");

    txtConnection = app.CreateText("", 0.8, 0.2, "Multiline");
    lay.AddChild(txtConnection);
    txtConnection.SetText("Waiting...");

    app.AddLayout(lay);
}

function btnStart_OnTouch() {
    monitor.start();
}

function btnStop_OnTouch() {
    monitor.stop();
}

function setupSlackBot(){
    miniSlackBotInstance = miniSlackBot.create({
        token: config.slackToken,
        defaultChannelName: config.slackChannelName,
        events: {
            onConnecting: function (){
                txtConnection.SetText("Connecting...");
            },
            onConnectionOpened: function (isReconnect) {
                txtConnection.SetText("Connected :)");
                if (isReconnect) {
                    miniSlackBotInstance.sendMessage("I'm back :space_invader:");
                }
                else {
                    miniSlackBotInstance.sendMessage("Hello... boooooo! :ghost:");
                }
            },
            onConnectionError: function () {
                txtConnection.SetText("Connection error :'(");
            },
            onConnectionClosed: function () {
                txtConnection.SetText("Disconnected :(");
            },
            onMessage : function (message, channelId) {
                var command = message.split(" ");

                if (command.length > 0 && command[0] != "") {

                    switch (command[0]) {
                        case "time":
                            if (monitor.hasFinished()) {
                                miniSlackBotInstance.sendMessage(":clock3: It took me " + monitor.getWashingDurationInMinutes() + "mins. to do the washing", channelId);
                                return;
                            }
                            if (monitor.getStartTime()) {
                                miniSlackBotInstance.sendMessage(":clock3: I've been washing for " + monitor.getWashingDurationInMinutes() + "mins. :smiley:", channelId);
                                return;
                            }
                            miniSlackBotInstance.sendMessage("I haven't started yet! :smiley_cat:", channelId);
                            break;
                        case "say":
                            if (command.length == 1) {
                                miniSlackBotInstance.sendMessage("What do you want me to say?", channelId);
                            }
                            else {
                                say(command.slice(1).join(" "));
                            }

                            break;
                        default:
                            miniSlackBotInstance.sendMessage("You lost me there (I'm not trained to process that request).", channelId);
                            break;
                    }
                }
                else {
                    miniSlackBotInstance.sendMessage(":squirrel: I need your clothes, your boots, and your motorcycle!", channelId);
                }
            }
        }
    });
}

function setupMonitor(){
    // We augment the config object for the washingMonitor with
    // the callbacks for each event

    config.onInit = function(){
        console.log("Init!");
    };

    config.onStart = function(){
        btnStart.SetVisibility("Hide");
        btnStop.SetVisibility("Show");
        txtStatus.SetText("Waiting for cell placing...");
        say("Please place the phone on the washing machine.");
    };

    config.onStop = function(){
        btnStop.SetVisibility("Hide");
        btnStart.SetVisibility("Show");
        txtStatus.SetText("Ready to serve!");
        miniSlackBotInstance.sendMessage(">>> :no_entry: Washing canceled :(");
    };

    config.onWaitingWashingStart = function(){
        txtStatus.SetText("Waiting for start...");
        say("Waiting for start.");
        miniSlackBotInstance.sendMessage(">>> Machine configured. Waiting for start... (Let's pray together :pray:)");
    };

    config.onWashingStarted = function(){
        miniSlackBotInstance.sendMessage("Washing started!");
        say("Washing start, detected!");
    };

    config.onWashingNotStarted = function(notificationCount){
        txtStatus.SetText("Washing never started! Still waiting (" + notificationCount + ")...");
        miniSlackBotInstance.sendMessage(":warning: Washing never started! Still waiting (" + notificationCount + ")...");
        say("Washing never started! Still waiting");
    };

    config.onWashingMovement = function(washingDurationMinutes, x, y, z) {
        txtStatus.SetText("Washing for " + washingDurationMinutes + "mins...");
        sendPacket(x, y, z);
    }

    config.onFinished = function(washingDurationMinutes) {
        txtStatus.SetText("Laundry finished!!! Duration: " + washingDurationMinutes + "\nWaiting for mulo...");
        miniSlackBotInstance.sendMessage("Mulo a colgar la ropa!! :clock3: Duración del lavado: " + washingDurationMinutes);
        say("Laundry finished.");
    }

    config.onFinishedReminder = function(minsSinceFinish, reminderCount) {
        miniSlackBotInstance.sendMessage(":information_source: " + reminderCount + " - Recordá colgar la ropa, hace " + minsSinceFinish + "mins. que terminó!");
        say("Remember, remember the clothes!");
    };

    config.onPersonMovement = function() {
        btnStart.SetVisibility("Show");
        btnStop.SetVisibility("Hide");

        txtStatus.SetText(txtStatus.GetText() + "\nMulo detected!");
        miniSlackBotInstance.sendMessage(">>> Mulo colgando ropa! :white_check_mark:");
        say("Enjoy. You fucking moolo!");
    }

    // Logs all the events, just for testing
    config.onEvent = function (eventType, params){
        console.log(eventType);
        console.log(JSON.stringify(params));
    };

    monitor = washingMonitor.init(config);
}

function say(speech) {
    app.TextToSpeech(speech, 1.0, 1.0);
}

function sendPacket(x,y,z){
    if (!config.sendUdpUpdates) return;

    // We substract 9 from z axis so the value is closer to the other two, useful 
    // for graphing.
    var packet = x + "|"+ y +"|"+ (z-9);
    netClient.SendDatagram( packet, "UTF-8", udpIpAddress, config.udpPort );
}
