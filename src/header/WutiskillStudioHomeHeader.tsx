import React, {
  useEffect, useRef, useState,
} from 'react';
import { getConfig } from '@edx/frontend-platform';
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
  studioHome: {
    id: 'wuti.authoring.studioHomeHeader.studioHome',
    defaultMessage: 'Studio home',
    description: 'Studio home link in the user menu',
  },
  lmsDashboard: {
    id: 'wuti.authoring.studioHomeHeader.lmsDashboard',
    defaultMessage: 'Learner dashboard',
    description: 'Learner dashboard link in the user menu',
  },
  logout: {
    id: 'wuti.authoring.studioHomeHeader.logout',
    defaultMessage: 'Sign out',
    description: 'Sign out link in the user menu',
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const learnerDashboardUrl = getConfig().LEARNER_DASHBOARD_URL
    || `${getConfig().LMS_BASE_URL}/dashboard`;

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isUserMenuOpen]);

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
          </nav>
        </div>

        <div className="ws-studio-home-header__user-menu" ref={userMenuRef}>
          <button
            type="button"
            className="ws-studio-home-header__user-btn"
            aria-label={intl.formatMessage(messages.userMenu)}
            aria-expanded={isUserMenuOpen}
            aria-controls="ws-studio-home-account-menu"
            onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
          >
            <span className="ws-studio-home-header__avatar">
              {getInitials(username)}
            </span>
            <Icon src={ExpandMore} className="ws-studio-home-header__chevron" />
          </button>
          {isUserMenuOpen ? (
            <nav
              id="ws-studio-home-account-menu"
              className="ws-studio-home-header__account-menu"
              aria-label={intl.formatMessage(messages.userMenu)}
            >
              <button
                type="button"
                className="ws-studio-home-header__account-link"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/home');
                }}
              >
                {intl.formatMessage(messages.studioHome)}
              </button>
              <a className="ws-studio-home-header__account-link" href={learnerDashboardUrl}>
                {intl.formatMessage(messages.lmsDashboard)}
              </a>
              <a className="ws-studio-home-header__account-link" href={getConfig().LOGOUT_URL}>
                {intl.formatMessage(messages.logout)}
              </a>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default WutiskillStudioHomeHeader;
