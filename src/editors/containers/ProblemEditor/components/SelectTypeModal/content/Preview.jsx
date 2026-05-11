import React from 'react';
import PropTypes from 'prop-types';
import { Image, Container } from '@openedx/paragon';
import {
  FormattedMessage,
  useIntl,
} from '@edx/frontend-platform/i18n';
import messages from './messages';
import { ProblemTypes } from '../../../../../data/constants/problem';

const Preview = ({
  problemType,
}) => {
  const intl = useIntl();
  if (problemType === null) {
    return null;
  }

  const staticData = ProblemTypes[problemType];

  return (
    <Container className="problem-type-modal__preview">
      <div className="problem-type-modal__preview-title">
        <FormattedMessage {...messages[`problemType.${problemType}.title`]} /> {intl.formatMessage(messages.problemTextInPreviewTitle)}
      </div>
      <Image
        fluid
        className="problem-type-modal__preview-image"
        src={staticData.preview}
        alt={intl.formatMessage(messages.previewAltText, { problemType })}
      />
      <div className="problem-type-modal__preview-description">
        <FormattedMessage {...messages[`problemType.${problemType}.description`]} />
      </div>
    </Container>
  );
};

Preview.defaultProps = {
  problemType: null,
};

Preview.propTypes = {
  problemType: PropTypes.string,
};

export default Preview;
