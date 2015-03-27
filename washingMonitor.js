(function (washingMonitor){

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

    // TODO: Rename this, it's not a matrix!
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
            // For now, because of a limitation with the sensor callback, we can
            // only have one monitor alive. Maybe this will improve in the future.
            console.log("WashingMonitor already created, returning existing instance.");
            return monitor;
        }

        var myMonitor = monitor = {};

        var timeOutHandler = null,
            startTimeoutHandler = null,
            sensor = null,
            startTime = null,
            finishTime = null,
            hasFinished = false,
            washingNotStartedCounter = 0,
            finishedReminderCounter = 0,
            sensorCallbackFn = null; // Rhino hack, look at bottom

        myMonitor.start = function(){
            if (!sensor){
                sensor = app.CreateSensor("Accelerometer");
                sensor.SetOnChange(washingMonitorSensorCallback);
            }

            hasFinished = false;
            washingNotStartedCounter = 0;
            finishedReminderCounter = 0;

            // We don't start waiting for the machine to move right away, otherwise
            // we would still have the cellphone in our hands.
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

        // TODO: Review, maybe this could be improved
        myMonitor.hasFinished = function (){
            return hasFinished;
        };

        // TODO: Review, maybe this could be improved
        myMonitor.getStartTime = function (){
            return startTime;
        };

        // TODO: Review, maybe this could be improved
        myMonitor.getWashingDurationInMinutes = function (){
            return getWashingDurationInMinutes();
        };

        // Rhino hack, look at bottom
        myMonitor.fireSensorCallback = function(x, y, z){
            if (checkMovementThreshold(x, y, z)) sensorCallbackFn(x, y, z);
        };

        // TODO: Implement this function
        function checkMovementThreshold(x, y, z){
            return true;
        }

        function waitForStart(){
            sensorCallbackFn = configureSensorForWashingStarted;
            sensor.Start();

            timeOutHandler = setInterval(washingNotStarted, convertToMs(options.startTimeTimeoutMinutes));

            notifyEvent(washingMonitor.eventTypes.waitingWashingStart);
        }

        // Hack: This function is necessary because upon calling sensor.Start(),
        // it always seems to fire a false event
        function configureSensorForWashingStarted(){
            sensorCallbackFn = washingStarted;
        }

        function washingStarted(x, y, z){
            // We clear the washingStart interval
            clearInterval(timeOutHandler);

            startTime = new Date();

            // Now the machine is washing, on each movement we need to reset the
            // finish timeout
            sensorCallbackFn = washingMovementDetected;
            washingMovementDetected(x, y, z);

            notifyEvent(washingMonitor.eventTypes.washingStarted);
        };

        function washingNotStarted(){
            notifyEvent(washingMonitor.eventTypes.washingNotStarted, washingNotStartedCounter++);
        }

        function washingMovementDetected(x, y, z){
            // Resets the washingFinished timer, so it keeps counting. When
            // it fires, the washing will have finished.
            if (timeOutHandler) clearTimeout(timeOutHandler);
            timeOutHandler = setTimeout(washingFinished, convertToMs(options.washingThresholdMinutes));

            // We save the last movement time, as the possible finish time,
            // so we'll know exactly when it stopped moving
            finishTime = new Date();

            notifyEvent(washingMonitor.eventTypes.washingMovement, getWashingDurationInMinutes(), x, y, z);
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

            sensorCallbackFn = personMovementDetected;
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
            return minutes * 1000 * (options.useSecondsInsteadOfMinutes ? 1 : 60);
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

        notifyEvent(washingMonitor.eventTypes.init);

        return myMonitor;
    };

    // Rhino hack, look at bottom
    washingMonitor.fireSensorCallback = function(x, y, z){
        if (monitor) monitor.fireSensorCallback(x, y, z);
    };

}(this.washingMonitor = this.washingMonitor || {}));

// This function is a needed hack due to the limitation in the bridge between Java
// and javascript.
// Rhino can only call functions that are defined in the global scope (defined,
// declared, written (anonymous functions, or injected ones them won't work
// either)), that's specially important to have in mind when we need to pass
// functions as callbacks to objects that live on the Java realm, as the sensor
// in this case.
// So, as we are using the module pattern in washingMonitor, our functions live
// inside a closure and can't be called by Rhino. As a workaround, we setup this
// global washingMonitorSensorCallback function as the forever callback for our
// sensor, and inside the monitor we just set the sensorCallbackFn var to select
// which function should be executed as a callback.
function washingMonitorSensorCallback(x, y, z){
    washingMonitor.fireSensorCallback(x, y, z);
}
