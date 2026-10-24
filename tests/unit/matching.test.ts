import { describe, expect, it } from 'vitest';
import seed from '../../data/faq.seed.json';
import { eligibleFAQs, exactFAQ } from '@/domain/matching';
import type { FAQ } from '@/domain/types';
describe('scope boundaries', () => {
  it('delivers a known exact public Mac question, and excludes Windows and unknown context', () => {
    const faqs = seed.entries as FAQ[];
    const available = eligibleFAQs(faqs, { os: 'macos', distribution: 'public', version: null }, 'edit selected text');
    expect(exactFAQ(available, 'edit selected text')?.id).toBe('kivi-selected-text');
    expect(eligibleFAQs(faqs, { os: 'windows', distribution: 'workshop', version: '1.9.6' }, 'edit selected text')).toEqual([]);
    expect(eligibleFAQs(faqs, { os: 'unknown', distribution: 'unknown', version: null }, 'edit selected text')).toEqual([]);
  });
});
