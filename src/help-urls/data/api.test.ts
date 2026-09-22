import { initializeMocks } from '@src/testUtils';
import { getHelpUrls, getHelpUrlsApiUrl } from './api';

describe('help URLs API', () => {
  it('shares concurrent requests and retries after a failure', async () => {
    const { axiosMock } = initializeMocks();
    const url = getHelpUrlsApiUrl();
    axiosMock.onGet(url).replyOnce(500);
    const failed = await Promise.allSettled([getHelpUrls(), getHelpUrls()]);
    expect(failed.map(result => result.status)).toEqual(['rejected', 'rejected']);
    expect(axiosMock.history.get).toHaveLength(1);
    axiosMock.onGet(url).reply(200, { course_checklist: '/help/checklist' });
    expect(await getHelpUrls()).toEqual({ courseChecklist: '/help/checklist' });
    expect(axiosMock.history.get).toHaveLength(2);
  });
});
