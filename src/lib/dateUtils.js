// lib/dateUtils.js
export function toUTCDateOnly(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Optional: add more helpers
export function formatDateISO(date) {
  return toUTCDateOnly(date).toISOString().split("T")[0]; // "2024-06-15"
}

export function isSameDate(date1, date2) {
  const d1 = toUTCDateOnly(date1);
  const d2 = toUTCDateOnly(date2);
  return d1.getTime() === d2.getTime();
}

export function addHoursToTime(timeStr, hoursToAdd) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  let totalMinutes = hours * 60 + minutes;

  totalMinutes += Math.round(hoursToAdd * 60);
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0"
  )}`;
}

export function checkTimePeriodAvailability(
  workload,
  requestedStart,
  requestedEnd
) {
  // Parse requested times into minutes since midnight
  const [reqStartH, reqStartM] = requestedStart.split(":").map(Number);
  const [reqEndH, reqEndM] = requestedEnd.split(":").map(Number);

  // Validate time format
  if (
    isNaN(reqStartH) ||
    isNaN(reqStartM) ||
    isNaN(reqEndH) ||
    isNaN(reqEndM) ||
    reqStartH < 0 ||
    reqStartH > 23 ||
    reqEndH < 0 ||
    reqEndH > 23 ||
    reqStartM < 0 ||
    reqStartM > 59 ||
    reqEndM < 0 ||
    reqEndM > 59
  ) {
    return {
      available: false,
      reason: "Invalid time format. Please use HH:mm (e.g., 14:30).",
    };
  }

  const reqStartMinutes = reqStartH * 60 + reqStartM;
  const reqEndMinutes = reqEndH * 60 + reqEndM;

  // Validate: end must be after start
  if (reqEndMinutes <= reqStartMinutes) {
    return {
      available: false,
      reason: "End time must be after start time.",
    };
  }

  // Business hours: 9:00 (540 min) to 20:00 (1200 min)
  const OPEN_TIME = 9 * 60; // 540 minutes
  const CLOSE_TIME = 20 * 60; // 1200 minutes

  // Check business hours
  if (reqStartMinutes < OPEN_TIME) {
    return {
      available: false,
      reason: "We open at 9:00. Please select a time from 9:00 onwards.",
    };
  }
  if (reqEndMinutes > CLOSE_TIME) {
    return {
      available: false,
      reason: "We close at 20:00. Please finish your appointment by 20:00.",
    };
  }

  // Check against existing reservations
  for (const item of workload) {
    const from = item.time_period?.from;
    const to =
      item.time_period?.to || new Date(from.getTime() + 60 * 60 * 1000); // +1h fallback

    if (!from) continue; // Skip invalid entries

    const existingStart = from.getUTCHours() * 60 + from.getUTCMinutes();
    const existingEnd = to.getUTCHours() * 60 + to.getUTCMinutes();

    // Overlap condition: !(reqEnd <= existingStart || reqStart >= existingEnd)
    if (reqStartMinutes < existingEnd && reqEndMinutes > existingStart) {
      return {
        available: false,
        reason: "This time slot is already booked. Please choose another time.",
      };
    }
  }

  return {
    available: true,
    reason: null,
  };
}
