import {
  fireEvent,
  initializeMocks,
  render,
  screen,
} from '@src/testUtils';
import { COURSE_CREATOR_STATES } from '@src/constants';
import { RequestStatus } from '@src/data/constants';
import { type DeprecatedReduxState } from '@src/store';
import studioHomeMock from '@src/studio-home/__mocks__/studioHomeMock';
import { initialState } from '../../factories/mockApiResponses';

import { CoursesList as CoursesTab } from '.';
import { studioHomeCoursesRequestParamsDefault } from '../../data/slice';

type StudioHomeState = DeprecatedReduxState['studioHome'];
type CoursesTabProps = React.ComponentProps<typeof CoursesTab>;
type StudioHomeStateOverride = {
  loadingStatuses?: Partial<StudioHomeState['loadingStatuses']>;
  studioHomeData?: Partial<StudioHomeState['studioHomeData']>;
  studioHomeCoursesRequestParams?: Partial<StudioHomeState['studioHomeCoursesRequestParams']>;
};

const onClickNewCourse = jest.fn();

const renderComponent = (
  overrideProps: Partial<CoursesTabProps> = {},
  studioHomeState: StudioHomeStateOverride = {},
) => {
  const customInitialState: Partial<DeprecatedReduxState> = {
    ...initialState,
    studioHome: {
      ...initialState.studioHome,
      loadingStatuses: {
        ...initialState.studioHome.loadingStatuses,
        courseLoadingStatus: RequestStatus.SUCCESSFUL,
        ...studioHomeState.loadingStatuses,
      },
      studioHomeData: {
        ...studioHomeMock,
        courseCreatorStatus: COURSE_CREATOR_STATES.granted,
        coursesCount: studioHomeMock.courses.length,
        numPages: 1,
        ...studioHomeState.studioHomeData,
      },
      studioHomeCoursesRequestParams: {
        ...studioHomeCoursesRequestParamsDefault,
        ...studioHomeState.studioHomeCoursesRequestParams,
      },
    },
  };

  const { reduxStore: store } = initializeMocks({ initialState: customInitialState });

  return {
    ...render(
      <CoursesTab
        showNewCourseContainer
        onClickNewCourse={onClickNewCourse}
        {...overrideProps}
      />,
    ),
    store,
  };
};

describe('<CoursesTab />', () => {
  it('should render correctly', async () => {
    renderComponent();
    const coursesPaginationInfo = screen.getByTestId('pagination-info');
    const coursesFilterSearchInput = screen.getByTestId('input-filter-courses-search');
    expect(coursesPaginationInfo).toBeInTheDocument();
    expect(coursesFilterSearchInput).toBeInTheDocument();
    expect(document.querySelector('.ws-home-courses-grid')).toBeInTheDocument();
  });

  it('uses the standalone WutiSkill pagination styles', () => {
    renderComponent({}, {
      studioHomeData: {
        numPages: 3,
      },
    });

    expect(document.querySelector('.ws-home-courses-pagination')).toBeInTheDocument();
  });

  it('should render loading spinner when isLoading is true and isFiltered is false', () => {
    renderComponent({}, {
      loadingStatuses: { courseLoadingStatus: RequestStatus.IN_PROGRESS },
      studioHomeCoursesRequestParams: { currentPage: 1, isFiltered: false },
    });
    const loadingSpinner = screen.getByRole('status');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('should render an error message when something went wrong', () => {
    renderComponent({}, {
      loadingStatuses: { courseLoadingStatus: RequestStatus.FAILED },
      studioHomeCoursesRequestParams: { currentPage: 1, isFiltered: false },
    });
    const alertErrorFailed = screen.queryByTestId('error-failed-message');
    expect(alertErrorFailed).toBeInTheDocument();
  });

  it('should render an alert message when there is not courses found', () => {
    renderComponent({}, {
      studioHomeData: { courses: [], coursesCount: 0 },
      studioHomeCoursesRequestParams: { currentPage: 1, isFiltered: true },
    });
    const alertCoursesNotFound = screen.queryByTestId('courses-not-found-alert');
    expect(alertCoursesNotFound).toBeInTheDocument();
  });

  it('should render processing courses component when isEnabledPagination is false and isShowProcessing is true', () => {
    const props = { isShowProcessing: true };
    const customStoreData = {
      studioHomeData: {
        inProcessCourseActions: [],
      },
      studioHomeCoursesRequestParams: {
        currentPage: 1,
        isFiltered: true,
      },
    };
    renderComponent(props, customStoreData);
    const alertCoursesNotFound = screen.queryByTestId('processing-courses-title');
    expect(alertCoursesNotFound).toBeInTheDocument();
  });

  it('should render CollapsibleStateWithAction when courseCreatorStatus is true', () => {
    const props = { isShowProcessing: true };
    const customStoreData = {
      studioHomeData: {
        inProcessCourseActions: [],
        courseCreatorStatus: COURSE_CREATOR_STATES.denied,
      },
    };
    renderComponent(props, customStoreData);
    const collapsibleStateWithAction = screen.queryByTestId('collapsible-state-with-action');
    expect(collapsibleStateWithAction).toBeInTheDocument();
  });

  it('should reset filters when in pressed the button to clean them', () => {
    const customStoreData = {
      studioHomeData: { courses: [], coursesCount: 0 },
      studioHomeCoursesRequestParams: { currentPage: 1, isFiltered: true },
    };
    const { store } = renderComponent({}, customStoreData);
    const cleanFiltersButton = screen.getByRole('button', { name: /reset filters/i });
    expect(cleanFiltersButton).toBeInTheDocument();

    fireEvent.click(cleanFiltersButton!);

    const state = store.getState();
    expect(state.studioHome.studioHomeCoursesRequestParams).toStrictEqual(studioHomeCoursesRequestParamsDefault);
  });
});
