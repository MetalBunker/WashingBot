// Config options object
var config = {
        // How much to wait for the cell to be placed on the machine
        cellDropTimeoutMinutes: 5,
        // How much to wait for the machine to start (after cell has been placed)
        startTimeTimeoutMinutes: 5,
        // How much to wait before deciding the washing has finished
        washingThresholdMinutes: 10,
        // How often to remember that the washing has finished
        reminderIntervalMinutes: 10,
        // Indicates if all the events, methods, etc, will return seconds
        // instead of minutes for reporting time, also the config values will
        // be considered as seconds instead of minutes. Useful for testing.
        useSecondsInsteadOfMinutes: false,
        // Slack config
        slackToken: '',
        slackChannelName: 'general',
        // Indicates if udp updates with accelerometer values should be sent
        sendUdpUpdates: true,
        udpPort: 47624,
        // If this IP is not present (undefined or null), broadcast ip will be used
        udpIpAddress: null
};
