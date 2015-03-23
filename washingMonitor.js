function washingMonitorSensorCallback(){
    washingMonitor.sensorCallbackFn();
}

(function (washingMonitor){

    washingMonitor.sensorCallbackFn = null;
    var monitor = null;

    //TODO: Values should in caps, right?
    washingMonitor.eventTypes = {
        init: 0,
        start: 1,
        stop: 2,
        waitingWashingStart: 3,
        washingStarted: 4,
        washingNotStarted: 5,
        washingMovement: 6,
        finished: 7,
        finishedReminder: 8,
        personMovement: 9
    };
    
    // Matrix that indicates which callback to call for each eventType    
    var notificationMatrix = {};
    notificationMatrix[washingMonitor.eventTypes.init] = "onInit";        
    notificationMatrix[washingMonitor.eventTypes.start] = "onStart";
    notificationMatrix[washingMonitor.eventTypes.stop] = "onStop";
    notificationMatrix[washingMonitor.eventTypes.waitingWashingStart] = "onWaitingWashingStart";
    notificationMatrix[washingMonitor.eventTypes.washingStarted] = "onWashingStarted";
    notificationMatrix[washingMonitor.eventTypes.washingNotStarted] = "onWashingNotStarted";
    notificationMatrix[washingMonitor.eventTypes.washingMovement] = "onWashingMovement";
    notificationMatrix[washingMonitor.eventTypes.finished] = "onFinished";
    notificationMatrix[washingMonitor.eventTypes.finishedReminder] = "onFinishedReminder";
    notificationMatrix[washingMonitor.eventTypes.personMovement] = "onPersonMovement";

    washingMonitor.init = function(options){

        if (monitor){
            console.log("WashingMonitor already created, returning existing instance.");
            return monitor;
        }

        /* Options
        useSecondsForTime
        */

        var myMonitor = monitor = {};

        var timeOutHandler = null,
            startTimeoutHandler = null,
            sensor = null,
            startTime = null,
            finishTime = null,
            hasFinished = false,
            washingNotStartedCounter = 0,
            finishedReminderCounter = 0;        

        myMonitor.start = function(){
            if (!sensor){
                sensor = app.CreateSensor("Accelerometer");
                sensor.SetOnChange(washingMonitorSensorCallback);
            }

            hasFinished = false;
            washingNotStartedCounter = 0;
            finishedReminderCounter = 0;

            // We start waiting for the machine moving in a few minutes, otherwise
            // we'll still have the cellphone in our hands.
            startTimeoutHandler = setTimeout(waitForStart, convertToMs(options.cellDropTimeoutMinutes));

            // This makes the monitor work when the display goes off
            // maybe this shouldn't be part of the monitor code itself,
            // but otherwise it won't work.
            app.PreventScreenLock("Partial");            
            
            notifyEvent(washingMonitor.eventTypes.start);
        };

        myMonitor.stop = function(){
            if (startTimeoutHandler) clearTimeout(startTimeoutHandler);
            if (timeOutHandler) clearTimeout(timeOutHandler);
            sensor.Stop();

            notifyEvent(washingMonitor.eventTypes.stop);
        };
        
        function waitForStart(){
            washingMonitor.sensorCallbackFn = configureSensorForWashingStarted;
            sensor.Start();

            timeOutHandler = setInterval(washingNotStarted, convertToMs(options.startTimeTimeoutMinutes));

            notifyEvent(washingMonitor.eventTypes.waitingWashingStart);
        }

        // Hack: This function is necessary because upon calling "Start", the sensor always fires an event
        function configureSensorForWashingStarted(){
            washingMonitor.sensorCallbackFn = washingStarted;
        }

        function washingStarted(){
            // We clear the washingStart interval
            clearInterval(timeOutHandler);

            startTime = new Date();

            // Now the machine is washing, on each movement we reset the counter
            washingMonitor.sensorCallbackFn = washingMovementDetected;
            washingMovementDetected();

            notifyEvent(washingMonitor.eventTypes.washingStarted);
        };

        function washingNotStarted(){
            notifyEvent(washingMonitor.eventTypes.washingNotStarted, washingNotStartedCounter++);            
        }

        function washingMovementDetected(){
            // Resets the laundryFinished timers, so it keeps counting
            if (timeOutHandler) clearTimeout(timeOutHandler);
            timeOutHandler = setTimeout(washingFinished, convertToMs(options.washingThresholdMinutes));

            // We save the last movement time, as the possible finish time, so we'll know exactly
            // when it stopped moving
            finishTime = new Date();

            notifyEvent(washingMonitor.eventTypes.washingMovement, getWashingDurationInMinutes());
        }

        function washingFinished(){
            sensor.Stop();
            hasFinished = true;
            startReminder();

            notifyEvent(washingMonitor.eventTypes.finished, getWashingDurationInMinutes());
        }

        function startReminder() {
            timeOutHandler = setInterval(function () {
                var minsSinceFinish = convertToMinutes(new Date() - finishTime);

                notifyEvent(washingMonitor.eventTypes.finishedReminder, minsSinceFinish, finishedReminderCounter++);
            }, convertToMs(options.reminderIntervalMinutes));

            washingMonitor.sensorCallbackFn = personMovementDetected;
            sensor.Start();
        }

        function personMovementDetected() {
            sensor.Stop();
            clearInterval(timeOutHandler);
            
            notifyEvent(washingMonitor.eventTypes.personMovement);
        }

        function getWashingDurationInMinutes() {
            return convertToMinutes((hasFinished ? finishTime : new Date()) - startTime);
        }

        function convertToMs(minutes) {
            return minutes * 1000 * (options.useSecondsInsteadOfMinutes ? 1 : 1000);
        }

        function convertToMinutes(ms) {
            return Math.floor(ms / 1000 / (options.useSecondsInsteadOfMinutes ? 1 : 60));
        }
        
        function notifyEvent(eventType){
            // Transform the arguments to an array, but skipping the first element
            var args = Array.prototype.slice.call(arguments,1);            
            
            var eventHandler = options[notificationMatrix[eventType]];
            if (eventHandler) eventHandler.apply(myMonitor, args);
                        
            // We always call the onEvent callback if it's defined. 
            // Last param is the array of arguments.
            if (options.onEvent) options.onEvent(eventType, args);
        }

        // START OF REMOVE FOR SLACK

        //TODO: Replaces uses of myMonitor.sendRequest
        //TODO: Implement methods in washingMonitor to get time,
        //  state (if it has started, finished, etc)

        // Websocket to slack.
        var ws = null,
            msgId = 1,
            channelId = null,
            wsMessages = [],
            initWebSocketInProgress = false;

        initWebSocket();

        myMonitor.sendRequest = function(msg, isResend) {
            /*
            // Mechanism to send chat messages without a bot in slack.
            var httpRequest = new XMLHttpRequest();
            httpRequest.open("POST", "https://slack.com/api/chat.postMessage?token=" + options.slackToken + "&channel=" + channelId + "&text=" + msg + "&as_user=washing_machine", true);
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

        function initWebSocket(isReconnect) {

            if (initWebSocketInProgress) return;
            initWebSocketInProgress = true;

            //TODO: fix, throw event
            //txtConnection.SetText("Connecting...");
            var httpRequest = new XMLHttpRequest();

            httpRequest.onerror = function () {
                //TODO: fix, throw event
                //txtConnection.SetText("Connection error :'(");

                setTimeout(function () { initWebSocket(true) }, 10 * 1000);

                initWebSocketInProgress = false;
            };

            httpRequest.onload = function (response) {
                var data = JSON.parse(httpRequest.responseText);
                ws = new WebSocket(data.url);

                //channelId = _.find(data.channels, { name: options.slackChannelName }).id;
                channelId = data.channels.filter(function (channel) {
                    return channel.name == options.slackChannelName;
                })[0].id;

                ws.onmessage = onWebsocketMessage;

                ws.onclose = function () {
                    //TODO: fix, throw event
                    //txtConnection.SetText("Disconnected :(");

                    setTimeout(function () { initWebSocket(true) }, 10 * 1000);

                    initWebSocketInProgress = false;
                };

                ws.onerror = function () {
                    //TODO: fix, throw event
                    //txtConnection.SetText("Connection error :'(");

                    setTimeout(function () { initWebSocket(true) }, 10 * 1000);

                    initWebSocketInProgress = false;
                };

                ws.onopen = function (e) {
                    //TODO: fix, throw event
                    //txtConnection.SetText("Connected :)");
                    if (isReconnect) {
                        myMonitor.sendRequest("I'm back :space_invader:", true);
                    }
                    else {
                        myMonitor.sendRequest("Hello... boooooo! :ghost:");
                    }

                    while (wsMessages.length > 0) {
                        if (!myMonitor.sendRequest(wsMessages[0], true)) break;

                        wsMessages.splice(0, 1);
                    }

                    initWebSocketInProgress = false;
                };
            };
            httpRequest.open("GET", "https://slack.com/api/rtm.start?token=" + options.slackToken, true);
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
                                    myMonitor.sendRequest(":clock3: It took me " + getWashingDurationInMinutes() + "mins. to do the washing");
                                    return;
                                }
                                if (startTime) {
                                    myMonitor.sendRequest(":clock3: I've been washing for " + getWashingDurationInMinutes() + "mins. :smiley:");
                                    return;
                                }
                                myMonitor.sendRequest("I haven't started yet! :smiley_cat:");
                                break;
                            case "say":
                                if (command.length == 1) {
                                    myMonitor.sendRequest("What do you want me to say?");
                                }
                                else {
                                    //TODO: This works because the function is global, throw an event instead
                                    say(command.slice(1).join(" "));
                                }

                                break;
                            default:
                                myMonitor.sendRequest("You lost me there (I'm not trained to process that request).");
                                break;
                        }
                    }
                    else {
                        myMonitor.sendRequest(":squirrel: I need your clothes, your boots, and your motorcycle!");
                    }
                }
            }
        }

        // END OF REMOVE FOR SLACK
        
        notifyEvent(washingMonitor.eventTypes.init);

        return myMonitor;
    };

}(this.washingMonitor = this.washingMonitor || {}));
