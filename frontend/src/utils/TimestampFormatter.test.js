import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import formatTimestamp from './TimestampFormatter';

describe('formatTimestamp', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows seconds for under a minute', () => {
        expect(formatTimestamp('2026-10-06T11:59:30Z')).toBe('30s');
    });

    it('shows minutes for under an hour', () => {
        expect(formatTimestamp('2026-10-06T11:15:00Z')).toBe('45m');
    });

    it('shows hours for under a day', () => {
        expect(formatTimestamp('2026-10-06T07:00:00Z')).toBe('5h');
    });

    it('adds the year for older years', () => {
        expect(formatTimestamp('2024-02-09T12:00:00Z')).toMatch(/2024/);
    });

    it('shows 0s for a future date instead of a negative number', () => {
        expect(formatTimestamp('2026-10-06T12:05:00Z')).toBe('0s');
    });
});
