import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import SharedHeader from '@edx/frontend-component-header';
import { getConfig } from '@edx/frontend-platform';
import { Icon } from '@openedx/paragon';
import {
  MenuBook,
  Schedule,
  Grading,
  EmojiEvents,
  FolderOpen,
  People,
  Groups,
  Layers,
  Email,
  ImportExport,
  Settings,
} from '@openedx/paragon/icons';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { useWaffleFlags } from '../data/apiHooks';
import { getStudioHomeData } from '../studio-home/data/selectors';
import { createCorrectInternalRoute, getPagePath } from '../utils';
import './WutiskillStudioHeader.scss';

interface StudioTab {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  href: string;
  matchPaths?: string[];
}

interface WutiskillStudioHeaderProps {
  contextId: string;
  number?: string;
  org?: string;
  title?: string;
}

const getTabHref = ({
  courseId,
  studioBaseUrl,
  useMfeRoute,
  mfePath,
  studioPath,
}: {
  courseId: string;
  studioBaseUrl: string;
  useMfeRoute: boolean;
  mfePath: string;
  studioPath: string;
}) => (useMfeRoute
  ? createCorrectInternalRoute(`/course/${courseId}${mfePath}`)
  : `${studioBaseUrl}${studioPath}/${courseId}`);

function getActiveTabId(pathname: string, courseBasePath: string, tabs: StudioTab[]): string {
  const courseBaseIndex = pathname.indexOf(courseBasePath);
  const relativePath = (courseBaseIndex >= 0
    ? pathname.slice(courseBaseIndex + courseBasePath.length)
    : pathname)
    .replace(/^\//, '')
    .replace(/\/$/, '');

  if (!relativePath || relativePath.startsWith('subsection/') || relativePath.startsWith('editor/')) {
    return 'plan';
  }

  for (const tab of tabs) {
    const paths = tab.matchPaths ?? [];
    if (paths.some((path) => relativePath === path || relativePath.startsWith(`${path}/`))) {
      return tab.id;
    }
  }

  return 'plan';
}

const WutiskillStudioHeader = ({
  contextId,
  number = '',
  org = '',
  title = '',
}: WutiskillStudioHeaderProps) => {
  const location = useLocation();
  const tabsRef = useRef<HTMLElement | null>(null);
  const waffleFlags = useWaffleFlags();
  const studioBaseUrl = getConfig().STUDIO_BASE_URL;
  const { canAccessAdvancedSettings } = useSelector(getStudioHomeData);
  const [tabsScrollIndicator, setTabsScrollIndicator] = useState({
    isVisible: false,
    thumbWidth: 0,
    thumbOffset: 0,
  });

  const tabs = useMemo<StudioTab[]>(() => {
    const items: StudioTab[] = [
      {
        id: 'plan',
        label: 'Plan',
        icon: MenuBook,
        href: waffleFlags.useNewCourseOutlinePage
          ? createCorrectInternalRoute(`/course/${contextId}`)
          : `${studioBaseUrl}/course/${contextId}`,
        matchPaths: ['', 'subsection', 'editor', 'libraries'],
      },
      {
        id: 'horaires',
        label: 'Horaire et details',
        icon: Schedule,
        href: getTabHref({
          courseId: contextId,
          studioBaseUrl,
          useMfeRoute: waffleFlags.useNewScheduleDetailsPage,
          mfePath: '/settings/details',
          studioPath: '/settings/details',
        }),
        matchPaths: ['settings/details'],
      },
      {
        id: 'evaluation',
        label: 'Evaluation',
        icon: Grading,
        href: getTabHref({
          courseId: contextId,
          studioBaseUrl,
          useMfeRoute: waffleFlags.useNewGradingPage,
          mfePath: '/settings/grading',
          studioPath: '/settings/grading',
        }),
        matchPaths: ['settings/grading'],
      },
      ...((getConfig().ENABLE_CERTIFICATE_PAGE === 'true' || waffleFlags.useNewCertificatesPage)
        ? [{
          id: 'certificats',
          label: 'Certificats',
          icon: EmojiEvents,
          href: waffleFlags.useNewCertificatesPage
            ? createCorrectInternalRoute(`/course/${contextId}/certificates`)
            : `${studioBaseUrl}/certificates/${contextId}`,
          matchPaths: ['certificates'],
        }]
        : []),
      {
        id: 'fichiers',
        label: 'Fichiers',
        icon: FolderOpen,
        href: getTabHref({
          courseId: contextId,
          studioBaseUrl,
          useMfeRoute: waffleFlags.useNewFilesUploadsPage,
          mfePath: '/assets',
          studioPath: '/assets',
        }),
        matchPaths: ['assets', 'videos'],
      },
      {
        id: 'equipe',
        label: 'Equipe du cours',
        icon: People,
        href: getTabHref({
          courseId: contextId,
          studioBaseUrl,
          useMfeRoute: waffleFlags.useNewCourseTeamPage,
          mfePath: '/course_team',
          studioPath: '/course_team',
        }),
        matchPaths: ['course_team'],
      },
      {
        id: 'groupes',
        label: 'Groupes',
        icon: Groups,
        href: getTabHref({
          courseId: contextId,
          studioBaseUrl,
          useMfeRoute: waffleFlags.useNewGroupConfigurationsPage,
          mfePath: '/group_configurations',
          studioPath: '/group_configurations',
        }),
        matchPaths: ['group_configurations'],
      },
      {
        id: 'pages',
        label: 'Pages et ressources',
        icon: Layers,
        href: createCorrectInternalRoute(getPagePath(contextId, 'true', 'tabs')),
        matchPaths: ['pages-and-resources', 'custom-pages', 'textbooks'],
      },
      {
        id: 'mailing',
        label: 'E-mail',
        icon: Email,
        href: waffleFlags.useNewUpdatesPage
          ? createCorrectInternalRoute(`/course/${contextId}/course_info`)
          : `${studioBaseUrl}/course_info/${contextId}`,
        matchPaths: ['course_info'],
      },
      {
        id: 'import_export',
        label: 'Import / Export',
        icon: ImportExport,
        href: waffleFlags.useNewImportPage
          ? createCorrectInternalRoute(`/course/${contextId}/import`)
          : `${studioBaseUrl}/import/${contextId}`,
        matchPaths: ['import', 'export'],
      },
      ...(canAccessAdvancedSettings
        ? [{
          id: 'avance',
          label: 'Parametre',
          icon: Settings,
          href: getTabHref({
            courseId: contextId,
            studioBaseUrl,
            useMfeRoute: waffleFlags.useNewAdvancedSettingsPage,
            mfePath: '/settings/advanced',
            studioPath: '/settings/advanced',
          }),
          matchPaths: ['settings/advanced'],
        }]
        : []),
    ];

    return items;
  }, [canAccessAdvancedSettings, contextId, studioBaseUrl, waffleFlags]);

  const courseBasePath = `/course/${contextId}`;
  const activeTabId = useMemo(
    () => getActiveTabId(location.pathname, courseBasePath, tabs),
    [location.pathname, courseBasePath, tabs],
  );

  const courseContext = [org, number].filter(Boolean).join(' ');
  const planHref = tabs.find((tab) => tab.id === 'plan')?.href
    || createCorrectInternalRoute(`/course/${contextId}`);

  const updateTabsScrollIndicator = useCallback(() => {
    const tabsNode = tabsRef.current;
    if (!tabsNode) {
      return;
    }

    const hasOverflow = tabsNode.scrollWidth - tabsNode.clientWidth > 1;
    if (!hasOverflow) {
      setTabsScrollIndicator({
        isVisible: false,
        thumbWidth: 0,
        thumbOffset: 0,
      });
      return;
    }

    const trackWidth = tabsNode.clientWidth;
    const maxScrollLeft = tabsNode.scrollWidth - tabsNode.clientWidth;
    const thumbWidth = Math.max((tabsNode.clientWidth / tabsNode.scrollWidth) * trackWidth, 64);
    const maxThumbOffset = Math.max(trackWidth - thumbWidth, 0);
    const thumbOffset = maxScrollLeft > 0
      ? (tabsNode.scrollLeft / maxScrollLeft) * maxThumbOffset
      : 0;

    setTabsScrollIndicator({
      isVisible: true,
      thumbWidth,
      thumbOffset,
    });
  }, []);

  useEffect(() => {
    updateTabsScrollIndicator();

    const tabsNode = tabsRef.current;
    if (!tabsNode) {
      return undefined;
    }

    const handleResize = () => updateTabsScrollIndicator();

    tabsNode.addEventListener('scroll', updateTabsScrollIndicator, { passive: true });
    window.addEventListener('resize', handleResize);

    const resizeObserver = typeof window.ResizeObserver !== 'undefined'
      ? new window.ResizeObserver(handleResize)
      : null;

    resizeObserver?.observe(tabsNode);

    return () => {
      tabsNode.removeEventListener('scroll', updateTabsScrollIndicator);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [tabs, updateTabsScrollIndicator]);

  return (
    <header className="ws-studio-shell">
      <SharedHeader
        mainMenuItems={[]}
        secondaryMenuItems={[]}
        logoDestination={createCorrectInternalRoute('/home')}
        showStudioLinkInUserMenu={false}
        userMenuVariant="studio"
        desktopBrandSupplement={(
          <a href={planHref} className="ws-studio-shell__brand-link">
            <span className="ws-studio-shell__brand-meta">
              {courseContext || 'Cours'}
            </span>
            <span className="ws-studio-shell__brand-title">
              {title || contextId}
            </span>
          </a>
        )}
      />

      <div className="ws-studio-shell__subnav">
        <div className="ws-studio-shell__inner">
          <div className="ws-studio-shell__tabs-frame">
            <nav ref={tabsRef} className="ws-studio-shell__tabs" aria-label="Navigation du cours">
              {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;

                return (
                  <a
                    key={tab.id}
                    href={tab.href}
                    className={`ws-studio-tab${isActive ? ' ws-studio-tab--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon src={tab.icon} />
                    <span>{tab.label}</span>
                    <span className="ws-studio-tab__underline" />
                  </a>
                );
              })}
            </nav>
            {tabsScrollIndicator.isVisible ? (
              <div className="ws-studio-shell__tabs-scrollbar" aria-hidden="true">
                <span
                  className="ws-studio-shell__tabs-scrollbar-thumb"
                  style={{
                    width: `${tabsScrollIndicator.thumbWidth}px`,
                    transform: `translateX(${tabsScrollIndicator.thumbOffset}px)`,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default WutiskillStudioHeader;
