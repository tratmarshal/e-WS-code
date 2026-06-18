// ========== code.gs ==========
// Web App API Gateway

function doPost(e) {
  let action = "unknown";
  let userId = "";
  let displayName = "";
  let page = "unknown";
  let authStatus = "unauthorized";

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ success: false, error: "No data received" });
    }

    const data = JSON.parse(e.postData.contents);
    action = data.action || "unknown";
    const verifiedProfile = getVerifiedLineProfile_(data.accessToken);
    userId = verifiedProfile.userId || "";
    displayName = verifiedProfile.displayName || data.displayName || "";
    page = data.page || "unknown";
    const payload = data.payload || data;

    authStatus = getAuthorizationStatus(userId);
    logActivity(userId, displayName, page, action, authStatus, "request");

    if (authStatus !== "authorized") {
      return jsonResponse_({ success: false, error: "Unauthorized user" });
    }

    let result;
    switch (action) {
      case "search":
        result = searchWarrant(payload.searchType, payload.keyword);
        break;
      case "getPending":
        result = getPendingProcess();
        break;
      case "addProcess":
        result = addProcessRecord(userId, payload);
        break;
      case "syncProcessing":
        result = autoUpdateWarrantDatabase();
        break;
      case "markRevoked":
        result = markProcessRevoked(payload.rowId, userId);
        break;
      case "markForwarded":
        result = markProcessForwarded(payload.rowId, userId);
        break;
      default:
        result = { success: false, error: "Invalid action" };
    }

    logActivity(userId, displayName, page, action, authStatus, result.success === false ? (result.error || "failed") : "success");
    return jsonResponse_(result);
  } catch (err) {
    const message = err.message || String(err);
    logActivity(userId, displayName, page, action, authStatus, message);
    return jsonResponse_({ success: false, error: message });
  }
}

function doGet() {
  return jsonResponse_({ success: true, message: "Warrant Tracker API is running" });
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
