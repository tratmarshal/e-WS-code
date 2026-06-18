// ========== auth.gs ==========
// ตรวจสอบสิทธิ์เจ้าหน้าที่ตำรวจศาล

function getAuthorizationStatus(userId) {
  const cleanUserId = normalizeText_(userId);
  if (!cleanUserId) return "unauthorized";
  return AUTHORIZED_USERS.indexOf(cleanUserId) !== -1 ? "authorized" : "unauthorized";
}

function getVerifiedLineProfile_(accessToken) {
  const token = normalizeText_(accessToken);
  if (!token) throw new Error("Missing LINE access token");

  const response = UrlFetchApp.fetch("https://api.line.me/v2/profile", {
    method: "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error("Invalid LINE access token");
  return JSON.parse(response.getContentText());
}

function isAuthorizedUser(userId) {
  return getAuthorizationStatus(userId) === "authorized";
}
