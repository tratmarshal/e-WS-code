// ========== auth.gs ==========
// ตรวจสอบสิทธิ์เจ้าหน้าที่ตำรวจศาล

function getAuthorizationStatus(userId) {
  const cleanUserId = normalizeText_(userId);
  if (!cleanUserId) return "unauthorized";
  return AUTHORIZED_USERS.indexOf(cleanUserId) !== -1 ? "authorized" : "unauthorized";
}

function isAuthorizedUser(userId) {
  return getAuthorizationStatus(userId) === "authorized";
}
