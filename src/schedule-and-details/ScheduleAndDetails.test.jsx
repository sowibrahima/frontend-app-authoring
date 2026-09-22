// @ts-check
import {
  act,
  initializeMocks,
  render,
  waitFor,
  fireEvent,
} from '@src/testUtils';
import { executeThunk } from '@src/utils';
import { DATE_FORMAT } from '@src/constants';
import { getCourseSettingsApiUrl } from '@src/data/api';
import { mockWaffleFlags } from '@src/data/apiHooks.mock';
import { useCourseUserPermissions } from '@src/authz/hooks';

import { courseDetailsMock, courseSettingsMock } from './__mocks__';
import { getCourseDetailsApiUrl } from './data/api';
import { updateCourseDetailsQuery } from './data/thunks';
import creditMessages from './credit-section/messages';
import pacingMessages from './pacing-section/messages';
import basicMessages from './basic-section/messages';
import scheduleMessages from './schedule-section/messages';
import messages from './messages';
import ScheduleAndDetails from '.';

jest.mock('@src/authz/hooks', () => ({
  useCourseUserPermissions: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthzEnabled: true,
    canViewScheduleAndDetails: true,
    canEditSchedule: true,
    canEditDetails: true,
  }),
}));

const mockPermissions = (overrides = {}) =>
  jest.mocked(useCourseUserPermissions).mockReturnValue({
    isLoading: false,
    isAuthzEnabled: true,
    canViewScheduleAndDetails: true,
    canEditSchedule: true,
    canEditDetails: true,
    ...overrides,
  });

let axiosMock;
let store;
const courseId = '123';
const renderComponent = () => render(<ScheduleAndDetails />);
const getCourseDetailsMinimalApiUrl = () => `${getCourseDetailsApiUrl(courseId)}?response=minimal`;

jest.mock('../CourseAuthoringContext', () => ({
  useCourseAuthoringContext: () => ({
    courseId,
    courseDetails: { name: 'Test course' },
  }),
}));

// Mock the tinymce lib
jest.mock('@tinymce/tinymce-react', () => {
  const originalModule = jest.requireActual('@tinymce/tinymce-react');
  return {
    __esModule: true,
    ...originalModule,
    Editor: () => 'foo bar',
  };
});

jest.mock('../editors/sharedComponents/TinyMceWidget', () => ({
  __esModule: true, // Required to mock a default export
  default: () => <div>Widget</div>,
  prepareEditorRef: jest.fn(() => ({
    refReady: true,
    setEditorRef: jest.fn().mockName('prepareEditorRef.setEditorRef'),
  })),
}));

// Mock the TextareaAutosize component
jest.mock('react-textarea-autosize', () => jest.fn((props) => (
  <textarea {...props} onFocus={() => {}} onBlur={() => {}} />
)));

describe('<ScheduleAndDetails />', () => {
  beforeEach(() => {
    const mocks = initializeMocks();
    axiosMock = mocks.axiosMock;
    store = mocks.reduxStore;
    axiosMock
      .onGet(getCourseDetailsApiUrl(courseId))
      .reply(200, courseDetailsMock);
    axiosMock
      .onGet(getCourseSettingsApiUrl(courseId))
      .reply(200, courseSettingsMock);
    axiosMock
      .onPut(getCourseDetailsMinimalApiUrl())
      .reply(200);
  });

  it('should render without errors', async () => {
    const { getByText, queryByRole, getAllByText } = render(<ScheduleAndDetails />);
    await waitFor(() => {
      const scheduleAndDetailElements = getAllByText(messages.headingTitle.defaultMessage);
      const scheduleAndDetailTitle = scheduleAndDetailElements[0];
      const pacingTitle = getByText(pacingMessages.pacingTitle.defaultMessage);
      const basicTitle = getByText(basicMessages.basicTitle.defaultMessage);
      expect(
        pacingTitle,
      ).toBeInTheDocument();
      expect(scheduleAndDetailTitle).toBeInTheDocument();
      expect(
        basicTitle,
      ).toBeInTheDocument();
      expect(
        getByText(creditMessages.creditTitle.defaultMessage),
      ).toBeInTheDocument();
      expect(
        getByText(scheduleMessages.scheduleTitle.defaultMessage),
      ).toBeInTheDocument();
      expect(
        pacingTitle.compareDocumentPosition(basicTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(queryByRole('navigation', { name: /Other course settings/i })).not.toBeInTheDocument();
    });
  });

  it('should hide credit section with condition', async () => {
    const updatedResponse = {
      ...courseSettingsMock,
      creditEligibilityEnabled: false,
      isCreditCourse: false,
    };
    axiosMock
      .onGet(getCourseSettingsApiUrl(courseId))
      .reply(200, updatedResponse);

    const { queryAllByText } = render(<ScheduleAndDetails />);
    await waitFor(() => {
      expect(
        queryAllByText(creditMessages.creditTitle.defaultMessage).length,
      ).toBe(0);
    });
  });

  it('should show save alert onChange ', async () => {
    const { getAllByPlaceholderText, getByText } = render(
      <ScheduleAndDetails />,
    );
    let inputs;
    await waitFor(() => {
      inputs = getAllByPlaceholderText(DATE_FORMAT.toLocaleUpperCase());
    });
    // @ts-ignore
    fireEvent.change(inputs[0], { target: { value: '06/16/2023' } });

    expect(
      getByText(messages.alertWarning.defaultMessage),
    ).toBeInTheDocument();
  });

  it('should send one update request when saving changed values', async () => {
    const { getAllByPlaceholderText, getByText } = render(
      <ScheduleAndDetails />,
    );
    let inputs;
    await waitFor(() => {
      inputs = getAllByPlaceholderText(DATE_FORMAT.toLocaleUpperCase());
    });

    // @ts-ignore
    fireEvent.change(inputs[0], { target: { value: '06/16/2023' } });
    fireEvent.click(getByText(messages.buttonSaveText.defaultMessage));

    await waitFor(() => {
      expect(axiosMock.history.put).toHaveLength(1);
    });

    const payload = JSON.parse(axiosMock.history.put[0].data);
    expect(payload).toHaveProperty('start_date');
    expect(payload).not.toHaveProperty('overview');
    expect(payload).not.toHaveProperty('intro_video');
  });

  it('should display a success message when course details saves', async () => {
    const { getByText } = render(<ScheduleAndDetails />);
    await executeThunk(updateCourseDetailsQuery(courseId, 'DaTa'), store.dispatch);
    expect(getByText(messages.alertSuccess.defaultMessage)).toBeInTheDocument();
  });

  it('should display an error when GET CourseDetails fails', async () => {
    axiosMock
      .onGet(getCourseDetailsApiUrl(courseId))
      .reply(404, 'error');
    const { getByText } = render(<ScheduleAndDetails />);
    await waitFor(() => {
      expect(getByText(messages.alertLoadFail.defaultMessage)).toBeInTheDocument();
    });
  });

  it('should display an error when GET CourseSettings fails', async () => {
    axiosMock
      .onGet(getCourseSettingsApiUrl(courseId))
      .reply(404, 'error');
    const { getByText } = render(<ScheduleAndDetails />);
    await waitFor(() => {
      expect(getByText(messages.alertLoadFail.defaultMessage)).toBeInTheDocument();
    });
  });

  it('should display an error when PUT CourseDetails fails', async () => {
    axiosMock
      .onPut(getCourseDetailsMinimalApiUrl())
      .reply(404, 'error');
    const { getByText } = render(<ScheduleAndDetails />);
    await act(async () => {
      await executeThunk(updateCourseDetailsQuery(courseId, 'DaTa'), store.dispatch);
    });
    expect(getByText(messages.alertFail.defaultMessage)).toBeInTheDocument();
  });
});

describe('<ScheduleAndDetails /> permissions', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    const mocks = initializeMocks();
    axiosMock = mocks.axiosMock;
    store = mocks.reduxStore;
    axiosMock.onGet(getCourseDetailsApiUrl(courseId)).reply(200, courseDetailsMock);
    axiosMock.onGet(getCourseSettingsApiUrl(courseId)).reply(200, courseSettingsMock);
    axiosMock.onPut(getCourseDetailsApiUrl(courseId)).reply(200);
    mockPermissions();
  });

  it('renders normally when authz flag is disabled (no regression)', async () => {
    mockWaffleFlags({ enableAuthzCourseAuthoring: false });
    const { getAllByText } = renderComponent();
    await waitFor(() => {
      expect(getAllByText(messages.headingTitle.defaultMessage).length).toBeGreaterThan(0);
    });
  });

  it('renders normally when user has all permissions', async () => {
    mockWaffleFlags({ enableAuthzCourseAuthoring: true });
    const { getAllByText } = renderComponent();
    await waitFor(() => {
      expect(getAllByText(messages.headingTitle.defaultMessage).length).toBeGreaterThan(0);
    });
  });

  it('shows PermissionDeniedAlert when user lacks view permission', async () => {
    mockWaffleFlags({ enableAuthzCourseAuthoring: true });
    mockPermissions({ canViewScheduleAndDetails: false, canEditSchedule: false, canEditDetails: false });
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('permissionDeniedAlert')).toBeInTheDocument();
    });
  });

  it('disables schedule date inputs when user lacks edit_schedule permission', async () => {
    mockWaffleFlags({ enableAuthzCourseAuthoring: true });
    mockPermissions({ canEditSchedule: false });
    const { getAllByPlaceholderText } = renderComponent();
    await waitFor(() => {
      const dateInputs = getAllByPlaceholderText(DATE_FORMAT.toLocaleUpperCase());
      dateInputs.forEach((input) => expect(input).toBeDisabled());
    });
  });

  it('disables pacing and details inputs when user lacks edit_details permission', async () => {
    mockWaffleFlags({ enableAuthzCourseAuthoring: true });
    mockPermissions({ canEditDetails: false });
    const { getAllByRole } = renderComponent();
    await waitFor(() => {
      const radios = getAllByRole('radio');
      radios.forEach((radio) => expect(radio).toBeDisabled());
    });
  });

  it('save button cannot be triggered when user has no edit permissions', async () => {
    mockWaffleFlags({ enableAuthzCourseAuthoring: true });
    mockPermissions({ canEditSchedule: false, canEditDetails: false });
    const { getAllByPlaceholderText, queryByText } = renderComponent();
    // Wait for page to load
    const dateInputs = await waitFor(() => getAllByPlaceholderText(DATE_FORMAT.toLocaleUpperCase()));
    // All date inputs must be disabled (no edit_schedule permission)
    dateInputs.forEach((input) => expect(input).toBeDisabled());
    // No changes can be made so the save button never appears
    expect(queryByText(messages.buttonSaveText.defaultMessage)).not.toBeInTheDocument();
  });
});
