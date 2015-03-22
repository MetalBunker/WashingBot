app.LoadScript("config.js");

var timeOutHandler = null,
    startTimeoutHandler = null,
    sensor = null,
    btn = null,
    btnStop = null,
    startTime = null,
    finishTime = null,
    hasFinished = false,
    txt = null,
    txtConnection = null,
    // Websocket to slack.
    ws = null,
    msgId = 1,
    channelId = null,
    wsMessages = [],
    initWebSocketInProgress = false;

function OnStart() {
    lay = app.CreateLayout("Linear", "VCenter,FillXY");

    txt = app.CreateText("", 0.8, 0.3, "Multiline");
    lay.AddChild(txt);
    txt.SetText("Ready to serve!");

    btn = app.CreateButton("Start Washing", 0.5, 0.3, "Alum");
    lay.AddChild(btn);
    btn.SetOnTouch(btn_OnTouch);

    btnStop = app.CreateButton("Stop!", 0.5, 0.3, "Alum");
    lay.AddChild(btnStop);
    btnStop.SetOnTouch(btnStop_OnTouch);
    btnStop.SetVisibility("Hide");

    txtConnection = app.CreateText("", 0.8, 0.2, "Multiline");
    lay.AddChild(txtConnection);
    txtConnection.SetText("Waiting...");

    app.AddLayout(lay);

    initWebSocket();
    say("Happy washing!");
}

function btn_OnTouch() {

    if (!sensor) sensor = app.CreateSensor("Accelerometer");

    btn.SetVisibility("Hide");
    btnStop.SetVisibility("Show");
    txt.SetText("Waiting for cell placing...");
    say("Please place the phone on the washing machine.");
    hasFinished = false;

    // We start waiting for the machine moving in a few minutes, otherwise
    // we'll still have the cellphone in our hands.
    startTimeoutHandler = setTimeout(waitForStart, convertToMs(config.cellDropTimeoutMinutes));

    app.PreventScreenLock("Partial");
}

function btnStop_OnTouch() {
    if (startTimeoutHandler) clearTimeout(startTimeoutHandler);
    if (timeOutHandler) clearTimeout(timeOutHandler);
    sensor.Stop();
    btnStop.SetVisibility("Hide");
    btn.SetVisibility("Show");
    txt.SetText("Ready to serve!");
    hasFinished = false;

    sendRequest(">>> :no_entry: Washing canceled :(");
}

function waitForStart() {
    txt.SetText("Waiting for start...");
    say("Waiting for start.");

    sensor.SetOnChange(configureSensorForWashingStartDetected);
    sensor.Start();

    timeOutHandler = setInterval(washingStartTimedOut, convertToMs(config.startTimeTimeoutMinutes));

    sendRequest(">>> Machine configured. Waiting for start... (Let's pray together :pray:)");
}

// Hack: This function is necessary because upon calling "Start", the sensor always fires an event
function configureSensorForWashingStartDetected() {
    console.log("sensor configured for washingStartDetected");
    sensor.SetOnChange(washingStartDetected);
}

function washingStartDetected() {
    // We clear the washingStart interval
    clearInterval(timeOutHandler);

    startTime = new Date();

    // Now the machine is washing, on each movement we reset the counter
    sensor.SetOnChange(resetFinishTimer);
    resetFinishTimer();

    sendRequest("Washing started!");
    say("Washing start, detected!");
}

function washingStartTimedOut() {
    txt.SetText("Washing never started! Still waiting...");
    sendRequest(":warning: Washing never started! Still waiting...");
    say("Washing never started! Still waiting.");
}

// Resets the laundryFinished timers, so it keeps counting
function resetFinishTimer() {
    if (timeOutHandler) clearTimeout(timeOutHandler);
    timeOutHandler = setTimeout(laundryFinished, convertToMs(config.washingThresholdMinutes));

    // We save the last movement time, as the possible finish time, so we'll know exactly
    // when it stopped moving
    finishTime = new Date();

    txt.SetText("Washing for " + getDurationInMinString() + "...");
}

function laundryFinished() {
    sensor.Stop();
    hasFinished = true;

    txt.SetText("Laundry finished!!! Duration: " + getDurationInMinString() + "\nWaiting for mulo...");
    sendRequest("Mulo a colgar la ropa!! :clock3: Duración del lavado: " + getDurationInMinString());
    say("Laundry finished.");

    btn.SetVisibility("Show");
    btnStop.SetVisibility("Hide");

    startReminder();
}

function startReminder() {
    timeOutHandler = setInterval(function () {
        var minsSinceFinish = Math.floor((new Date() - finishTime) / 1000);
        sendRequest(":information_source: Recordá colgar la ropa, hace " + minsSinceFinish + "mins. que terminó!");
        say("Remember, remember the clothes!");
    }, convertToMs(config.reminderIntervalMinutes));

    sensor.SetOnChange(muloDetected);
    sensor.Start();
}

function muloDetected() {
    sensor.Stop();
    clearInterval(timeOutHandler);
    txt.SetText(txt.GetText() + "\nMulo detected!");
    sendRequest(">>> Mulo colgando ropa! :white_check_mark:");
    say("Enjoy. You fucking moolo!")
}

function getDurationInMinString() {
    var duration = (hasFinished ? finishTime : new Date()) - startTime;
    //return Math.floor(duration/1000/60) + " mins."
    return Math.floor(duration / 1000) + " mins."
}

function sendRequest(msg, isResend) {
    /*
    // Mechanism to send chat messages without a bot in slack.
    var httpRequest = new XMLHttpRequest();
    httpRequest.open("POST", "https://slack.com/api/chat.postMessage?token=" + config.slackToken + "&channel=" + channelId + "&text=" + msg + "&as_user=washing_machine", true);
    httpRequest.send(null);
    */

    if (ws.readyState != WebSocket.OPEN) {
        if (!isResend) wsMessages.push(msg);
        return false;
    }

    ws.send(JSON.stringify({
        id: msgId++,
        type: "message",
        channel: channelId,
        text: msg
    }));

    return true;
}

function convertToMs(minutes) {
    //return minutes * 60 * 1000;
    return minutes * 1000; // For testing, uses minutes as seconds
}

function initWebSocket(isReconnect) {

    if (initWebSocketInProgress) return;
    initWebSocketInProgress = true;

    txtConnection.SetText("Connecting...");
    var httpRequest = new XMLHttpRequest();

    httpRequest.onerror = function () {
        txtConnection.SetText("Connection error :'(");

        setTimeout(function () { initWebSocket(true) }, 10 * 1000);

        initWebSocketInProgress = false;
    };

    httpRequest.onload = function (response) {
        var data = JSON.parse(httpRequest.responseText);
        ws = new WebSocket(data.url);

        //channelId = _.find(data.channels, { name: config.slackChannelName }).id;
        channelId = data.channels.filter(function (channel) {
            return channel.name == config.slackChannelName;
        })[0].id;

        ws.onmessage = onWebsocketMessage;

        ws.onclose = function () {
            txtConnection.SetText("Disconnected :(");

            setTimeout(function () { initWebSocket(true) }, 10 * 1000);

            initWebSocketInProgress = false;
        };

        ws.onerror = function () {
            txtConnection.SetText("Connection error :'(");

            setTimeout(function () { initWebSocket(true) }, 10 * 1000);

            initWebSocketInProgress = false;
        };

        ws.onopen = function (e) {
            txtConnection.SetText("Connected :)");
            if (isReconnect) {
                sendRequest("I'm back :space_invader:", true);
            }
            else {
                sendRequest("Hello... boooooo! :ghost:");
            }

            while (wsMessages.length > 0) {
                if (!sendRequest(wsMessages[0], true)) break;

                wsMessages.splice(0, 1);
            }

            initWebSocketInProgress = false;
        };
    };
    httpRequest.open("GET", "https://slack.com/api/rtm.start?token=" + config.slackToken, true);
    httpRequest.send(null);
}

function onWebsocketMessage(event) {
    var data = JSON.parse(event.data);
    if (data.type == "message") {
        var text = data.text;
        console.log(text);
        if (text.indexOf("<@U043RHWNM>") == 0) {
            text = text.slice("<@U043RHWNM>".length).trim();
            if (text.length > 0 && text[0] == ":") {
                text = text.slice(1).trim();
            }

            var command = text.split(" ");

            if (command.length > 0 && command[0] != "") {

                switch (command[0]) {
                    case "time":
                        if (hasFinished) {
                            sendRequest(":clock3: It took me " + getDurationInMinString() + " to do the washing");
                            return;
                        }
                        if (startTime) {
                            sendRequest(":clock3: I've been washing for " + getDurationInMinString() + " :smiley:");
                            return;
                        }
                        sendRequest("I haven't started yet! :smiley_cat:");
                        break;
                    case "say":
                        if (command.length == 1) {
                            sendRequest("What do you want me to say?");
                        }
                        else {
                            say(command.slice(1).join(" "));
                        }

                        break;
                    default:
                        sendRequest("You lost me there (I'm not trained to process that request).");
                        break;
                }
            }
            else {
                sendRequest(":squirrel: I need your clothes, your boots, and your motorcycle!");
            }
        }
    }
}

function say(speech) {
    app.TextToSpeech(speech, 1.0, 1.0);
}