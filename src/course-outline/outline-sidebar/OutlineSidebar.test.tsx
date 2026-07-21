import { initializeMocks, render, screen } from '@src/testUtils';

import OutlineSidebar from './OutlineSidebar';

jest.mock('@src/generic/sidebar', () => ({
  Sidebar: () => <div>Generic sidebar</div>,
}));

jest.mock('./info-sidebar/InfoSidebar', () => ({
  InfoSidebar: () => <div>Contextual information</div>,
}));

jest.mock('./OutlineSidebarContext', () => ({
  useOutlineSidebarContext: jest.fn(),
}));

jest.mock('./OutlineSidebarPagesContext', () => ({
  useOutlineSidebarPagesContext: jest.fn().mockReturnValue([]),
}));

const outlineContext = jest.requireMock('./OutlineSidebarContext') as {
  useOutlineSidebarContext: jest.Mock;
};

const contextValue = {
  currentPageKey: 'info',
  setCurrentPageKey: jest.fn(),
  isOpen: false,
  toggle: jest.fn(),
  selectedContainerState: undefined,
};

describe('<OutlineSidebar>', () => {
  beforeEach(() => {
    initializeMocks();
  });

  it('does not render the legacy action rail while no item is selected', () => {
    outlineContext.useOutlineSidebarContext.mockReturnValue(contextValue);

    render(<OutlineSidebar />);

    expect(screen.queryByText('Generic sidebar')).not.toBeInTheDocument();
    expect(screen.queryByText('Contextual information')).not.toBeInTheDocument();
  });

  it('keeps the generic sidebar for explicit add and library flows', () => {
    outlineContext.useOutlineSidebarContext.mockReturnValue({
      ...contextValue,
      currentPageKey: 'add',
      isOpen: true,
    });

    render(<OutlineSidebar />);

    expect(screen.getByText('Generic sidebar')).toBeInTheDocument();
  });

  it('renders contextual information after an outline item is selected', () => {
    outlineContext.useOutlineSidebarContext.mockReturnValue({
      ...contextValue,
      selectedContainerState: { currentId: 'unit-1' },
    });

    render(<OutlineSidebar />);

    expect(screen.getByText('Contextual information')).toBeInTheDocument();
    expect(screen.queryByText('Generic sidebar')).not.toBeInTheDocument();
  });
});
