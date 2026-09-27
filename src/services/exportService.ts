import { SocialAsset } from '../types/campaign';

/**
 * Converts the social assets list into a CSV format ready for Google Sheets
 */
export function exportToGoogleSheetsCSV(assets: SocialAsset[]): string {
  const headers = [
    'Asset Code',
    'Title',
    'Target Date',
    'Time (IST)',
    'Primary Platform',
    'Secondary Platforms',
    'Format',
    'Stream',
    'Species Code',
    'Status',
    'Virality Score',
    'Hook',
    'Caption',
    'Call to Action',
    'Hashtags',
    'Target Persona',
    'Estimated Impressions',
    'Expected Leads',
    'Design System Verified'
  ];

  const rows = assets.map(asset => [
    `"${asset.assetCode}"`,
    `"${asset.title.replace(/"/g, '""')}"`,
    `"${asset.targetDate}"`,
    `"${asset.postTimeIST}"`,
    `"${asset.platform.toUpperCase()}"`,
    `"${(asset.secondaryPlatforms || []).join(', ').toUpperCase()}"`,
    `"${asset.format.toUpperCase()}"`,
    `"${asset.stream}"`,
    `"${asset.speciesCode}"`,
    `"${asset.status.toUpperCase()}"`,
    asset.viralityScore,
    `"${asset.hook.replace(/"/g, '""')}"`,
    `"${asset.caption.replace(/"/g, '""')}"`,
    `"${asset.callToAction.replace(/"/g, '""')}"`,
    `"${asset.hashtags.map(h => '#' + h).join(' ')}"`,
    `"${asset.targetBuyerPersona.replace(/"/g, '""')}"`,
    asset.estimatedImpressions,
    asset.expectedLeads,
    asset.designSystemVerified ? 'YES' : 'NO'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Converts assets to TSV for instant clipboard copy-paste directly into Google Sheets
 */
export function exportToGoogleSheetsTSV(assets: SocialAsset[]): string {
  const headers = [
    'Asset Code',
    'Title',
    'Target Date',
    'Time (IST)',
    'Platform',
    'Format',
    'Species',
    'Status',
    'Virality',
    'Hook',
    'CTA',
    'Target Persona',
    'Est. Impressions'
  ];

  const rows = assets.map(a => [
    a.assetCode,
    a.title,
    a.targetDate,
    a.postTimeIST,
    a.platform.toUpperCase(),
    a.format.toUpperCase(),
    a.speciesCode,
    a.status.toUpperCase(),
    `${a.viralityScore}/100`,
    a.hook,
    a.callToAction,
    a.targetBuyerPersona,
    a.estimatedImpressions.toLocaleString()
  ]);

  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

/**
 * Triggers a browser download of the CSV file
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an iCalendar (.ics) format string for Google Calendar import
 */
export function generateICS(assets: SocialAsset[]): string {
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apex Engineering//Social Campaign Master Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Apex Engineering Content Calendar'
  ];

  assets.forEach(asset => {
    // Basic date parsing
    const dateClean = asset.targetDate.replace(/-/g, '');
    const uid = `${asset.id}@apex-engineering.co.in`;
    const summary = `[${asset.platform.toUpperCase()} ${asset.format.toUpperCase()}] ${asset.title}`;
    const description = `SPECIES: ${asset.speciesCode}\\nSTATUS: ${asset.status.toUpperCase()}\\nVIRALITY SCORE: ${asset.viralityScore}/100\\n\\nHOOK:\\n${asset.hook}\\n\\nCTA:\\n${asset.callToAction}`;

    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dateClean}T060000Z`,
      `DTSTART;VALUE=DATE:${dateClean}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

import { AUTONOMA_APPS_SCRIPT_CONNECTOR } from './autonomaGoogleAppsScript';

/**
 * Free Google Apps Script code snippet for the user to paste into their Google Sheet
 * to enable real-time 2-way sync across all 8 tables without paid middleware!
 */
export const GOOGLE_APPS_SCRIPT_CONNECTOR_CODE = AUTONOMA_APPS_SCRIPT_CONNECTOR;
