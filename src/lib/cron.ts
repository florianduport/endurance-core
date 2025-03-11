import cron from 'node-cron';
import { emitter } from './emitter.js';

// Définition du type ScheduledTask
type ScheduledTask = {
  stop: () => void;
  // Ajoutez d'autres propriétés si nécessaire
};

const loadCronJob = (name: string, cronTime: string, taskFunction: () => Promise<void>) => {
  if (!cron.validate(cronTime)) {
    throw new Error('Invalid cron time format');
  }

  const upperName = name.toUpperCase();

  cron.schedule(cronTime, async () => {
    emitter.emit(`${upperName}_CRONSTART`);
    try {
      await taskFunction();
    } catch (error) {
      console.error(`Error executing task for ${upperName}:`, error);
    } finally {
      emitter.emit(`${upperName}_CRONEND`);
    }
  });
};

const unloadCronJob = (name: string) => {
  const upperName = name.toUpperCase();
  const scheduledTasks = cron.getTasks(); // Hypothetical method to get all scheduled tasks

  // Utilisation de Map.prototype.forEach pour parcourir les tâches
  let taskToStop: ScheduledTask | undefined;
  scheduledTasks.forEach((task, taskName) => {
    if (taskName === upperName) {
      taskToStop = task;
    }
  });

  if (taskToStop) {
    taskToStop.stop(); // Hypothetical method to stop the task
    emitter.emit(`${upperName}_CRONUNLOAD`);
  } else {
    console.warn(`No scheduled task found for ${upperName}`);
  }
};

export {
  loadCronJob,
  unloadCronJob
};
