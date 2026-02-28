export const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  const { password, isDeleted, deletedAt, ...safeUser } = user;
  if (!safeUser.role) {
    safeUser.role = "citizen";
  }
  return safeUser;
};
