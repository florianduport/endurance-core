import cron from 'node-cron';
import { emitter } from '../src/lib/emitter';
import { loadCronJob } from '../src/lib/cron';
import { jest } from '@jest/globals';
jest.mock('node-cron', () => {
    const originalModule = jest.requireActual('node-cron');
    return {
        ...originalModule,
        schedule: jest.fn(),
        validate: jest.fn(),
    };
});
jest.mock('../src/lib/emitter', () => ({
    emitter: {
        emit: jest.fn(),
    },
}));
describe('loadCronJob', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should throw an error if cron time format is invalid', () => {
        cron.validate.mockReturnValue(false);
        expect(() => loadCronJob('testJob', 'invalid-cron-time', jest.fn().mockResolvedValue())).toThrow('Invalid cron time format');
    });
    it('should schedule a cron job if cron time format is valid', () => {
        cron.validate.mockReturnValue(true);
        const taskFunction = jest.fn().mockResolvedValue();
        loadCronJob('testJob', '* * * * *', taskFunction);
        expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
    });
    it('should emit events before and after the task function is executed', async () => {
        cron.validate.mockReturnValue(true);
        const taskFunction = jest.fn();
        loadCronJob('testJob', '* * * * *', taskFunction);
        const scheduledFunction = cron.schedule.mock.calls[0][1];
        await scheduledFunction();
        expect(emitter.emit).toHaveBeenCalledWith('TESTJOB_CRONSTART');
        expect(taskFunction).toHaveBeenCalled();
        expect(emitter.emit).toHaveBeenCalledWith('TESTJOB_CRONEND');
    });
});
