import { Sidebar } from '@src/generic/sidebar';

import { useOutlineSidebarContext } from './OutlineSidebarContext';
import { useOutlineSidebarPagesContext } from './OutlineSidebarPagesContext';
import { InfoSidebar } from './info-sidebar/InfoSidebar';

const OutlineSideBar = () => {
  const {
    currentPageKey,
    setCurrentPageKey,
    isOpen,
    toggle,
    selectedContainerState,
  } = useOutlineSidebarContext();

  const sidebarPages = useOutlineSidebarPagesContext();

  if (currentPageKey === 'info' && selectedContainerState) {
    return (
      <aside className="ws-outline-context-sidebar">
        <InfoSidebar />
      </aside>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Sidebar
      pages={sidebarPages}
      currentPageKey={currentPageKey}
      setCurrentPageKey={setCurrentPageKey}
      isOpen={isOpen}
      toggle={toggle}
      minWidth={320}
    />
  );
};

export default OutlineSideBar;
