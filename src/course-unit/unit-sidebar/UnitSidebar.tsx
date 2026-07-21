import { Sidebar } from '@src/generic/sidebar';

import LegacySidebar, { LegacySidebarProps } from '../legacy-sidebar';
import { isUnitPageNewDesignEnabled } from '../utils';
import { UnitSidebarPageKeys, useUnitSidebarContext } from './UnitSidebarContext';
import { useUnitSidebarPagesContext } from './UnitSidebarPagesContext';
import { UnitInfoSidebar } from './unit-info/UnitInfoSidebar';

export type UnitSidebarProps = {
  legacySidebarProps: LegacySidebarProps;
};

/**
 * Main component of the Sidebar for the Unit
 */
export const UnitSidebar = ({
  legacySidebarProps, // Can be deleted when the legacy sidebar is deprecated
}: UnitSidebarProps) => {
  const {
    currentPageKey,
    setCurrentPageKey,
    setCurrentTabKey,
    isOpen,
    toggle,
    isVertical,
  } = useUnitSidebarContext();

  const sidebarPages = useUnitSidebarPagesContext();

  if (!isUnitPageNewDesignEnabled()) {
    return <LegacySidebar {...legacySidebarProps} />;
  }

  if (isVertical) {
    return (
      <aside className="ws-unit-info-sidebar">
        <UnitInfoSidebar />
      </aside>
    );
  }

  const handleChangePage = (key: UnitSidebarPageKeys) => {
    // Resets the tab key
    setCurrentTabKey(undefined);
    // Change the page
    setCurrentPageKey(key);
  };

  return (
    <Sidebar
      pages={sidebarPages}
      currentPageKey={currentPageKey}
      setCurrentPageKey={handleChangePage}
      isOpen={isOpen}
      toggle={toggle}
      minWidth={320}
    />
  );
};
