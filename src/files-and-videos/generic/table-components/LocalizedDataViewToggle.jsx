import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Icon,
  IconButtonToggle,
  IconButtonWithTooltip,
} from '@openedx/paragon';
import { GridView, ListView } from '@openedx/paragon/icons';

import messages from '../messages';

const LocalizedDataViewToggle = ({ currentView, onChange }) => {
  const intl = useIntl();

  return (
    <div
      role="group"
      aria-label={intl.formatMessage(messages.dataViewToggleLabel)}
      className="pgn__data-table-dataview-toggle files-data-view-toggle"
    >
      <IconButtonToggle activeValue={currentView} onChange={onChange}>
        <IconButtonWithTooltip
          tooltipContent={intl.formatMessage(messages.cardViewTooltip)}
          value="card"
          src={GridView}
          iconAs={Icon}
          alt={intl.formatMessage(messages.cardViewLabel)}
        />
        <IconButtonWithTooltip
          tooltipContent={intl.formatMessage(messages.listViewTooltip)}
          value="list"
          src={ListView}
          iconAs={Icon}
          alt={intl.formatMessage(messages.listViewLabel)}
        />
      </IconButtonToggle>
    </div>
  );
};

LocalizedDataViewToggle.propTypes = {
  currentView: PropTypes.oneOf(['card', 'list']).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default LocalizedDataViewToggle;
