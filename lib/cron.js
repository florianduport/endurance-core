const cron = require("node-cron");
const { emitter } = require("./emitter");

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

module.exports = {
  loadCronJob,
};
