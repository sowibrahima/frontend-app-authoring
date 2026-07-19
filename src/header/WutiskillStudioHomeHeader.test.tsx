import { getConfig, setConfig } from '@edx/frontend-platform';

import { initializeMocks, render, screen } from '../testUtils';
import WutiskillStudioHomeHeader from './WutiskillStudioHomeHeader';

const sharedHeaderMock = jest.fn();
jest.mock('@edx/frontend-component-header', () => function SharedHeaderMock(props) {
  sharedHeaderMock(props);
  return (
    <header>
      {props.mainMenuItems.map(item => (
        <a key={item.href} href={item.href}>{item.content}</a>
      ))}
    </header>
  );
});

describe('WutiskillStudioHomeHeader', () => {
  beforeEach(() => {
    initializeMocks({ user: { userId: 7, username: 'Ibrahima Sow' } });
    setConfig({
      ...getConfig(),
      LEARNER_DASHBOARD_URL: 'https://apps.example.test/learner-dashboard',
      LMS_BASE_URL: 'https://lms.example.test',
      LOGOUT_URL: 'https://lms.example.test/logout',
    });
  });

  it('delegates navigation and the account menu to the shared header', async () => {
    render(<WutiskillStudioHomeHeader />, {
      routerProps: { initialEntries: ['/home'] },
    });

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Templates' })).toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(sharedHeaderMock).toHaveBeenCalledWith(expect.objectContaining({
      showStudioLinkInUserMenu: false,
      userMenuVariant: 'default',
      secondaryMenuItems: [],
    }));
  });
});
