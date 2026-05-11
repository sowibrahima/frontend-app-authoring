import React from 'react';
import { Icon } from '@openedx/paragon';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Check } from '@openedx/paragon/icons';
import { typeRowHooks } from '../hooks';

import Button from '../../../../../../sharedComponents/Button';

const TypeRow = ({
  answers,
  blockTitle,
  correctAnswerCount,
  typeKey,
  label,
  selected,
  problemType,
  lastRow,
  setBlockTitle,
  updateField,
  updateAnswer,
}) => {
  const intl = useIntl();

  const { onClick } = typeRowHooks({
    answers,
    blockTitle,
    correctAnswerCount,
    problemType,
    setBlockTitle,
    typeKey,
    updateField,
    updateAnswer,
    formatMessage: intl.formatMessage,
  });

  return (
    <>
      <Button
        type="button"
        onClick={onClick}
        className={`problem-type-option${selected ? '' : ' is-selected'}`}
        aria-current={selected ? undefined : 'true'}
      >
        <span className="problem-type-option__label">{label}</span>
        <span className="problem-type-option__check" hidden={selected}>
          <Icon src={Check} />
        </span>
      </Button>
      <hr className={lastRow ? 'd-none' : 'problem-type-option__divider'} />
    </>
  );
};

TypeRow.propTypes = {
  answers: PropTypes.arrayOf(PropTypes.shape({
    correct: PropTypes.bool,
    id: PropTypes.string,
    selectedFeedback: PropTypes.string,
    title: PropTypes.string,
    unselectedFeedback: PropTypes.string,
  })).isRequired,
  blockTitle: PropTypes.string.isRequired,
  correctAnswerCount: PropTypes.number.isRequired,
  typeKey: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  lastRow: PropTypes.bool.isRequired,
  problemType: PropTypes.string.isRequired,
  setBlockTitle: PropTypes.func.isRequired,
  updateAnswer: PropTypes.func.isRequired,
  updateField: PropTypes.func.isRequired,
};

export default TypeRow;
