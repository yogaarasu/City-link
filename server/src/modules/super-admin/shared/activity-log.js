const MAX_LOGS = 50;

export const appendUserActivityLog = (userDoc, action, message, metadata = {}) => {
  if (!userDoc) return;

  const logs = Array.isArray(userDoc.activityLogs) ? userDoc.activityLogs : [];
  logs.unshift({
    action,
    message,
    metadata,
    createdAt: new Date(),
  });

  userDoc.activityLogs = logs.slice(0, MAX_LOGS);
};
