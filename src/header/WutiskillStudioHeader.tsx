import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import SharedHeader from '@edx/frontend-component-header';
import { getConfig } from '@edx/frontend-platform';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import {
  MenuBook,
  Schedule,
  Grading,
  EmojiEvents,
  FolderOpen,
  People,
  Groups,
  Email,
  ImportExport,
  Settings,
} from '@openedx/paragon/icons';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { getStudioHomeData } from '../studio-home/data/selectors';
import { createCorrectInternalRoute } from '../utils';
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

const messages = defineMessages({
  plan: {
    id: 'wuti.authoring.studioHeader.tabs.plan',
    defaultMessage: 'Plan',
    description: 'Course plan tab label in Studio header',
  },
  schedule: {
    id: 'wuti.authoring.studioHeader.tabs.schedule',
    defaultMessage: 'Schedule and details',
    description: 'Schedule tab label in Studio header',
  },
  grading: {
    id: 'wuti.authoring.studioHeader.tabs.grading',
    defaultMessage: 'Grading',
    description: 'Grading tab label in Studio header',
  },
  certificates: {
    id: 'wuti.authoring.studioHeader.tabs.certificates',
    defaultMessage: 'Certificates',
    description: 'Certificates tab label in Studio header',
  },
  files: {
    id: 'wuti.authoring.studioHeader.tabs.files',
    defaultMessage: 'Files',
    description: 'Files tab label in Studio header',
  },
  courseTeam: {
    id: 'wuti.authoring.studioHeader.tabs.courseTeam',
    defaultMessage: 'Course team',
    description: 'Course team tab label in Studio header',
  },
  groups: {
    id: 'wuti.authoring.studioHeader.tabs.groups',
    defaultMessage: 'Groups',
    description: 'Groups tab label in Studio header',
  },
  pages: {
    id: 'wuti.authoring.studioHeader.tabs.pages',
    defaultMessage: 'Pages and resources',
    description: 'Pages tab label in Studio header',
  },
  email: {
    id: 'wuti.authoring.studioHeader.tabs.email',
    defaultMessage: 'Notifications',
    description: 'Notifications tab label in Studio header',
  },
  importExport: {
    id: 'wuti.authoring.studioHeader.tabs.importExport',
    defaultMessage: 'Import / Export',
    description: 'Import/export tab label in Studio header',
  },
  settings: {
    id: 'wuti.authoring.studioHeader.tabs.settings',
    defaultMessage: 'Settings',
    description: 'Settings tab label in Studio header',
  },
  courseFallback: {
    id: 'wuti.authoring.studioHeader.courseFallback',
    defaultMessage: 'Course',
    description: 'Fallback course label in Studio header',
  },
  courseNavigation: {
    id: 'wuti.authoring.studioHeader.courseNavigation',
    defaultMessage: 'Course navigation',
    description: 'Accessible label for Studio course navigation',
  },
});

const updateScrollIndicatorState = (
  setTabsScrollIndicator: React.Dispatch<React.SetStateAction<{
    isVisible: boolean;
    thumbWidth: number;
    thumbOffset: number;
  }>>,
  nextState: {
    isVisible: boolean;
    thumbWidth: number;
    thumbOffset: number;
  },
) => {
  setTabsScrollIndicator((previousState) => {
    const hasSameValues = previousState.isVisible === nextState.isVisible
      && Math.abs(previousState.thumbWidth - nextState.thumbWidth) < 0.5
      && Math.abs(previousState.thumbOffset - nextState.thumbOffset) < 0.5;

    return hasSameValues ? previousState : nextState;
  });
};

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
  const intl = useIntl();
  const location = useLocation();
  const tabsRef = useRef<HTMLElement | null>(null);
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
        label: intl.formatMessage(messages.plan),
        icon: MenuBook,
        href: createCorrectInternalRoute(`/course/${contextId}`),
        matchPaths: ['', 'subsection', 'editor', 'libraries'],
      },
      {
        id: 'horaires',
        label: intl.formatMessage(messages.schedule),
        icon: Schedule,
        href: createCorrectInternalRoute(`/course/${contextId}/settings/details`),
        matchPaths: ['settings/details'],
      },
      {
        id: 'evaluation',
        label: intl.formatMessage(messages.grading),
        icon: Grading,
        href: createCorrectInternalRoute(`/course/${contextId}/settings/grading`),
        matchPaths: ['settings/grading'],
      },
      ...(getConfig().ENABLE_CERTIFICATE_PAGE === 'true'
        ? [{
          id: 'certificats',
          label: intl.formatMessage(messages.certificates),
          icon: EmojiEvents,
          href: createCorrectInternalRoute(`/course/${contextId}/certificates`),
          matchPaths: ['certificates'],
        }]
        : []),
      {
        id: 'fichiers',
        label: intl.formatMessage(messages.files),
        icon: FolderOpen,
        href: createCorrectInternalRoute(`/course/${contextId}/assets`),
        matchPaths: ['assets', 'videos'],
      },
      {
        id: 'equipe',
        label: intl.formatMessage(messages.courseTeam),
        icon: People,
        href: createCorrectInternalRoute(`/course/${contextId}/course_team`),
        matchPaths: ['course_team'],
      },
      {
        id: 'groupes',
        label: intl.formatMessage(messages.groups),
        icon: Groups,
        href: createCorrectInternalRoute(`/course/${contextId}/group_configurations`),
        matchPaths: ['group_configurations'],
      },
      {
        id: 'mailing',
        label: intl.formatMessage(messages.email),
        icon: Email,
        href: createCorrectInternalRoute(`/course/${contextId}/course_info`),
        matchPaths: ['course_info'],
      },
      {
        id: 'import_export',
        label: intl.formatMessage(messages.importExport),
        icon: ImportExport,
        href: createCorrectInternalRoute(`/course/${contextId}/import`),
        matchPaths: ['import', 'export'],
      },
      ...(canAccessAdvancedSettings
        ? [{
          id: 'avance',
          label: intl.formatMessage(messages.settings),
          icon: Settings,
          href: createCorrectInternalRoute(`/course/${contextId}/settings/advanced`),
          matchPaths: ['settings/advanced'],
        }]
        : []),
    ];

    return items;
  }, [canAccessAdvancedSettings, contextId, intl]);

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
      updateScrollIndicatorState(setTabsScrollIndicator, {
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

    updateScrollIndicatorState(setTabsScrollIndicator, {
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
        userMenuVariant="default"
        desktopBrandSupplement={(
          <a href={planHref} className="ws-studio-shell__brand-link">
            <span className="ws-studio-shell__brand-meta">
              {courseContext || intl.formatMessage(messages.courseFallback)}
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
            <nav
              ref={tabsRef}
              className="ws-studio-shell__tabs"
              aria-label={intl.formatMessage(messages.courseNavigation)}
            >
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
