const cron = require("node-cron");
const { emitter, eventTypes } = require("./emitter");

const loadCrons = () => {
  // Define your cron job
  /*cron.schedule("0 7 * * 1-5", () => {
    // This function will be executed every day at 09:00 AM in the local timezone
    emitter.emit(eventTypes.MORNING_MESSAGE, {});
  });
  cron.schedule("0 10 * * 1-5", () => {
    // This function will be executed every day at 12:00 PM from Monday to Friday in the local timezone
    emitter.emit(eventTypes.LUNCH_MESSAGE, {});
  });
  cron.schedule("0 16 * * 1-5", () => {
    // This function will be executed every day at 6:00 PM from Monday to Friday in the local timezone
    emitter.emit(eventTypes.EVENING_MESSAGE, {});
  });*/
  /*emitter.emit(eventTypes.NEW_HOUR);
  cron.schedule('0 * * * *', () => {
    // This function will be executed every hour at the beginning of the hour
    emitter.emit(eventTypes.NEW_HOUR);
  });*/

};

module.exports = {
  loadCrons,
};
