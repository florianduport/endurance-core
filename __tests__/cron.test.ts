import cron from 'node-cron';
import { emitter } from '../src/lib/emitter';
import { loadCronJob } from '../src/lib/cron';
import { jest } from '@jest/globals'

jest.mock('node-cron', () => {
    const originalModule = jest.requireActual<typeof cron>('node-cron');
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
        (cron.validate as jest.Mock).mockReturnValue(false);

        expect(() => loadCronJob('testJob', 'invalid-cron-time', jest.fn<() => Promise<void>>().mockResolvedValue())).toThrow('Invalid cron time format');
    });

    it('should schedule a cron job if cron time format is valid', () => {
        (cron.validate as jest.Mock).mockReturnValue(true);
        const taskFunction = jest.fn<() => Promise<void>>().mockResolvedValue();

        loadCronJob('testJob', '* * * * *', taskFunction);

        expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
    });

    it('should emit events before and after the task function is executed', async () => {
        (cron.validate as jest.Mock).mockReturnValue(true);
        const taskFunction = jest.fn<() => Promise<void>>();

        loadCronJob('testJob', '* * * * *', taskFunction);

        const scheduledFunction = (cron.schedule as jest.Mock).mock.calls[0][1] as () => Promise<void>;

        await scheduledFunction();

        expect(emitter.emit).toHaveBeenCalledWith('TESTJOB_CRONSTART');
        expect(taskFunction).toHaveBeenCalled();
        expect(emitter.emit).toHaveBeenCalledWith('TESTJOB_CRONEND');
    });
});