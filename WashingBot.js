app.LoadScript("config.js");
app.LoadScript("washingMonitor.js");

var btnStart = null,
    btnStop = null,
    txtStatus = null,
    txtConnection = null,
    monitor = null;

function OnStart() {
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

    setupMonitor();
    say("Happy washing!");
}

function btnStart_OnTouch() {
    monitor.start();
}

function btnStop_OnTouch() {
    monitor.stop();
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
        sendRequest(">>> :no_entry: Washing canceled :(");
    };

    config.onWaitingWashingStart = function(){
        txtStatus.SetText("Waiting for start...");
        say("Waiting for start.");
        sendRequest(">>> Machine configured. Waiting for start... (Let's pray together :pray:)");
    };

    config.onWashingStarted = function(){
        sendRequest("Washing started!");
        say("Washing start, detected!");
    };

    config.onWashingNotStarted = function(notificationCount){
        txtStatus.SetText("Washing never started! Still waiting (" + notificationCount + ")...");
        sendRequest(":warning: Washing never started! Still waiting (" + notificationCount + ")...");
        say("Washing never started! Still waiting");
    };

    config.onWashingMovement = function(washingDurationMinutes) {
        txtStatus.SetText("Washing for " + washingDurationMinutes + "mins...");
    }

    config.onFinished = function(washingDurationMinutes) {
        txtStatus.SetText("Laundry finished!!! Duration: " + washingDurationMinutes + "\nWaiting for mulo...");
        sendRequest("Mulo a colgar la ropa!! :clock3: Duración del lavado: " + washingDurationMinutes);
        say("Laundry finished.");
    }

    config.onFinishedReminder = function(minsSinceFinish, reminderCount) {
        sendRequest(":information_source: " + reminderCount + " - Recordá colgar la ropa, hace " + minsSinceFinish + "mins. que terminó!");
        say("Remember, remember the clothes!");
    };

    config.onPersonMovement = function() {
        btnStart.SetVisibility("Show");
        btnStop.SetVisibility("Hide");

        txtStatus.SetText(txtStatus.GetText() + "\nMulo detected!");
        sendRequest(">>> Mulo colgando ropa! :white_check_mark:");
        say("Enjoy. You fucking moolo!");
    }   

    // Logs all the events, just for testing
    config.onEvent = function (eventType, params){
        console.log(eventType);
        console.log(JSON.stringify(params));
    };

    monitor = washingMonitor.init (config);
}

function say(speech) {
    app.TextToSpeech(speech, 1.0, 1.0);
}

//TODO: Replaces uses of this method with the slackBot
function sendRequest(msg){
    monitor.sendRequest(msg);
}
