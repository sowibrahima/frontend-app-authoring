import userEvent from '@testing-library/user-event';
import { getConfig, setConfig } from '@edx/frontend-platform';

import { initializeMocks, render, screen } from '../testUtils';
import WutiskillStudioHomeHeader from './WutiskillStudioHomeHeader';

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

  it('exposes only implemented home navigation and a functional account menu', async () => {
    const user = userEvent.setup();
    render(<WutiskillStudioHomeHeader />, {
      routerProps: { initialEntries: ['/home'] },
    });

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Templates' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Analytics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();

    const menuButton = screen.getByRole('button', { name: 'User menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Studio home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learner dashboard' })).toHaveAttribute(
      'href',
      'https://apps.example.test/learner-dashboard',
    );
    expect(screen.getByRole('link', { name: 'Sign out' })).toHaveAttribute(
      'href',
      'https://lms.example.test/logout',
    );
  });
});
