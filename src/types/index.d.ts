declare module 'endurance-core' {
    export { app } from './internal/app';

    export {
        EnduranceAuthMiddleware,
        EnduranceAccessControl,
        EnduranceAuth
    } from './core/auth';

    export {
        EnduranceSchema,
        EnduranceModel,
        EnduranceDocumentType,
        EnduranceModelType,
        ObjectId,
        Ref
    } from './core/schema';

    export {
        EnduranceRouter,
        EnduranceRequest,
        Response,
        NextFunction,
        SecurityOptions,
        FileUploadConfig
    } from './core/router';

    export { enduranceConsumer } from './core/consumer';

    export { enduranceCron } from './infra/cron';
    export { enduranceDatabase } from './infra/database';
    export { enduranceSwagger } from './infra/swagger';

    export {
        enduranceEmitter,
        enduranceEventTypes
    } from './core/emitter';

    export { enduranceListener } from './core/listener';

    export { enduranceNotificationManager } from './core/notification';
}
