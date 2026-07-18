import { getConfig, setConfig } from '@edx/frontend-platform';

import { initializeMocks, render, screen } from '../testUtils';
import WutiskillStudioHeader from './WutiskillStudioHeader';

jest.mock('@edx/frontend-component-header', () => function SharedHeaderMock() {
  return <div data-testid="shared-header" />;
});

describe('WutiskillStudioHeader', () => {
  beforeEach(() => {
    initializeMocks();
    setConfig({
      ...getConfig(),
      PUBLIC_PATH: '/authoring/',
      STUDIO_BASE_URL: 'https://studio.example.test',
      ENABLE_CERTIFICATE_PAGE: 'true',
    });
  });

  it('routes every course tab through the authoring MFE', () => {
    render(
      <WutiskillStudioHeader
        contextId="course-v1:WutiSkill+TEST+2026"
        number="TEST"
        org="WutiSkill"
        title="Test course"
      />,
      { routerProps: { initialEntries: ['/course/course-v1:WutiSkill+TEST+2026'] } },
    );

    const expectedPaths = {
      Plan: '',
      'Schedule and details': '/settings/details',
      Grading: '/settings/grading',
      Certificates: '/certificates',
      Files: '/assets',
      'Course team': '/course_team',
      Groups: '/group_configurations',
      Notifications: '/course_info',
      'Import / Export': '/import',
    };

    Object.entries(expectedPaths).forEach(([label, path]) => {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        `/authoring/course/course-v1:WutiSkill+TEST+2026${path}`,
      );
    });

    expect(screen.queryByRole('link', { name: /studio\.example\.test/i })).not.toBeInTheDocument();
  });
});
