import * as reactRedux from 'react-redux';
import { getConfig, setConfig } from '@edx/frontend-platform';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  initializeMocks,
  within,
} from '@src/testUtils';
import { RequestStatus } from '../data/constants';
import { COURSE_CREATOR_STATES } from '../constants';
import studioHomeMock from './__mocks__/studioHomeMock';
import { getStudioHomeApiUrl } from './data/api';
import { StudioHome } from '.';

jest.mock('../header/WutiskillStudioHomeHeader', () => function WutiskillStudioHomeHeaderMock() {
  return <header>WutiSkill</header>;
});

const { studioRequestEmail } = studioHomeMock;

const mockUseSelector = jest.fn();
jest.spyOn(reactRedux, 'useSelector').mockImplementation(mockUseSelector);
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/** Helper function to get the Studio header in the rendered HTML */
function getHeaderElement(): HTMLElement {
  const [header] = screen.getAllByRole('banner');
  expect(header.tagName).toEqual('HEADER');
  return header;
}

describe('<StudioHome />', () => {
  describe('api fetch fails', () => {
    beforeEach(async () => {
      const mocks = initializeMocks();
      mocks.axiosMock.onGet(getStudioHomeApiUrl()).reply(404);
      mockUseSelector.mockReturnValue({ studioHomeLoadingStatus: RequestStatus.FAILED });
    });

    it('should render fetch error', async () => {
      render(<StudioHome />, { path: '/home' });
      expect(screen.getByText('Unable to load Studio. Try again in a few moments.')).toBeInTheDocument();
    });

    it('should render Studio home title', async () => {
      render(<StudioHome />, { path: '/home' });
      // Search only within the header; don't match on the similar text in the body's error message.
      const header = getHeaderElement();
      expect(within(header).getByText('WutiSkill')).toBeInTheDocument();
    });
  });

  describe('api fetch succeeds', () => {
    beforeEach(async () => {
      const mocks = initializeMocks();
      mocks.axiosMock.onGet(getStudioHomeApiUrl()).reply(200, studioHomeMock);
      mockUseSelector.mockReturnValue(studioHomeMock);
    });

    it('should render page and page title correctly', async () => {
      render(<StudioHome />, { path: '/home' });
      const header = getHeaderElement();
      expect(within(header).getByText('WutiSkill')).toBeInTheDocument();
    });

    it('should render "email staff" header button for users without create permission', async () => {
      mockUseSelector.mockReturnValue({
        ...studioHomeMock,
        courseCreatorStatus: COURSE_CREATOR_STATES.disallowedForThisSite,
      });

      render(<StudioHome />, { path: '/home' });
      const link = screen.getByRole('link', { name: 'Contact staff' });
      expect(link).toHaveAttribute('href', `mailto:${studioRequestEmail}`);
    });

    it('should render create new course button for users with create permission', async () => {
      mockUseSelector.mockReturnValue({
        ...studioHomeMock,
        courseCreatorStatus: COURSE_CREATOR_STATES.granted,
      });

      render(<StudioHome />, { path: '/home' });
      screen.getByRole('button', { name: 'Create course' });
    });

    it('should not render the legacy roles and permissions button', async () => {
      setConfig({
        ...getConfig(),
        ADMIN_CONSOLE_URL: 'https://admin-console.example.com',
      });

      render(<StudioHome />, { path: '/home' });
      expect(screen.queryByRole('link', { name: 'Roles and permissions' })).not.toBeInTheDocument();
    });

    it('should show verify email layout if user inactive', async () => {
      mockUseSelector.mockReturnValue({
        ...studioHomeMock,
        userIsActive: false,
      });

      render(<StudioHome />, { path: '/home' });
      screen.getByText('Thanks for signing up, abc123!', { exact: false }); // will error if not found
    });

    it('shows the spinner before the query is complete', async () => {
      mockUseSelector.mockReturnValue({
        studioHomeLoadingStatus: RequestStatus.IN_PROGRESS,
        userIsActive: true,
      });

      render(<StudioHome />, { path: '/home' });
      const spinner = screen.getByRole('status');
      expect(spinner.textContent).toEqual('Loading...');
    });

    describe('render new library button', () => {
      it('should navigate to legacy library creation when libraries-v2 disabled', async () => {
        mockUseSelector.mockReturnValue({
          ...studioHomeMock,
          courseCreatorStatus: COURSE_CREATOR_STATES.granted,
          librariesV2Enabled: false,
        });
        render(<StudioHome />, { path: '/home' });
        await waitFor(() => {
          const createNewLibraryButton = screen.getByRole('button', { name: 'New library' });

          fireEvent.click(createNewLibraryButton);
          expect(mockNavigate).toHaveBeenCalledWith('/libraries-v1/create');
        });
      });

      it('should navigate to the library authoring page in course authoring', async () => {
        mockUseSelector.mockReturnValue({
          ...studioHomeMock,
          librariesV1Enabled: false,
        });
        render(<StudioHome />, { path: '/home' });
        const createNewLibraryButton = screen.getByRole('button', { name: 'New library' });
        fireEvent.click(createNewLibraryButton);
        expect(mockNavigate).toHaveBeenCalledWith('/library/create');
      });
    });

    it('does not render new library button for "v1 only" mode if showNewLibraryButton is False', () => {
      mockUseSelector.mockReturnValue({
        ...studioHomeMock,
        showNewLibraryButton: false,
        librariesV2Enabled: false,
      });
      render(<StudioHome />, { path: '/home' });
      expect(screen.queryByRole('button', { name: 'New library' })).not.toBeInTheDocument();
    });

    it('render new library button for "v2 only" mode even if showNewLibraryButton is False', () => {
      mockUseSelector.mockReturnValue({
        ...studioHomeMock,
        showNewLibraryButton: false,
        librariesV1Enabled: false,
      });
      render(<StudioHome />, { path: '/home' });
      expect(screen.queryByRole('button', { name: 'New library' })).toBeInTheDocument();
    });

    it('should open the WutiSkill course creation wizard', async () => {
      mockUseSelector.mockReturnValue({
        ...studioHomeMock,
        courseCreatorStatus: COURSE_CREATOR_STATES.granted,
      });

      render(<StudioHome />, { path: '/home' });

      const createNewCourseButton = screen.getByRole('button', { name: 'Create course' });
      fireEvent.click(createNewCourseButton);
      expect(mockNavigate).toHaveBeenCalledWith('/home/create-course');
      expect(screen.queryByTestId('create-course-form')).not.toBeInTheDocument();
    });

    describe('contact administrator card', () => {
      const adminCardTitleText = 'Are you a member of an existing course team on Studio?';

      it('should show the "contact administrator" card with no "add course" buttons', () => {
        mockUseSelector.mockReturnValue({
          ...studioHomeMock,
          courses: [],
          courseCreatorStatus: COURSE_CREATOR_STATES.pending,
        });
        render(<StudioHome />, { path: '/home' });
        const administratorCardTitle = screen.getByText(adminCardTitleText);
        expect(administratorCardTitle).toBeVisible();
        expect(screen.queryByText('Create your first course')).not.toBeInTheDocument();
      });

      it('should show contact administrator card with add course buttons', () => {
        mockUseSelector.mockReturnValue({
          ...studioHomeMock,
          courses: [],
          courseCreatorStatus: COURSE_CREATOR_STATES.granted,
        });
        render(<StudioHome />, { path: '/home' });
        const administratorCardTitle = screen.getByText(adminCardTitleText);
        expect(administratorCardTitle).toBeVisible();
        const addCourseButton = screen.getByTestId('contact-admin-create-course');
        expect(addCourseButton).toBeVisible();
        fireEvent.click(addCourseButton);
        expect(mockNavigate).toHaveBeenCalledWith('/home/create-course');
        expect(screen.queryByTestId('create-course-form')).not.toBeInTheDocument();
      });
    });

    it('should show footer', () => {
      render(<StudioHome />, { path: '/home' });
      expect(document.querySelector('.ws-minimal-footer')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Help center' })).toBeInTheDocument();
    });
  });
});
