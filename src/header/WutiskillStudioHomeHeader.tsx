import React from 'react';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import { ExpandMore } from '@openedx/paragon/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import './WutiskillStudioHomeHeader.scss';

const messages = defineMessages({
  mainNavigation: {
    id: 'wuti.authoring.studioHomeHeader.mainNavigation',
    defaultMessage: 'Main navigation',
    description: 'Accessible label for Studio home main navigation',
  },
  dashboard: {
    id: 'wuti.authoring.studioHomeHeader.dashboard',
    defaultMessage: 'Dashboard',
    description: 'Dashboard nav label in Studio home header',
  },
  templates: {
    id: 'wuti.authoring.studioHomeHeader.templates',
    defaultMessage: 'Templates',
    description: 'Templates nav label in Studio home header',
  },
  analytics: {
    id: 'wuti.authoring.studioHomeHeader.analytics',
    defaultMessage: 'Analytics',
    description: 'Analytics nav label in Studio home header',
  },
  settings: {
    id: 'wuti.authoring.studioHomeHeader.settings',
    defaultMessage: 'Settings',
    description: 'Settings nav label in Studio home header',
  },
  userMenu: {
    id: 'wuti.authoring.studioHomeHeader.userMenu',
    defaultMessage: 'User menu',
    description: 'Accessible label for the user menu button',
  },
  fallbackUser: {
    id: 'wuti.authoring.studioHomeHeader.fallbackUser',
    defaultMessage: 'Instructor',
    description: 'Fallback user name for initials',
  },
});

const getInitials = (name: string) => {
  const normalized = name.trim();
  if (!normalized) {
    return 'WS';
  }
  const chunks = normalized.split(/\s+/).filter(Boolean);
  if (chunks.length === 1) {
    return chunks[0].slice(0, 2).toUpperCase();
  }
  return `${chunks[0][0]}${chunks[chunks.length - 1][0]}`.toUpperCase();
};

const WutiskillStudioHomeHeader = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthenticatedUser();
  const username = user?.name || user?.username || intl.formatMessage(messages.fallbackUser);
  const activePath = location.pathname;

  return (
    <header className="ws-studio-home-header">
      <div className="ws-studio-home-header__inner">
        <div className="ws-studio-home-header__left">
          <button
            type="button"
            className="ws-studio-home-header__brand"
            onClick={() => navigate('/home')}
            aria-label="WutiSkill Studio"
          >
            <span className="ws-studio-home-header__brand-icon">W</span>
            <span className="ws-studio-home-header__brand-text">
              WutiSkill <span>Studio</span>
            </span>
          </button>
          <nav className="ws-studio-home-header__nav" aria-label={intl.formatMessage(messages.mainNavigation)}>
            <button
              type="button"
              className={`ws-studio-home-header__nav-item${activePath === '/home' ? ' ws-studio-home-header__nav-item--active' : ''}`}
              onClick={() => navigate('/home')}
            >
              {intl.formatMessage(messages.dashboard)}
            </button>
            <button
              type="button"
              className={`ws-studio-home-header__nav-item${activePath.startsWith('/home/course-templates') ? ' ws-studio-home-header__nav-item--active' : ''}`}
              onClick={() => navigate('/home/course-templates')}
            >
              {intl.formatMessage(messages.templates)}
            </button>
            <button type="button" className="ws-studio-home-header__nav-item" disabled>
              {intl.formatMessage(messages.analytics)}
            </button>
            <button type="button" className="ws-studio-home-header__nav-item" disabled>
              {intl.formatMessage(messages.settings)}
            </button>
          </nav>
        </div>

        <button
          type="button"
          className="ws-studio-home-header__user-btn"
          aria-label={intl.formatMessage(messages.userMenu)}
        >
          <span className="ws-studio-home-header__avatar">
            {getInitials(username)}
          </span>
          <Icon src={ExpandMore} className="ws-studio-home-header__chevron" />
        </button>
      </div>
    </header>
  );
};

export default WutiskillStudioHomeHeader;
