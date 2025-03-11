const notificationTypes = new Set();
const registeredNotifications = new Map();

const sendNotification = (type: any, options: any) => {
  const normalizedType = type.toLowerCase();
  if (!notificationTypes.has(normalizedType)) {
    throw new Error(`Notification type "${type}" is not registered.`);
  }
  const notificationHandler = registeredNotifications.get(normalizedType);
  if (notificationHandler) {
    notificationHandler(options);
  } else {
    throw new Error(`No handler found for notification type "${type}".`);
  }
};

const registerNotification = (type: any, handler: any) => {
  const normalizedType = type.toLowerCase();
  if (notificationTypes.has(normalizedType)) {
    throw new Error(`Notification type "${type}" is already registered.`);
  } else {
    notificationTypes.add(normalizedType);
    registeredNotifications.set(normalizedType, handler);
  }
};

export {
  sendNotification,
  registerNotification
};
