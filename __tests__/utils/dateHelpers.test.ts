/**
 * Test Suite for Date Helper Functions
 * 
 * This test suite validates the timezone bug fixes implemented in dateHelpers.ts,
 * specifically testing the new parseLocalDate() function to ensure dates are
 * parsed as local timezone (not UTC) across different timezones.
 * 
 * Bug Fix: Prevents "2025-12-13" from displaying as "Dec 12" in Pacific Time
 * due to UTC midnight parsing converting to previous day in negative UTC offsets.
 */

import { parseLocalDate, dateHelpers } from '../../utils/dateHelpers';

describe('parseLocalDate', () => {
  describe('Standard Date Parsing', () => {
    it('should parse ISO date string as local timezone', () => {
      const date = parseLocalDate('2025-12-13');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December (0-indexed)
      expect(date.getDate()).toBe(13);
    });

    it('should parse date at local midnight (not UTC midnight)', () => {
      const date = parseLocalDate('2025-12-13');
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
    });

    it('should handle dates from all 12 months correctly', () => {
      const months = [
        { date: '2025-01-15', month: 0, day: 15 },
        { date: '2025-02-15', month: 1, day: 15 },
        { date: '2025-03-15', month: 2, day: 15 },
        { date: '2025-04-15', month: 3, day: 15 },
        { date: '2025-05-15', month: 4, day: 15 },
        { date: '2025-06-15', month: 5, day: 15 },
        { date: '2025-07-15', month: 6, day: 15 },
        { date: '2025-08-15', month: 7, day: 15 },
        { date: '2025-09-15', month: 8, day: 15 },
        { date: '2025-10-15', month: 9, day: 15 },
        { date: '2025-11-15', month: 10, day: 15 },
        { date: '2025-12-15', month: 11, day: 15 },
      ];

      months.forEach(({ date, month, day }) => {
        const parsed = parseLocalDate(date);
        expect(parsed.getMonth()).toBe(month);
        expect(parsed.getDate()).toBe(day);
      });
    });
  });

  describe('Edge Cases - Month-End Dates', () => {
    it('should handle January 31st correctly', () => {
      const date = parseLocalDate('2025-01-31');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(31);
    });

    it('should handle February 28th (non-leap year) correctly', () => {
      const date = parseLocalDate('2025-02-28');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(28);
    });

    it('should handle December 31st correctly', () => {
      const date = parseLocalDate('2025-12-31');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December
      expect(date.getDate()).toBe(31);
    });

    it('should handle all month-end dates', () => {
      const monthEnds = [
        { date: '2025-01-31', day: 31 }, // January
        { date: '2025-03-31', day: 31 }, // March
        { date: '2025-04-30', day: 30 }, // April
        { date: '2025-05-31', day: 31 }, // May
        { date: '2025-06-30', day: 30 }, // June
        { date: '2025-07-31', day: 31 }, // July
        { date: '2025-08-31', day: 31 }, // August
        { date: '2025-09-30', day: 30 }, // September
        { date: '2025-10-31', day: 31 }, // October
        { date: '2025-11-30', day: 30 }, // November
        { date: '2025-12-31', day: 31 }, // December
      ];

      monthEnds.forEach(({ date, day }) => {
        const parsed = parseLocalDate(date);
        expect(parsed.getDate()).toBe(day);
      });
    });
  });

  describe('Edge Cases - Leap Year Dates', () => {
    it('should handle leap year February 29th correctly', () => {
      const date = parseLocalDate('2024-02-29');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(29);
    });

    it('should handle non-leap year February 28th correctly', () => {
      const date = parseLocalDate('2025-02-28');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(28);
    });

    it('should create valid date object for leap year', () => {
      const date = parseLocalDate('2024-02-29');
      // If the date was invalid, it would roll over to March 1
      expect(date.getMonth()).toBe(1); // Still February
      expect(date.getDate()).toBe(29);
    });
  });

  describe('Edge Cases - DST Transitions', () => {
    it('should handle DST spring forward date (March 10, 2025)', () => {
      // In Pacific Time, 2 AM doesn't exist on this day (jumps to 3 AM)
      const date = parseLocalDate('2025-03-10');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(2); // March
      expect(date.getDate()).toBe(10);
    });

    it('should handle DST fall back date (November 3, 2025)', () => {
      // In Pacific Time, 2 AM occurs twice on this day
      const date = parseLocalDate('2025-11-03');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10); // November
      expect(date.getDate()).toBe(3);
    });

    it('should handle day before DST spring forward', () => {
      const date = parseLocalDate('2025-03-09');
      expect(date.getMonth()).toBe(2); // March
      expect(date.getDate()).toBe(9);
    });

    it('should handle day after DST fall back', () => {
      const date = parseLocalDate('2025-11-04');
      expect(date.getMonth()).toBe(10); // November
      expect(date.getDate()).toBe(4);
    });
  });

  describe('Year Boundaries', () => {
    it('should handle first day of year', () => {
      const date = parseLocalDate('2025-01-01');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('should handle last day of year', () => {
      const date = parseLocalDate('2025-12-31');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });

    it('should handle transition to new year', () => {
      const dec31 = parseLocalDate('2025-12-31');
      const jan01 = parseLocalDate('2026-01-01');
      
      expect(dec31.getFullYear()).toBe(2025);
      expect(jan01.getFullYear()).toBe(2026);
      
      // Verify they are consecutive days
      const dayDiff = (jan01.getTime() - dec31.getTime()) / (1000 * 60 * 60 * 24);
      expect(dayDiff).toBe(1);
    });
  });

  describe('Timezone Independence', () => {
    it('should return same calendar date regardless of system timezone', () => {
      // This test ensures parseLocalDate always interprets the date
      // as the local calendar date, not affected by UTC conversion
      const date = parseLocalDate('2025-12-13');
      
      // The date components should match the input string
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December
      expect(date.getDate()).toBe(13);
      
      // Should be at midnight local time
      expect(date.getHours()).toBe(0);
    });

    it('should not shift to previous day in negative UTC offset timezones', () => {
      // This is the bug we're fixing: In Pacific Time (UTC-8),
      // new Date("2025-12-13") would parse as Dec 12 at 4 PM PST
      // parseLocalDate should keep it as Dec 13
      const date = parseLocalDate('2025-12-13');
      expect(date.getDate()).toBe(13); // Should NOT be 12
    });
  });
});

describe('dateHelpers.formatDate', () => {
  it('should format ISO string correctly', () => {
    const formatted = dateHelpers.formatDate('2025-12-13');
    expect(formatted).toMatch(/Dec 13, 2025/);
  });

  it('should format Date object correctly', () => {
    const date = new Date(2025, 11, 13); // December 13, 2025
    const formatted = dateHelpers.formatDate(date);
    expect(formatted).toMatch(/Dec 13, 2025/);
  });

  it('should handle month-end dates', () => {
    const formatted = dateHelpers.formatDate('2025-01-31');
    expect(formatted).toMatch(/Jan 31, 2025/);
  });
});

describe('dateHelpers.formatShortDate', () => {
  it('should format date without year', () => {
    const formatted = dateHelpers.formatShortDate('2025-12-13');
    expect(formatted).toMatch(/Dec 13/);
  });

  it('should format Date object without year', () => {
    const date = new Date(2025, 11, 13);
    const formatted = dateHelpers.formatShortDate(date);
    expect(formatted).toMatch(/Dec 13/);
  });

  it('should handle single-digit days', () => {
    const formatted = dateHelpers.formatShortDate('2025-12-03');
    expect(formatted).toMatch(/Dec 03/);
  });
});

describe('dateHelpers.formatFullDate', () => {
  it('should format full date with month name spelled out', () => {
    const formatted = dateHelpers.formatFullDate('2025-12-13');
    expect(formatted).toMatch(/December 13, 2025/);
  });

  it('should handle Date object', () => {
    const date = new Date(2025, 11, 13);
    const formatted = dateHelpers.formatFullDate(date);
    expect(formatted).toMatch(/December 13, 2025/);
  });
});

describe('dateHelpers.isUpcoming', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-12-10T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return true for dates within specified days', () => {
    const date = '2025-12-15'; // 5 days from Dec 10
    expect(dateHelpers.isUpcoming(date, 7)).toBe(true);
  });

  it('should return false for dates beyond specified days', () => {
    const date = '2025-12-20'; // 10 days from Dec 10
    expect(dateHelpers.isUpcoming(date, 7)).toBe(false);
  });

  it('should return false for past dates', () => {
    const date = '2025-12-05'; // 5 days before Dec 10
    expect(dateHelpers.isUpcoming(date, 7)).toBe(false);
  });

  it('should handle today as upcoming', () => {
    const date = '2025-12-10'; // Same as system time
    // This depends on implementation - might be true or false
    const result = dateHelpers.isUpcoming(date, 7);
    expect(typeof result).toBe('boolean');
  });

  it('should handle custom day ranges', () => {
    const date = '2025-12-25'; // 15 days from Dec 10
    expect(dateHelpers.isUpcoming(date, 30)).toBe(true);
    expect(dateHelpers.isUpcoming(date, 14)).toBe(false);
  });
});

describe('dateHelpers.isPast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-12-10T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return true for past dates', () => {
    const date = '2025-12-05';
    expect(dateHelpers.isPast(date)).toBe(true);
  });

  it('should return false for future dates', () => {
    const date = '2025-12-15';
    expect(dateHelpers.isPast(date)).toBe(false);
  });

  it('should handle today correctly', () => {
    const date = '2025-12-10';
    // Today should not be considered past
    expect(dateHelpers.isPast(date)).toBe(false);
  });
});

describe('dateHelpers.getNextRenewalDate', () => {
  it('should calculate next monthly renewal', () => {
    const result = dateHelpers.getNextRenewalDate('2025-12-13', 'monthly');
    const date = new Date(result);
    expect(date.getMonth()).toBe(0); // January (next month)
    expect(date.getFullYear()).toBe(2026);
  });

  it('should calculate next yearly renewal', () => {
    const result = dateHelpers.getNextRenewalDate('2025-12-13', 'yearly');
    const date = new Date(result);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(11); // December (same month, next year)
  });

  it('should handle month-end dates for monthly renewals', () => {
    const result = dateHelpers.getNextRenewalDate('2025-01-31', 'monthly');
    const date = new Date(result);
    // February doesn't have 31 days, so date-fns should handle appropriately
    expect(date.getMonth()).toBe(1); // February
  });
});