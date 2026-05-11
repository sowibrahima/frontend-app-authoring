import { useLocation } from 'react-router-dom';
import CourseAuthoringRoutes from './CourseAuthoringRoutes';
import { getApiWaffleFlagsUrl } from './data/api';
import {
  screen, initializeMocks, render, waitFor,
} from './testUtils';

const courseId = 'course-v1:edX+TestX+Test_Course';
const pagesAndResourcesMockText = 'Pages And Resources';
const editorContainerMockText = 'Editor Container';
const videoSelectorContainerMockText = 'Video Selector Container';
const customPagesMockText = 'Custom Pages';
const mockComponentFn = jest.fn();

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    courseId,
  }),
}));

jest.mock('./CourseAuthoringPage', () => function CourseAuthoringPageMock(props) {
  // eslint-disable-next-line react/prop-types
  return <div>{props.children}</div>;
});

jest.mock('./files-and-videos', () => ({
  FilesPage: () => <div>Files Page</div>,
  VideosPage: () => <div>Videos Page</div>,
}));

jest.mock('./course-outline', () => ({
  CourseOutline: () => <div>Course Outline</div>,
}));

jest.mock('./course-unit', () => ({
  CourseUnit: () => <div>Course Unit</div>,
  SubsectionUnitRedirect: () => <div>Subsection Unit Redirect</div>,
}));

// Mock the TinyMceWidget
jest.mock('./editors/sharedComponents/TinyMceWidget', () => ({
  __esModule: true, // Required to mock a default export
  default: () => <div>Widget</div>,
  Footer: () => <div>Footer</div>,
  prepareEditorRef: jest.fn(() => ({
    refReady: true,
    setEditorRef: jest.fn().mockName('prepareEditorRef.setEditorRef'),
  })),
}));

jest.mock('./pages-and-resources/PagesAndResources', () => (props) => {
  mockComponentFn(props);
  return pagesAndResourcesMockText;
});
jest.mock('./editors/EditorContainer', () => (props) => {
  mockComponentFn(props);
  return editorContainerMockText;
});
jest.mock('./selectors/VideoSelectorContainer', () => (props) => {
  mockComponentFn(props);
  return videoSelectorContainerMockText;
});
jest.mock('./custom-pages/CustomPages', () => (props) => {
  mockComponentFn(props);
  return customPagesMockText;
});

describe('<CourseAuthoringRoutes>', () => {
  beforeEach(async () => {
    const { axiosMock } = initializeMocks();
    axiosMock
      .onGet(getApiWaffleFlagsUrl(courseId))
      .reply(200, {});
  });

  it('redirects away from PagesAndResources when the pages and resources route is active', async () => {
    render(
      <>
        <CourseAuthoringRoutes />
        <LocationDisplay />
      </>,
      { routerProps: { initialEntries: ['/pages-and-resources'] } },
    );
    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(`/course/${courseId}`);
      expect(screen.queryByText(pagesAndResourcesMockText)).not.toBeInTheDocument();
    });
  });

  it('renders the EditorContainer component when the course editor route is active', async () => {
    render(
      <CourseAuthoringRoutes />,
      { routerProps: { initialEntries: ['/editor/video/block-id'] } },
    );
    await waitFor(() => {
      expect(screen.queryByText(editorContainerMockText)).toBeInTheDocument();
      expect(screen.queryByText(pagesAndResourcesMockText)).not.toBeInTheDocument();
      expect(mockComponentFn).toHaveBeenCalledWith(
        expect.objectContaining({
          learningContextId: courseId,
        }),
      );
    });
  });

  it('renders the VideoSelectorContainer component when the course videos route is active', async () => {
    render(
      <CourseAuthoringRoutes />,
      { routerProps: { initialEntries: ['/editor/course-videos/block-id'] } },
    );
    await waitFor(() => {
      expect(screen.queryByText(videoSelectorContainerMockText)).toBeInTheDocument();
      expect(screen.queryByText(pagesAndResourcesMockText)).not.toBeInTheDocument();
      expect(mockComponentFn).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId,
        }),
      );
    });
  });
});
