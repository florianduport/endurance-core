// @ts-expect-error TS(7016): Could not find a declaration file for module 'node... Remove this comment to see the full error message
import cron from 'node-cron';
import { emitter } from './emitter.js';

const loadCronJob = (name: any, cronTime: any, taskFunction: any) => {
  if (!cron.validate(cronTime)) {
    throw new Error('Invalid cron time format');
  }

  const upperName = name.toUpperCase();

  cron.schedule(cronTime, async () => {
    emitter.emit(`${upperName}_CRONSTART`);
    try {
      await taskFunction();
    } finally {
      emitter.emit(`${upperName}_CRONEND`);
    }
  });
};

export {
  loadCronJob
};
