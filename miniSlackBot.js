(function (miniSlackBot){

    /*
    options = {
        token: '',
        defaultChannelName: 'general',
        events: {
            onConnecting: function () {
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
            }
        }
    };
    */
    miniSlackBot.create = function (options){
        var ws = null, // Websocket to slack.
            msgId = 1,
            defaultChannelId = null,
            botUserId = null,
            wsMessages = [],
            initWebSocketInProgress = false,
            myMiniSlackBot = {};

        if(!options.events) options.events = {};

        myMiniSlackBot.sendMessage = function (msg, channelId){
            return sendMessage (msg, channelId, false);
        };

        initWebSocket();

        function sendMessage (msg, channelId, isResend) {
            /*
            // Mechanism to send chat messages without a bot in slack.
            var httpRequest = new XMLHttpRequest();
            httpRequest.open("POST", "https://slack.com/api/chat.postMessage?token=" + options.token + "&channel=" + (channelId || defaultChannelId) + "&text=" + msg + "&as_user=washing_machine", true);
            httpRequest.send(null);
            */

            if (ws.readyState != WebSocket.OPEN) {
                if (!isResend) wsMessages.push(
                    { message: msg, channelId: channelId });
                return false;
            }

            ws.send(JSON.stringify({
                id: msgId++,
                type: "message",
                channel: channelId || defaultChannelId,
                text: msg
            }));

            return true;
        }

        function initWebSocket(isReconnect) {

            if (initWebSocketInProgress) return;
            initWebSocketInProgress = true;

            fireCallback('onConnecting');

            var httpRequest = new XMLHttpRequest();

            httpRequest.onerror = function () {
                fireCallback('onConnectionError');

                setTimeout(function () { initWebSocket(true) }, 10 * 1000);

                initWebSocketInProgress = false;
            };

            httpRequest.onload = function (response) {
                var data = JSON.parse(httpRequest.responseText);
                ws = new WebSocket(data.url);

                //defaultChannelId = _.find(data.channels, { name: options.defaultChannelName }).id;
                defaultChannelId = data.channels.filter(function (channel) {
                    return channel.name == options.defaultChannelName;
                })[0].id;

                botUserId = data.self.id;

                ws.onmessage = onWebsocketMessage;

                ws.onclose = function () {
                    fireCallback('onConnectionClosed');

                    setTimeout(function () { initWebSocket(true) }, 10 * 1000);

                    initWebSocketInProgress = false;
                };

                ws.onerror = function () {
                    fireCallback('onConnectionError');

                    setTimeout(function () { initWebSocket(true) }, 10 * 1000);

                    initWebSocketInProgress = false;
                };

                ws.onopen = function (e) {
                    fireCallback('onConnectionOpened', isReconnect);

                    while (wsMessages.length > 0) {
                        var message = wsMessages[0];
                        if (!sendMessage(message.msg, message.channelId, true)) break;

                        wsMessages.splice(0, 1);
                    };

                    initWebSocketInProgress = false;
                };
            };
            httpRequest.open("GET", "https://slack.com/api/rtm.start?token=" +
                options.token, true);
            httpRequest.send(null);
        }

        function fireCallback(callbackName){
            var eventHandler = options.events[callbackName];
            if (eventHandler) {
                eventHandler.apply(myMiniSlackBot,
                    // Transform the arguments to an array, but skipping the
                    // first element
                    Array.prototype.slice.call(arguments, 1));
            }
        }

        function onWebsocketMessage(event) {
            var data = JSON.parse(event.data);
            if (data.type == "message") {
                var text = data.text;
                console.log(text);
                if (text.indexOf("<@" + botUserId + ">") == 0) {
                    text = text.slice("<@" + botUserId + ">".length).trim();
                    if (text.length > 0 && text[0] == ":") {
                        text = text.slice(1).trim();
                    }

                    var command = text.split(" ");

                    if (command.length > 0 && command[0] != "") {

                        switch (command[0]) {
                            case "time":
                                if (hasFinished) {
                                    myMiniSlackBot.sendMessage(":clock3: It took me " + "'getWashingDurationInMinutes()'" + "mins. to do the washing");
                                    //miniSlackBotInstance.sendMessage(":clock3: It took me " + getWashingDurationInMinutes() + "mins. to do the washing");
                                    return;
                                }
                                if (startTime) {
                                    myMiniSlackBot.sendMessage(":clock3: I've been washing for " + "'getWashingDurationInMinutes()'" + "mins. :smiley:");
                                    //miniSlackBotInstance.sendMessage(":clock3: I've been washing for " + getWashingDurationInMinutes() + "mins. :smiley:");
                                    return;
                                }
                                myMiniSlackBot.sendMessage("I haven't started yet! :smiley_cat:");
                                //miniSlackBotInstance.sendMessage("I haven't started yet! :smiley_cat:");
                                break;
                            case "say":
                                if (command.length == 1) {
                                    myMiniSlackBot.sendMessage("What do you want me to say?");
                                    //miniSlackBotInstance.sendMessage("What do you want me to say?");
                                }
                                else {
                                    //TODO: This works because the function is global, throw an event instead
                                    say(command.slice(1).join(" "));
                                }

                                break;
                            default:
                                myMiniSlackBot.sendMessage("You lost me there (I'm not trained to process that request).");
                                //miniSlackBotInstance.sendMessage("You lost me there (I'm not trained to process that request).");
                                break;
                        }
                    }
                    else {
                        myMiniSlackBot.sendMessage(":squirrel: I need your clothes, your boots, and your motorcycle!");
                        //miniSlackBotInstance.sendMessage(":squirrel: I need your clothes, your boots, and your motorcycle!");
                    }
                }
            }
        }

        return myMiniSlackBot;
    };

}(this.miniSlackBot = this.miniSlackBot || {}));
