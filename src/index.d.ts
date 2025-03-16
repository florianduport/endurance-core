declare module 'endurance-core' {
    export { app } from './lib/app.js';
    export { auth, accessControl } from './lib/auth.js';
    export { enduranceConsumer } from './lib/consumer.js';
    export { enduranceCron } from './lib/cron.js';
    export { enduranceDatabase } from './lib/database.js';
    export { EnduranceSchema, prop, pre } from './lib/schema.js';
    export { enduranceEmitter, enduranceEventTypes } from './lib/emitter.js';
    export { enduranceListener } from './lib/listener.js';
    export { enduranceNotificationManager } from './lib/notification.js';
    export { createRouter, Request, Response } from './lib/router.js';
    export { enduranceSwagger } from './lib/swagger.js';
}
