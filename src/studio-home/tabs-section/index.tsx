import {
  useMemo, useState, useEffect, useCallback, type PointerEvent,
} from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Badge,
  Stack,
  Tab,
  Tabs,
} from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useNavigate, useLocation } from 'react-router-dom';

import { RequestStatus } from '@src/data/constants';
import { getLoadingStatuses, getStudioHomeData } from '../data/selectors';
import messages from './messages';
import { BaseFilterState, Filter, LibrariesList } from './libraries-tab';
import LibrariesV2List from './libraries-v2-tab';
import CoursesTab from './courses-tab';
import { WelcomeLibrariesV2Alert } from './libraries-v2-tab/WelcomeLibrariesV2Alert';

const TABS_LIST = {
  courses: 'courses',
  libraries: 'libraries',
  legacyLibraries: 'legacyLibraries',
  taxonomies: 'taxonomies',
} as const;
type TabKeyType = keyof typeof TABS_LIST;

const TabsSection = ({
  showNewCourseContainer,
  onClickNewCourse,
  isShowProcessing,
  librariesV1Enabled,
  librariesV2Enabled,
}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [migrationFilter, setMigrationFilter] = useState<Filter[]>(BaseFilterState);

  const isLegacyLibrariesTabEnabled = getConfig().ENABLE_LEGACY_LIBRARIES_TAB === 'true';
  const isTaxonomiesTabEnabled = (
    getConfig().ENABLE_TAGGING_TAXONOMY_PAGES === 'true'
    && getConfig().ENABLE_STUDIO_HOME_TAXONOMIES_TAB === 'true'
  );

  const canShowLibrariesV2Tab = Boolean(librariesV2Enabled);
  const canShowLegacyLibrariesTab = Boolean(librariesV1Enabled && isLegacyLibrariesTabEnabled);

  const initTabKeyState = (currentPathname: string): TabKeyType => {
    if (currentPathname.includes('/libraries-v1')) {
      return canShowLegacyLibrariesTab ? TABS_LIST.legacyLibraries : TABS_LIST.courses;
    }

    if (currentPathname.includes('/libraries')) {
      if (canShowLibrariesV2Tab) {
        return TABS_LIST.libraries;
      }
      if (canShowLegacyLibrariesTab) {
        return TABS_LIST.legacyLibraries;
      }
      return TABS_LIST.courses;
    }

    if (currentPathname.includes('/taxonomies')) {
      return isTaxonomiesTabEnabled ? TABS_LIST.taxonomies : TABS_LIST.courses;
    }

    return TABS_LIST.courses;
  };

  const [tabKey, setTabKey] = useState<TabKeyType>(initTabKeyState(pathname));

  useEffect(() => {
    setTabKey(initTabKeyState(pathname));
  }, [pathname, canShowLegacyLibrariesTab, canShowLibrariesV2Tab, isTaxonomiesTabEnabled]);

  const { courses, numPages, coursesCount } = useSelector(getStudioHomeData);
  const { courseLoadingStatus } = useSelector(getLoadingStatuses);
  const isLoadingCourses = courseLoadingStatus === RequestStatus.IN_PROGRESS;
  const isFailedCoursesPage = courseLoadingStatus === RequestStatus.FAILED;

  const visibleTabs = useMemo(() => {
    const tabs: JSX.Element[] = [];

    tabs.push(
      <Tab
        key={TABS_LIST.courses}
        eventKey={TABS_LIST.courses}
        title={(
          <span className="ws-home-tab-label">
            {intl.formatMessage(messages.coursesTabTitle)}
            <span className="ws-home-tab-count">({coursesCount || 0})</span>
          </span>
        )}
      >
        <CoursesTab
          coursesDataItems={courses}
          showNewCourseContainer={showNewCourseContainer}
          onClickNewCourse={onClickNewCourse}
          isShowProcessing={isShowProcessing}
          isLoading={isLoadingCourses}
          isFailed={isFailedCoursesPage}
          numPages={numPages}
        />
      </Tab>,
    );

    if (canShowLibrariesV2Tab) {
      tabs.push(
        <Tab
          key={TABS_LIST.libraries}
          eventKey={TABS_LIST.libraries}
          title={(
            <Stack gap={2} direction="horizontal" className="ws-home-tab-label">
              {intl.formatMessage(messages.librariesTabTitle)}
              <Badge className="ws-home-tab-badge">{intl.formatMessage(messages.librariesV2TabBetaBadge)}</Badge>
            </Stack>
          )}
        >
          <div>
            <WelcomeLibrariesV2Alert />
            <LibrariesV2List />
          </div>
        </Tab>,
      );
    }

    if (canShowLegacyLibrariesTab) {
      tabs.push(
        <Tab
          key={TABS_LIST.legacyLibraries}
          eventKey={TABS_LIST.legacyLibraries}
          title={intl.formatMessage(
            canShowLibrariesV2Tab
              ? messages.legacyLibrariesTabTitle
              : messages.librariesTabTitle,
          )}
        >
          <LibrariesList
            migrationFilter={migrationFilter}
            setMigrationFilter={setMigrationFilter}
          />
        </Tab>,
      );
    }

    if (isTaxonomiesTabEnabled) {
      tabs.push(
        <Tab
          key={TABS_LIST.taxonomies}
          eventKey={TABS_LIST.taxonomies}
          title={intl.formatMessage(messages.taxonomiesTabTitle)}
        />,
      );
    }

    return tabs;
  }, [
    canShowLegacyLibrariesTab,
    canShowLibrariesV2Tab,
    courses,
    coursesCount,
    intl,
    isFailedCoursesPage,
    isLoadingCourses,
    isShowProcessing,
    isTaxonomiesTabEnabled,
    migrationFilter,
    numPages,
    onClickNewCourse,
    showNewCourseContainer,
  ]);

  const handleSelectTab = (selectedTab: string | null) => {
    const tab = (selectedTab || TABS_LIST.courses) as TabKeyType;

    if (tab === TABS_LIST.courses) {
      navigate('/home');
    } else if (tab === TABS_LIST.legacyLibraries) {
      navigate('/libraries-v1');
    } else if (tab === TABS_LIST.libraries) {
      navigate('/libraries');
    } else if (tab === TABS_LIST.taxonomies && isTaxonomiesTabEnabled) {
      navigate('/taxonomies');
    }
    setTabKey(tab);
  };

  const handlePointerUpCapture = useCallback((event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    const tabLink = target?.closest('.studio-home-tabs .nav-link');

    if (!(tabLink instanceof HTMLElement)) {
      return;
    }

    window.requestAnimationFrame(() => {
      tabLink.blur();
    });
  }, []);

  return (
    <Tabs
      className="studio-home-tabs"
      variant="tabs"
      activeKey={tabKey}
      onSelect={handleSelectTab}
      onPointerUpCapture={handlePointerUpCapture}
    >
      {visibleTabs}
    </Tabs>
  );
};

TabsSection.propTypes = {
  showNewCourseContainer: PropTypes.bool.isRequired,
  onClickNewCourse: PropTypes.func.isRequired,
  isShowProcessing: PropTypes.bool.isRequired,
  librariesV1Enabled: PropTypes.bool,
  librariesV2Enabled: PropTypes.bool,
};

export default TabsSection;
