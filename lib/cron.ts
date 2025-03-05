import cron from "node-cron";
import { emitter } from "./emitter.js";

const loadCronJob = (name, cronTime, taskFunction) => {
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
  loadCronJob,
};
