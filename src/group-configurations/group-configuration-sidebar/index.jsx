import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import { HelpSidebar } from '../../generic/help-sidebar';
import { getSidebarData } from './utils';
import messages from './messages';

const GroupConfigurationSidebar = ({
  courseId,
  shouldShowExperimentGroups,
  shouldShowContentGroup,
  shouldShowEnrollmentTrackGroup,
}) => {
  const intl = useIntl();
  const sidebarData = getSidebarData({
    messages,
    intl,
    shouldShowExperimentGroups,
    shouldShowContentGroup,
    shouldShowEnrollmentTrackGroup,
  });

  return (
    <HelpSidebar
      courseId={courseId}
      showOtherSettings
      className="mt-4"
    >
      {sidebarData
        .map(({ title, paragraphs }, idx) => (
          <Fragment key={title}>
            <h4 className="help-sidebar-about-title">
              {title}
            </h4>
            {paragraphs.map((text) => (
              <p key={text} className="help-sidebar-about-descriptions">
                {text}
              </p>
            ))}
            {idx !== sidebarData.length - 1 && <hr />}
          </Fragment>
        ))}
    </HelpSidebar>
  );
};

GroupConfigurationSidebar.propTypes = {
  courseId: PropTypes.string.isRequired,
  shouldShowContentGroup: PropTypes.bool.isRequired,
  shouldShowExperimentGroups: PropTypes.bool.isRequired,
  shouldShowEnrollmentTrackGroup: PropTypes.bool.isRequired,
};

export default GroupConfigurationSidebar;
