import type { IntlShape } from 'react-intl';

import { getReleaseInfo } from './utils';

describe('getReleaseInfo', () => {
  const formatMessage = jest.fn((_message, values) => values?.sectionName);
  const intl = { formatMessage } as unknown as IntlShape;

  beforeEach(() => {
    formatMessage.mockClear();
  });

  it('decodes HTML entities in the inherited section label', () => {
    const result = getReleaseInfo(
      intl,
      'Jun 01, 2026 at 00:00 UTC',
      'Section &quot;INTRODUCTION &quot;',
    );

    expect(result).toMatchObject({
      isScheduled: true,
      releaseDateFrom: 'Section "INTRODUCTION"',
      sectionNameMessage: 'Section "INTRODUCTION"',
    });
  });
});
