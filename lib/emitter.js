const EventEmitter = require('events');
const emitter = new EventEmitter();

const eventTypes = {
    // Add your event types here
    LINKEDIN_SEARCH_CREATED: 'LINKEDIN_SEARCH_CREATED',
    APP_STARTED: 'APP_STARTED',
};

// Export the emitter object
module.exports = { emitter, eventTypes };
