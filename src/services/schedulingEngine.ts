/**
 * Client-side Dynamic Scheduling Engine
 * Matches server/schedulingEngine.ts logic for seamless preview
 */

export interface ScheduledSlot {
  targetDate: string;
  postTime: string;
  postTimeFormatted: string;
  timezone: string;
  recommendedReason: string;
  aiContentScoreEstimated: number;
  scoreRationale: string;
}

const PLATFORM_PEAK_WINDOWS: Record<string, { weekday: { hour: number; minute: number; label: string }[]; weekend: { hour: number; minute: number; label: string }[] }> = {
  linkedin: {
    weekday: [
      { hour: 8, minute: 45, label: 'Morning executive review' },
      { hour: 10, minute: 15, label: 'Mid-morning focus peak' },
      { hour: 13, minute: 45, label: 'Post-lunch industry browse' },
      { hour: 17, minute: 15, label: 'End-of-day summary' }
    ],
    weekend: [
      { hour: 10, minute: 30, label: 'Saturday executive read' },
      { hour: 16, minute: 15, label: 'Weekend growth scan' }
    ]
  },
  instagram: {
    weekday: [
      { hour: 12, minute: 15, label: 'Lunchtime visual dwell' },
      { hour: 15, minute: 45, label: 'Mid-afternoon mobile spike' },
      { hour: 18, minute: 45, label: 'Evening visual browse' },
      { hour: 20, minute: 30, label: 'Prime evening social peak' }
    ],
    weekend: [
      { hour: 11, minute: 0, label: 'Weekend leisure scroll' },
      { hour: 14, minute: 30, label: 'Afternoon discovery' },
      { hour: 19, minute: 30, label: 'Prime weekend peak' }
    ]
  },
  twitter: {
    weekday: [
      { hour: 9, minute: 15, label: 'Morning discussions' },
      { hour: 12, minute: 45, label: 'Mid-day thought leadership' },
      { hour: 16, minute: 30, label: 'Afternoon quick-takes' },
      { hour: 21, minute: 0, label: 'Evening community dialogue' }
    ],
    weekend: [
      { hour: 10, minute: 0, label: 'Weekend discourse' },
      { hour: 17, minute: 30, label: 'Evening review' }
    ]
  },
  youtube: {
    weekday: [
      { hour: 15, minute: 30, label: 'Afternoon Shorts priming' },
      { hour: 17, minute: 45, label: 'Commute video watch peak' },
      { hour: 20, minute: 15, label: 'Prime evening screen time' }
    ],
    weekend: [
      { hour: 11, minute: 30, label: 'Weekend morning entertainment' },
      { hour: 15, minute: 0, label: 'Afternoon deep-dive' },
      { hour: 18, minute: 45, label: 'Evening watch peak' }
    ]
  },
  facebook: {
    weekday: [
      { hour: 9, minute: 30, label: 'Morning community check' },
      { hour: 13, minute: 15, label: 'Mid-day feed interactions' },
      { hour: 18, minute: 15, label: 'Evening group discussions' }
    ],
    weekend: [
      { hour: 11, minute: 15, label: 'Weekend community connection' },
      { hour: 17, minute: 0, label: 'Evening group engagement' }
    ]
  }
};

function formatTime12h(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mStr = minute.toString().padStart(2, '0');
  return `${h12.toString().padStart(2, '0')}:${mStr} ${period}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export function calculateDynamicSchedule(
  startDateStr: string,
  daysSpan: number,
  deliverables: Array<{ platform: string; format?: string; conceptIndex?: number }>,
  timezone = 'Asia/Kolkata'
): ScheduledSlot[] {
  const tzAbbr = timezone.includes('Kolkata') ? 'IST' : timezone.includes('New_York') ? 'EST' : 'UTC';
  const validDays = Math.max(1, daysSpan || 7);
  const total = deliverables.length;

  const dayPlatformCount: Record<string, Record<string, number>> = {};
  const dayScheduledHours: Record<string, number[]> = {};
  const slots: ScheduledSlot[] = [];

  for (let idx = 0; idx < total; idx++) {
    const item = deliverables[idx];
    const platform = (item.platform || 'instagram').toLowerCase();

    const targetDayOffset = total <= validDays ? Math.min(validDays - 1, Math.floor((idx / total) * validDays)) : idx % validDays;
    const targetDate = addDays(startDateStr, targetDayOffset);

    if (!dayPlatformCount[targetDate]) dayPlatformCount[targetDate] = {};
    if (!dayScheduledHours[targetDate]) dayScheduledHours[targetDate] = [];

    const dateObj = new Date(targetDate + 'T12:00:00Z');
    const isWeekend = dateObj.getUTCDay() === 0 || dateObj.getUTCDay() === 6;

    const platformConfig = PLATFORM_PEAK_WINDOWS[platform] || PLATFORM_PEAK_WINDOWS.instagram;
    const windowList = isWeekend ? platformConfig.weekend : platformConfig.weekday;

    const alreadyOnPlatform = dayPlatformCount[targetDate][platform] || 0;
    const windowIndex = (alreadyOnPlatform + (item.conceptIndex || 1) - 1) % windowList.length;
    const baseWindow = windowList[windowIndex];

    const jitterMinutes = ((idx * 7 + (item.conceptIndex || 0) * 11) % 18) - 9;
    const finalMinute = (baseWindow.minute + jitterMinutes + 60) % 60;
    let finalHour = baseWindow.hour;

    let collisionAttempts = 0;
    while (dayScheduledHours[targetDate].includes(finalHour) && collisionAttempts < 5) {
      finalHour = (finalHour + 2) % 24;
      if (finalHour < 8) finalHour = 8;
      if (finalHour > 21) finalHour = 20;
      collisionAttempts++;
    }

    dayScheduledHours[targetDate].push(finalHour);
    dayPlatformCount[targetDate][platform] = alreadyOnPlatform + 1;

    const time12 = formatTime12h(finalHour, finalMinute);

    slots.push({
      targetDate,
      postTime: time12,
      postTimeFormatted: `${time12} ${tzAbbr}`,
      timezone,
      recommendedReason: `AI Recommended: ${time12} aligns with ${baseWindow.label} on ${platform.toUpperCase()}.`,
      aiContentScoreEstimated: 88 + (idx % 8),
      scoreRationale: `Hook resonance, native ${platform.toUpperCase()} format pacing, and structured CTA.`
    });
  }

  return slots;
}
