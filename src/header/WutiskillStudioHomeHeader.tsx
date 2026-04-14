import React from 'react';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { Icon } from '@openedx/paragon';
import { ExpandMore } from '@openedx/paragon/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import './WutiskillStudioHomeHeader.scss';

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
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthenticatedUser();
  const username = user?.name || user?.username || 'Formateur';
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
          <nav className="ws-studio-home-header__nav" aria-label="Navigation principale">
            <button
              type="button"
              className={`ws-studio-home-header__nav-item${activePath === '/home' ? ' ws-studio-home-header__nav-item--active' : ''}`}
              onClick={() => navigate('/home')}
            >
              Tableau de bord
            </button>
            <button
              type="button"
              className={`ws-studio-home-header__nav-item${activePath.startsWith('/home/course-templates') ? ' ws-studio-home-header__nav-item--active' : ''}`}
              onClick={() => navigate('/home/course-templates')}
            >
              Modèles
            </button>
            <button type="button" className="ws-studio-home-header__nav-item" disabled>
              Analytique
            </button>
            <button type="button" className="ws-studio-home-header__nav-item" disabled>
              Paramètres
            </button>
          </nav>
        </div>

        <button type="button" className="ws-studio-home-header__user-btn" aria-label="Menu utilisateur">
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
