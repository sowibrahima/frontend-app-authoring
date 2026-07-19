import React from 'react';
import SharedHeader from '@edx/frontend-component-header';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';
import { useLocation } from 'react-router-dom';

import { createCorrectInternalRoute } from '../utils';

const messages = defineMessages({
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
});

/**
 * Studio home uses the same shared account menu as the learning experience.
 * Keeping this header on the shared package prevents the two applications from
 * drifting in profile links, translations, focus handling, and responsive UI.
 */
const WutiskillStudioHomeHeader = () => {
  const intl = useIntl();
  const { pathname } = useLocation();
  const homeUrl = createCorrectInternalRoute('/home');
  const templatesUrl = createCorrectInternalRoute('/home/course-templates');

  return (
    <SharedHeader
      logoDestination={homeUrl}
      showStudioLinkInUserMenu={false}
      userMenuVariant="default"
      mainMenuItems={[
        {
          type: 'item',
          href: homeUrl,
          content: intl.formatMessage(messages.dashboard),
          isActive: pathname === '/home',
        },
        {
          type: 'item',
          href: templatesUrl,
          content: intl.formatMessage(messages.templates),
          isActive: pathname.startsWith('/home/course-templates'),
        },
      ]}
      secondaryMenuItems={[]}
    />
  );
};

export default WutiskillStudioHomeHeader;
