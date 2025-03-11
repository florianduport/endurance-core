import EventEmitter from 'events';

const createEmitter = () => {
  const emitter = new EventEmitter();

  const eventTypes = {};

  const eventTypesProxy = new Proxy(eventTypes, {
    get: function (target, name) {
      // @ts-expect-error TS(2339): Property 'toUpperCase' does not exist on type 'str... Remove this comment to see the full error message
      const upperName = name.toUpperCase();
      if (!(upperName in target)) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        target[upperName] = upperName;
      }
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      return target[upperName];
    }
  });

  const anyListeners: any = [];

  // @ts-expect-error TS(2339): Property 'onAny' does not exist on type 'EventEmit... Remove this comment to see the full error message
  emitter.onAny = (callback: any) => {
    anyListeners.push(callback);
  };

  // @ts-expect-error TS(2339): Property 'offAny' does not exist on type 'EventEmi... Remove this comment to see the full error message
  emitter.offAny = (callback: any) => {
    const index = anyListeners.indexOf(callback);
    if (index !== -1) {
      anyListeners.splice(index, 1);
    }
  };

  const originalEmit = emitter.emit;
  // @ts-expect-error TS(2322): Type '<K>(eventName: string | symbol, ...args: Any... Remove this comment to see the full error message
  emitter.emit = function (eventName, ...args) {
    // @ts-expect-error TS(7006): Parameter 'callback' implicitly has an 'any' type.
    anyListeners.forEach(callback => callback(eventName, ...args));
    originalEmit.apply(emitter, [eventName, ...args]);
  };

  return { emitter, eventTypes: eventTypesProxy };
};

const emitterInstance = createEmitter();

export const emitter = emitterInstance.emitter;
export const eventTypes = emitterInstance.eventTypes;
