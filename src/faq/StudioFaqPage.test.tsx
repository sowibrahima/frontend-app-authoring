import userEvent from '@testing-library/user-event';

import StudioFaqPage from './StudioFaqPage';
import {
  initializeMocks,
  render,
  screen,
} from '../testUtils';

describe('<StudioFaqPage />', () => {
  beforeEach(() => {
    initializeMocks();
  });

  it('renders collapsed instructor FAQ items that can be opened', async () => {
    render(<StudioFaqPage />);

    expect(screen.getByRole('heading', { name: 'Instructor questions' })).toBeVisible();

    const details = document.querySelectorAll('.ws-studio-faq-page__item');
    expect(details).toHaveLength(4);
    details.forEach((item) => expect(item).not.toHaveAttribute('open'));

    const firstQuestion = screen.getByText('How do I create a new course in Studio?');
    const firstAnswer = screen.getByText(/From the Studio dashboard/);

    expect(firstQuestion).toBeVisible();
    expect(firstAnswer).not.toBeVisible();

    await userEvent.click(firstQuestion);
    expect(firstAnswer).toBeVisible();
  });
});
