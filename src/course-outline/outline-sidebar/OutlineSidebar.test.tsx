import { userEvent } from '@testing-library/user-event';

import {
  initializeMocks,
  render,
  screen,
  waitFor,
  within,
} from '@src/testUtils';
import { CourseAuthoringProvider } from '@src/CourseAuthoringContext';
import { CourseOutlineProvider } from '@src/course-outline/CourseOutlineContext';

import { OutlineSidebarProvider } from './OutlineSidebarContext';
import { OutlineSidebarPagesProvider } from './OutlineSidebarPagesContext';
import OutlineSidebar from './OutlineSidebar';

// Mock the useCourseDetails hook
jest.mock('@src/course-outline/data/apiHooks', () => ({
  useCourseDetails: jest.fn().mockReturnValue({ isPending: false, data: { title: 'Test Course' } }),
  useCreateCourseBlock: jest.fn(),
  useCourseItemData: jest.fn().mockReturnValue({ data: {} }),
  useDuplicateItem: jest.fn().mockReturnValue({ duplicateItem: jest.fn() }),
  useDeleteCourseItem: jest.fn().mockReturnValue({ mutateAsync: jest.fn() }),
}));

const courseId = '123';

const extraWrapper = ({ children }) => (
  <CourseAuthoringProvider courseId={courseId}>
    <CourseOutlineProvider>
      <OutlineSidebarPagesProvider>
        <OutlineSidebarProvider>
          {children}
        </OutlineSidebarProvider>
      </OutlineSidebarPagesProvider>
    </CourseOutlineProvider>
  </CourseAuthoringProvider>
);

const renderComponent = () =>
  render(
    <OutlineSidebar />,
    { extraWrapper },
  );

describe('<OutlineSidebar>', () => {
  beforeEach(() => {
    initializeMocks();
  });

  it('should render the sidebar only after the user opens it', async () => {
    renderComponent();

    const sidebarToggle = screen.getByTestId('sidebar-toggle');
    expect(sidebarToggle).toBeInTheDocument();
    expect(screen.queryByText('Test Course')).not.toBeInTheDocument();

    const toggleButton = within(sidebarToggle).getByRole('button', { name: 'Toggle' });
    expect(toggleButton).toBeInTheDocument();
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });

    // Change page
    await userEvent.click(screen.getByRole('button', { name: 'Help' }));

    // Check that the help page is rendered
    expect(screen.getByText('Creating your course organization')).toBeInTheDocument();

    // The explicit toggle still closes the sidebar.
    await userEvent.click(toggleButton);
    expect(screen.queryByText('Creating your course organization')).not.toBeInTheDocument();
  });
});
