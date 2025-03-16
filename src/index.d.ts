declare module 'endurance-core' {
    export { app } from './lib/app.js';
    export { EnduranceAuth } from './lib/auth.js';
    export { EnduranceSchema, prop, pre, ReturnModelType } from './lib/schema.js';
    export { EnduranceRouter, Request, Response } from './lib/router.js';
    export { enduranceConsumer } from './lib/consumer.js';
    export { enduranceCron } from './lib/cron.js';
    export { enduranceDatabase } from './lib/database.js';
    export { enduranceEmitter, enduranceEventTypes } from './lib/emitter.js';
    export { enduranceListener } from './lib/listener.js';
    export { enduranceNotificationManager } from './lib/notification.js';
    export { enduranceSwagger } from './lib/swagger.js';
}
