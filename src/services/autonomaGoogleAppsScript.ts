/**
 * AUTONOMA DURABLE OPERATIONAL DATABASE
 * Google Apps Script Web App Backend Engine
 * 
 * Provides atomic, structured operations across 8 tables:
 * 1. CAMPAIGNS
 * 2. ASSETS
 * 3. MEDIA
 * 4. PUBLISHING
 * 5. PERFORMANCE
 * 6. DAILY_SNAPSHOTS
 * 7. SETTINGS
 * 8. ACTIVITY_LOG
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste this entire code into Code.gs
 * 4. Deploy > New deployment > Select type: Web app
 * 5. Execute as: "Me" | Who has access: "Anyone"
 * 6. Copy the Web app URL and paste into Autonoma Settings -> Google Sheets URL
 */

export const AUTONOMA_APPS_SCRIPT_CONNECTOR = `/**
 * APEX AUTONOMA — DURABLE OPERATIONAL DATABASE CONNECTOR
 * Multi-Table Google Sheets Engine (8 Core Tables)
 * Zero external middleware (Zapier/n8n) required. Free forever.
 */

var SCHEMAS = {
  CAMPAIGNS: [
    "campaignId", "organizationId", "name", "brief", "objective", "status",
    "startDate", "endDate", "platforms", "duration", "audience", "marketInsight",
    "valueProposition", "contentPillars", "postingCadence", "createdAt", "updatedAt"
  ],
  ASSETS: [
    "assetId", "campaignId", "organizationId", "title", "hook", "strategicPurpose",
    "angle", "platform", "format", "contentStream", "speciesCode", "funnelStage",
    "targetDate", "targetTime", "caption", "hashtags", "cta", "carouselSlidesJson",
    "reelScript", "storyboardJson", "imagePrompt", "videoPrompt", "approvalStatus",
    "mediaStatus", "aiContentScore", "aiScoreRationale", "createdAt", "updatedAt"
  ],
  MEDIA: [
    "mediaId", "assetId", "campaignId", "type", "model", "prompt", "version",
    "fileUrl", "thumbnailUrl", "generationStatus", "approvalStatus", "createdAt"
  ],
  PUBLISHING: [
    "publicationId", "assetId", "campaignId", "platform", "platformPostId",
    "publishedUrl", "scheduledAt", "publishedAt", "publishingMethod", "status"
  ],
  PERFORMANCE: [
    "performanceId", "publicationId", "assetId", "campaignId", "platform", "capturedAt",
    "impressions", "reach", "videoViews", "watchTime", "likes", "comments",
    "shares", "saves", "clicks", "profileVisits", "followersGained", "leads", "engagementRate"
  ],
  DAILY_SNAPSHOTS: [
    "snapshotId", "publicationId", "assetId", "platform", "snapshotDate",
    "impressions", "reach", "videoViews", "likes", "comments",
    "shares", "saves", "clicks", "followersGained"
  ],
  SETTINGS: [
    "organizationId", "organizationName", "brandName", "website",
    "timezone", "defaultPlatforms", "brandConfigJson", "updatedAt"
  ],
  ACTIVITY_LOG: [
    "logId", "organizationId", "entityType", "entityId",
    "action", "source", "timestamp", "detailsJson"
  ]
};

function initAllSheets(doc) {
  var created = [];
  for (var table in SCHEMAS) {
    var sheet = doc.getSheetByName(table);
    if (!sheet) {
      sheet = doc.insertSheet(table);
      var headers = SCHEMAS[table];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#14161B");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
      created.push(table);
    }
  }
  return created;
}

function getOrInitSheet(doc, tableName) {
  var sheet = doc.getSheetByName(tableName);
  if (!sheet) {
    sheet = doc.insertSheet(tableName);
    var headers = SCHEMAS[tableName];
    if (headers) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#14161B");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function sheetToObjects(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var lastCol = headers.length;
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var results = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    // Ignore completely empty rows
    if (!row[0] && !row[1] && !row[2]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== undefined ? row[j] : "";
    }
    results.push(obj);
  }
  return results;
}

function upsertRowById(sheet, headers, idField, record) {
  var lastRow = sheet.getLastRow();
  var idValue = record[idField];
  var targetRow = -1;

  if (lastRow > 1) {
    var idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idColValues.length; i++) {
      if (String(idColValues[i][0]) === String(idValue)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  var rowValues = [];
  for (var j = 0; j < headers.length; j++) {
    var val = record[headers[j]];
    if (val === undefined || val === null) {
      val = "";
    } else if (typeof val === "object") {
      val = JSON.stringify(val);
    }
    rowValues.push(val);
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
    return { action: "updated", row: targetRow };
  } else {
    sheet.appendRow(rowValues);
    return { action: "created", row: sheet.getLastRow() };
  }
}

function batchUpsertRows(sheet, headers, idField, records) {
  if (!records || records.length === 0) return { updated: 0, created: 0 };
  
  var lastRow = sheet.getLastRow();
  var idMap = {};
  if (lastRow > 1) {
    var existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingIds.length; i++) {
      var id = String(existingIds[i][0]);
      if (id) idMap[id] = i + 2;
    }
  }

  var updatedCount = 0;
  var toAppend = [];

  for (var r = 0; r < records.length; r++) {
    var rec = records[r];
    var idVal = String(rec[idField] || "");
    var rowValues = [];
    for (var j = 0; j < headers.length; j++) {
      var val = rec[headers[j]];
      if (val === undefined || val === null) {
        val = "";
      } else if (typeof val === "object") {
        val = JSON.stringify(val);
      }
      rowValues.push(val);
    }

    if (idVal && idMap[idVal]) {
      var rowIdx = idMap[idVal];
      sheet.getRange(rowIdx, 1, 1, headers.length).setValues([rowValues]);
      updatedCount++;
    } else {
      toAppend.push(rowValues);
    }
  }

  if (toAppend.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, toAppend.length, headers.length).setValues(toAppend);
  }

  return { updated: updatedCount, created: toAppend.length };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(15000);
  if (!hasLock) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Spreadsheet is currently locked by another operation. Please retry.",
      code: "LOCK_TIMEOUT"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    initAllSheets(doc);

    var rawContents = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var payload = JSON.parse(rawContents);
    var action = payload.action;

    var result = { success: true, action: action, timestamp: new Date().toISOString() };

    switch (action) {
      case "PING":
        result.data = { status: "ready", sheetName: doc.getName(), timezone: doc.getSpreadsheetTimeZone() };
        break;

      case "INIT_DATABASE":
        result.data = { initializedSheets: initAllSheets(doc) };
        break;

      case "GET_CAMPAIGNS":
        var sheetC = getOrInitSheet(doc, "CAMPAIGNS");
        result.data = sheetToObjects(sheetC, SCHEMAS.CAMPAIGNS);
        break;

      case "GET_CAMPAIGN":
        var sheetCId = getOrInitSheet(doc, "CAMPAIGNS");
        var allC = sheetToObjects(sheetCId, SCHEMAS.CAMPAIGNS);
        var foundC = null;
        for (var c = 0; c < allC.length; c++) {
          if (allC[c].campaignId === payload.campaignId) {
            foundC = allC[c];
            break;
          }
        }
        result.data = foundC;
        break;

      case "CREATE_CAMPAIGN":
      case "UPDATE_CAMPAIGN":
        var sheetSaveC = getOrInitSheet(doc, "CAMPAIGNS");
        result.data = upsertRowById(sheetSaveC, SCHEMAS.CAMPAIGNS, "campaignId", payload.campaign);
        break;

      case "GET_ASSETS":
        var sheetA = getOrInitSheet(doc, "ASSETS");
        result.data = sheetToObjects(sheetA, SCHEMAS.ASSETS);
        break;

      case "GET_ASSETS_BY_CAMPAIGN":
        var sheetACamp = getOrInitSheet(doc, "ASSETS");
        var allAssets = sheetToObjects(sheetACamp, SCHEMAS.ASSETS);
        result.data = allAssets.filter(function(a) { return a.campaignId === payload.campaignId; });
        break;

      case "CREATE_ASSET":
      case "UPDATE_ASSET":
        var sheetSaveA = getOrInitSheet(doc, "ASSETS");
        result.data = upsertRowById(sheetSaveA, SCHEMAS.ASSETS, "assetId", payload.asset);
        break;

      case "BATCH_SAVE_ASSETS":
        var sheetBatchA = getOrInitSheet(doc, "ASSETS");
        result.data = batchUpsertRows(sheetBatchA, SCHEMAS.ASSETS, "assetId", payload.assets || []);
        break;

      case "CREATE_MEDIA_RECORD":
      case "UPDATE_MEDIA_RECORD":
        var sheetMed = getOrInitSheet(doc, "MEDIA");
        result.data = upsertRowById(sheetMed, SCHEMAS.MEDIA, "mediaId", payload.media);
        break;

      case "CREATE_PUBLICATION":
      case "UPDATE_PUBLICATION":
        var sheetPub = getOrInitSheet(doc, "PUBLISHING");
        result.data = upsertRowById(sheetPub, SCHEMAS.PUBLISHING, "publicationId", payload.publication);
        break;

      case "UPSERT_PERFORMANCE":
        var sheetPerf = getOrInitSheet(doc, "PERFORMANCE");
        result.data = upsertRowById(sheetPerf, SCHEMAS.PERFORMANCE, "performanceId", payload.performance);
        break;

      case "CREATE_DAILY_SNAPSHOT":
        var sheetSnap = getOrInitSheet(doc, "DAILY_SNAPSHOTS");
        result.data = upsertRowById(sheetSnap, SCHEMAS.DAILY_SNAPSHOTS, "snapshotId", payload.snapshot);
        break;

      case "GET_SETTINGS":
        var sheetSet = getOrInitSheet(doc, "SETTINGS");
        var sets = sheetToObjects(sheetSet, SCHEMAS.SETTINGS);
        result.data = sets.length > 0 ? sets[0] : null;
        break;

      case "UPDATE_SETTINGS":
        var sheetSetSave = getOrInitSheet(doc, "SETTINGS");
        result.data = upsertRowById(sheetSetSave, SCHEMAS.SETTINGS, "organizationId", payload.settings);
        break;

      case "WRITE_ACTIVITY_LOG":
        var sheetLog = getOrInitSheet(doc, "ACTIVITY_LOG");
        result.data = upsertRowById(sheetLog, SCHEMAS.ACTIVITY_LOG, "logId", payload.log);
        break;

      case "SYNC_ALL":
        result.data = {
          campaigns: sheetToObjects(getOrInitSheet(doc, "CAMPAIGNS"), SCHEMAS.CAMPAIGNS),
          assets: sheetToObjects(getOrInitSheet(doc, "ASSETS"), SCHEMAS.ASSETS),
          media: sheetToObjects(getOrInitSheet(doc, "MEDIA"), SCHEMAS.MEDIA),
          publishing: sheetToObjects(getOrInitSheet(doc, "PUBLISHING"), SCHEMAS.PUBLISHING),
          performance: sheetToObjects(getOrInitSheet(doc, "PERFORMANCE"), SCHEMAS.PERFORMANCE),
          dailySnapshots: sheetToObjects(getOrInitSheet(doc, "DAILY_SNAPSHOTS"), SCHEMAS.DAILY_SNAPSHOTS),
          settings: sheetToObjects(getOrInitSheet(doc, "SETTINGS"), SCHEMAS.SETTINGS)[0] || null
        };
        break;

      default:
        result.success = false;
        result.error = "Unknown action requested: " + action;
        result.code = "INVALID_ACTION";
        break;
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString(),
      code: "EXECUTION_ERROR"
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "PING";
  return doPost({
    postData: {
      contents: JSON.stringify({ action: action })
    }
  });
}
`;
