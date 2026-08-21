import { describe, it, expect } from 'vitest';
import { attachmentDisplayName } from './attachments';

describe('attachmentDisplayName', () => {
  it('strips a numeric timestamp prefix from the path tail', () => {
    expect(attachmentDisplayName('abc/1700000000000-report.pdf')).toBe('report.pdf');
  });

  it('returns the filename as-is when there is no timestamp prefix', () => {
    expect(attachmentDisplayName('abc/report.pdf')).toBe('report.pdf');
  });

  it('works for a bare filename with no slash', () => {
    expect(attachmentDisplayName('report.pdf')).toBe('report.pdf');
  });
});
