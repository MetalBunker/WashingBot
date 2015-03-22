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
        slackToken: '',
        slackChannelName: 'general'
};