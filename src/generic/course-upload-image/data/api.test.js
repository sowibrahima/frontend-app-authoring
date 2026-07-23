import { initializeMockApp } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import MockAdapter from 'axios-mock-adapter';

import { getUploadAssetsUrl, uploadAssets } from './api';

describe('course image upload API', () => {
  let axiosMock;

  beforeEach(() => {
    initializeMockApp();
    axiosMock = new MockAdapter(getAuthenticatedHttpClient());
  });

  afterEach(() => {
    axiosMock.restore();
  });

  it('explicitly uploads course presentation images as public assets', async () => {
    const courseId = 'course-v1:WutiSkill+Demo+2026';
    const fileData = new FormData();
    fileData.append('file', new File(['image'], 'course.jpg', { type: 'image/jpeg' }));
    axiosMock.onPost(getUploadAssetsUrl(courseId).href).reply(200, {
      asset: { locked: false },
    });

    await uploadAssets(courseId, fileData);

    expect(axiosMock.history.post).toHaveLength(1);
    expect(axiosMock.history.post[0].data.get('locked')).toBe('false');
  });
});
