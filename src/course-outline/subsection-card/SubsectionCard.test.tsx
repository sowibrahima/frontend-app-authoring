import { COMPONENT_TYPES } from '@src/generic/block-type-utils/constants';
import {
  act, fireEvent, initializeMocks, render, screen, waitFor, within,
} from '@src/testUtils';
import { XBlock } from '@src/data/types';
import cardHeaderMessages from '../card-header/messages';
import SubsectionCard from './SubsectionCard';

let store;
const containerKey = 'lct:org:lib:unit:1';
const handleOnAddUnitFromLibrary = jest.fn();

const mockUseAcceptLibraryBlockChanges = jest.fn();
const mockUseIgnoreLibraryBlockChanges = jest.fn();

jest.mock('@src/course-unit/data/apiHooks', () => ({
  useAcceptLibraryBlockChanges: () => ({
    mutateAsync: mockUseAcceptLibraryBlockChanges,
  }),
  useIgnoreLibraryBlockChanges: () => ({
    mutateAsync: mockUseIgnoreLibraryBlockChanges,
  }),
}));

jest.mock('@edx/frontend-component-header', () => ({}));

jest.mock('@edx/frontend-component-header/dist/studio-header/StudioHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="studio-header" />,
}));

jest.mock('@edx/frontend-component-header/dist/studio-header/HeaderBody', () => ({
  __esModule: true,
  default: () => <div data-testid="studio-header-body" />,
}));

jest.mock('@src/editors/EditorPage', () => ({
  __esModule: true,
  default: () => <div data-testid="xblock-editor-page" />,
}));

jest.mock('@src/editors/VideoSelectorPage', () => ({
  __esModule: true,
  default: () => <div data-testid="video-selector-page" />,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({
    librariesV2Enabled: true,
  }),
}));

// Mock ComponentPicker to call onComponentSelected on click
jest.mock('@src/library-authoring/component-picker', () => ({
  ComponentPicker: (props) => {
    const onClick = () => {
      // eslint-disable-next-line react/prop-types
      props.onComponentSelected({
        usageKey: containerKey,
        blockType: 'unti',
      });
    };
    return (
      <button type="submit" onClick={onClick}>
        Dummy button
      </button>
    );
  },
}));

const unit = {
  id: 'unit-1',
};

const subsection: XBlock = {
  id: 'block-v1:UNIX+UX1+2025_T3+type@subsection+block@0',
  displayName: 'Subsection Name',
  category: 'sequential',
  published: true,
  visibilityState: 'live',
  hasChanges: false,
  actions: {
    draggable: true,
    childAddable: true,
    deletable: true,
    duplicable: true,
  },
  isHeaderVisible: true,
  releasedToStudents: true,
  childInfo: {
    children: [{
      id: unit.id,
    }],
  } as any, // 'as any' because we are omitting a lot of fields from 'childInfo'
  upstreamInfo: {
    readyToSync: true,
    upstreamRef: 'lct:org1:lib1:subsection:1',
    versionSynced: 1,
    versionAvailable: 2,
    versionDeclined: null,
    errorMessage: null,
    downstreamCustomized: [] as string[],
  },
} satisfies Partial<XBlock> as XBlock;

const section: XBlock = {
  id: 'block-v1:UNIX+UX1+2025_T3+type@section+block@0',
  displayName: 'Section Name',
  published: true,
  visibilityState: 'live',
  hasChanges: false,
  highlights: ['highlight 1', 'highlight 2'],
  childInfo: {
    children: [{
      id: subsection.id,
    }],
  } as any, // 'as any' because we are omitting a lot of fields from 'childInfo'
  actions: {
    draggable: true,
    childAddable: true,
    deletable: true,
    duplicable: true,
  },
} satisfies Partial<XBlock> as XBlock;

const onEditSubectionSubmit = jest.fn();

const renderComponent = (props?: object, entry = '/course/:courseId') => render(
  <SubsectionCard
    section={section}
    subsection={subsection}
    index={1}
    isSelfPaced={false}
    getPossibleMoves={jest.fn()}
    onOrderChange={jest.fn()}
    onOpenPublishModal={jest.fn()}
    onOpenDeleteModal={jest.fn()}
    onOpenUnlinkModal={jest.fn()}
    onNewUnitSubmit={jest.fn()}
    onAddUnitFromLibrary={handleOnAddUnitFromLibrary}
    isCustomRelativeDatesActive={false}
    onEditSubmit={onEditSubectionSubmit}
    onDuplicateSubmit={jest.fn()}
    onOpenConfigureModal={jest.fn()}
    onPasteClick={jest.fn()}
    resetScrollState={jest.fn()}
    isSectionsExpanded={false}
    {...props}
  >
    <span>children</span>
  </SubsectionCard>,
  {
    path: '/course/:courseId',
    params: { courseId: '5' },
    routerProps: {
      initialEntries: [entry],
    },
  },
);

describe('<SubsectionCard />', () => {
  beforeEach(() => {
    const mocks = initializeMocks();
    store = mocks.reduxStore;
  });

  it('render SubsectionCard component correctly', () => {
    renderComponent();

    expect(screen.getByTestId('subsection-card-header')).toBeInTheDocument();
  });

  it('expands/collapses the card when the subsection button is clicked', async () => {
    renderComponent();

    const expandButton = await screen.findByTestId('subsection-card-header__expanded-btn');
    fireEvent.click(expandButton);
    expect(screen.queryByTestId('subsection-card__units')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new activity page/i })).toBeInTheDocument();

    fireEvent.click(expandButton);
    expect(screen.queryByTestId('subsection-card__units')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new activity page/i })).not.toBeInTheDocument();
  });

  it('updates current section, subsection and item', async () => {
    renderComponent();

    const menu = await screen.findByTestId('subsection-card-header__menu');
    fireEvent.click(menu);
    const { currentSection, currentSubsection, currentItem } = store.getState().courseOutline;
    expect(currentSection).toEqual(section);
    expect(currentSubsection).toEqual(subsection);
    expect(currentItem).toEqual(subsection);
  });

  it('title only updates if changed', async () => {
    renderComponent();

    let editButton = await screen.findByTestId('subsection-edit-button');
    fireEvent.click(editButton);
    let editField = await screen.findByTestId('subsection-edit-field');
    fireEvent.blur(editField);

    expect(onEditSubectionSubmit).not.toHaveBeenCalled();

    editButton = await screen.findByTestId('subsection-edit-button');
    fireEvent.click(editButton);
    editField = await screen.findByTestId('subsection-edit-field');
    fireEvent.change(editField, { target: { value: 'some random value' } });
    fireEvent.keyDown(editField, { key: 'Enter', keyCode: 13 });
    expect(onEditSubectionSubmit).toHaveBeenCalled();
  });

  it('hides header based on isHeaderVisible flag', async () => {
    renderComponent({
      subsection: {
        ...subsection,
        isHeaderVisible: false,
      },
    });
    expect(screen.queryByTestId('subsection-card-header')).not.toBeInTheDocument();
  });

  it('hides add new, duplicate & delete option based on childAddable, duplicable & deletable action flag', async () => {
    renderComponent({
      subsection: {
        ...subsection,
        actions: {
          draggable: true,
          childAddable: false,
          deletable: false,
          duplicable: false,
        },
      },
    });
    const element = await screen.findByTestId('subsection-card');
    const menu = await within(element).findByTestId('subsection-card-header__menu-button');
    await act(async () => fireEvent.click(menu));
    expect(within(element).queryByTestId('subsection-card-header__menu-duplicate-button')).not.toBeInTheDocument();
    expect(within(element).queryByTestId('subsection-card-header__menu-delete-button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new activity page/i })).not.toBeInTheDocument();
  });

  it('hides move, duplicate & delete options if parent was imported from library', async () => {
    renderComponent({
      section: {
        ...section,
        upstreamInfo: {
          readyToSync: true,
          upstreamRef: 'lct:org1:lib1:section:1',
          versionSynced: 1,
        },
      },
    });
    const element = await screen.findByTestId('subsection-card');
    const menu = await within(element).findByTestId('subsection-card-header__menu-button');
    await act(async () => fireEvent.click(menu));
    expect(within(element).queryByTestId('subsection-card-header__menu-duplicate-button')).not.toBeInTheDocument();
    expect(within(element).queryByTestId('subsection-card-header__menu-delete-button')).not.toBeInTheDocument();
    expect(
      await within(element).findByTestId('subsection-card-header__menu-move-up-button'),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      await within(element).findByTestId('subsection-card-header__menu-move-down-button'),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders live status', async () => {
    renderComponent();
    expect(await screen.findByText(cardHeaderMessages.statusBadgeLive.defaultMessage)).toBeInTheDocument();
  });

  it('renders published but live status', async () => {
    renderComponent({
      subsection: {
        ...subsection,
        published: true,
        visibilityState: 'ready',
      },
    });
    expect(await screen.findByText(cardHeaderMessages.statusBadgePublishedNotLive.defaultMessage)).toBeInTheDocument();
  });

  it('renders staff status', async () => {
    renderComponent({
      subsection: {
        ...subsection,
        published: false,
        visibilityState: 'staff_only',
      },
    });
    expect(await screen.findByText(cardHeaderMessages.statusBadgeStaffOnly.defaultMessage)).toBeInTheDocument();
  });

  it('renders draft status', async () => {
    renderComponent({
      subsection: {
        ...subsection,
        published: false,
        visibilityState: 'needs_attention',
        hasChanges: true,
      },
    });
    expect(await screen.findByText(cardHeaderMessages.statusBadgeDraft.defaultMessage)).toBeInTheDocument();
  });

  it('check extended subsection when URL "show" param in subsection', async () => {
    renderComponent(undefined, `/course/:courseId?show=${unit.id}`);

    const cardUnits = await screen.findByTestId('subsection-card__units');
    const newUnitButton = await screen.findByRole('button', { name: /new activity page/i });
    expect(cardUnits).toBeInTheDocument();
    expect(newUnitButton).toBeInTheDocument();
  });

  it('check not extended subsection when URL "show" param not in subsection', async () => {
    const randomId = 'random-id';
    renderComponent(undefined, `/course/:courseId?show=${randomId}`);

    const cardUnits = screen.queryByTestId('subsection-card__units');
    const newUnitButton = screen.queryByRole('button', { name: /new activity page/i });
    expect(cardUnits).toBeNull();
    expect(newUnitButton).toBeNull();
  });

  it('should add unit from library', async () => {
    renderComponent();

    const expandButton = await screen.findByTestId('subsection-card-header__expanded-btn');
    fireEvent.click(expandButton);

    const useUnitFromLibraryButton = screen.getByRole('button', {
      name: /use an activity from the library/i,
    });
    expect(useUnitFromLibraryButton).toBeInTheDocument();
    fireEvent.click(useUnitFromLibraryButton);

    expect(await screen.findByText('Select unit'));

    // click dummy button to execute onComponentSelected prop.
    const dummyBtn = await screen.findByRole('button', { name: 'Dummy button' });
    fireEvent.click(dummyBtn);

    expect(handleOnAddUnitFromLibrary).toHaveBeenCalled();
    expect(handleOnAddUnitFromLibrary).toHaveBeenCalledWith({
      type: COMPONENT_TYPES.libraryV2,
      parentLocator: 'block-v1:UNIX+UX1+2025_T3+type@subsection+block@0',
      category: 'vertical',
      libraryContentKey: containerKey,
    });
  });

  it('opens the other activity choices without creating a blank unit', async () => {
    const onNewUnitSubmit = jest.fn();
    renderComponent({ onNewUnitSubmit });

    const expandButton = await screen.findByTestId('subsection-card-header__expanded-btn');
    fireEvent.click(expandButton);
    fireEvent.click(screen.getByRole('button', { name: /new activity page/i }));
    fireEvent.click(screen.getByRole('button', { name: /other/i }));

    expect(onNewUnitSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /html text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quiz/i })).toBeInTheDocument();
  });

  it('opens the editor after creating a text activity from the outline picker', async () => {
    const onNewUnitSubmit = jest.fn((...args) => {
      const callback = args[3];
      callback({
        courseKey: 'course-v1:TestX+TST+2026',
        locator: 'block-v1:TestX+TST+2026+type@html+block@abc',
      });
    });
    renderComponent({ onNewUnitSubmit });

    const expandButton = await screen.findByTestId('subsection-card-header__expanded-btn');
    fireEvent.click(expandButton);
    fireEvent.click(screen.getByRole('button', { name: /new activity page/i }));
    fireEvent.click(screen.getByRole('button', { name: /read/i }));
    fireEvent.click(screen.getByRole('button', { name: /html text/i }));

    expect(onNewUnitSubmit).toHaveBeenCalledWith(
      subsection.id,
      section.id,
      expect.objectContaining({ type: COMPONENT_TYPES.html }),
      expect.any(Function),
    );
    expect(await screen.findByTestId('xblock-editor-page')).toBeInTheDocument();
  });

  it('opens the video selector after creating a video activity from the outline picker', async () => {
    const onNewUnitSubmit = jest.fn((...args) => {
      const callback = args[3];
      callback({
        courseKey: 'course-v1:TestX+TST+2026',
        locator: 'block-v1:TestX+TST+2026+type@video+block@abc',
      });
    });
    renderComponent({ onNewUnitSubmit });

    const expandButton = await screen.findByTestId('subsection-card-header__expanded-btn');
    fireEvent.click(expandButton);
    fireEvent.click(screen.getByRole('button', { name: /new activity page/i }));
    fireEvent.click(screen.getByRole('button', { name: /watch/i }));

    expect(onNewUnitSubmit).toHaveBeenCalledWith(
      subsection.id,
      section.id,
      expect.objectContaining({ type: COMPONENT_TYPES.video }),
      expect.any(Function),
    );
    expect(await screen.findByTestId('video-selector-page')).toBeInTheDocument();
  });

  it('should sync subsection changes from upstream', async () => {
    renderComponent();

    expect(await screen.findByTestId('subsection-card-header')).toBeInTheDocument();

    // Click on sync button
    const syncButton = screen.getByRole('button', { name: /update available - click to sync/i });
    fireEvent.click(syncButton);

    // Should open compare preview modal
    expect(screen.getByRole('heading', { name: /preview changes: subsection name/i })).toBeInTheDocument();

    // Click on accept changes
    const acceptChangesButton = screen.getByText(/accept changes/i);
    fireEvent.click(acceptChangesButton);

    await waitFor(() => expect(mockUseAcceptLibraryBlockChanges).toHaveBeenCalled());
  });

  it('should decline sync subsection changes from upstream', async () => {
    renderComponent();

    expect(await screen.findByTestId('subsection-card-header')).toBeInTheDocument();

    // Click on sync button
    const syncButton = screen.getByRole('button', { name: /update available - click to sync/i });
    fireEvent.click(syncButton);

    // Should open compare preview modal
    expect(screen.getByRole('heading', { name: /preview changes: subsection name/i })).toBeInTheDocument();

    // Click on ignore changes
    const ignoreChangesButton = screen.getByRole('button', { name: /ignore changes/i });
    fireEvent.click(ignoreChangesButton);

    // Should open the confirmation modal
    expect(screen.getByRole('heading', { name: /ignore these changes\?/i })).toBeInTheDocument();

    // Click on ignore button
    const ignoreButton = screen.getByRole('button', { name: /ignore/i });
    fireEvent.click(ignoreButton);

    await waitFor(() => expect(mockUseIgnoreLibraryBlockChanges).toHaveBeenCalled());
  });
});
