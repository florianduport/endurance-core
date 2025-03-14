import cron from 'node-cron';
import { enduranceEmitter } from './emitter.js';

interface ScheduledTask {
  stop: () => void;
}

class EnduranceCron {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();

  public loadCronJob(name: string, cronTime: string, taskFunction: () => Promise<void>): void {
    if (!cron.validate(cronTime)) {
      throw new Error('Invalid cron time format');
    }

    const upperName = name.toUpperCase();

    const task = cron.schedule(cronTime, async () => {
      enduranceEmitter.emit(`${upperName}_CRONSTART`);
      try {
        await taskFunction();
      } catch (error) {
        console.error(`Error executing task for ${upperName}:`, error);
      } finally {
        enduranceEmitter.emit(`${upperName}_CRONEND`);
      }
    });

    this.scheduledTasks.set(upperName, task);
  }

  public unloadCronJob(name: string): void {
    const upperName = name.toUpperCase();
    const taskToStop = this.scheduledTasks.get(upperName);

    if (taskToStop) {
      taskToStop.stop();
      this.scheduledTasks.delete(upperName);
      enduranceEmitter.emit(`${upperName}_CRONUNLOAD`);
    } else {
      console.warn(`No scheduled task found for ${upperName}`);
    }
  }
}

export const enduranceCron = new EnduranceCron();
