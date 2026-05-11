import React from 'react';
import { Button, Container } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import {
  ProblemTypeKeys,
  AdvanceProblemKeys,
  AdvancedProblemType,
  ProblemType,
} from '@src/editors/data/constants/problem';
// SelectableBox in paragon has a bug where you can't change selection. So we override it
import SelectableBox from '../../../../../sharedComponents/SelectableBox';
import messages from './messages';

interface Props {
  selected: ProblemType;
  setSelected: (selected: ProblemType | AdvancedProblemType) => void;
}

const ProblemTypeSelect: React.FC<Props> = ({
  selected,
  setSelected,
}) => {
  const handleChange = e => setSelected(e.target.value);
  const handleClick = () => setSelected(AdvanceProblemKeys.BLANK);
  const settings = { type: 'radio' };

  return (
    <Container className="problem-type-modal__type-list">
      <SelectableBox.Set
        name="problem-type"
        columns={1}
        onChange={handleChange}
        type={settings.type}
        value={selected}
      >
        {Object.values(ProblemTypeKeys).map((key) => (
          key !== 'advanced'
            ? (
              <SelectableBox
                className="problem-type-modal__type-option"
                id={key}
                key={key}
                value={key}
                {...settings}
              >
                <FormattedMessage {...messages[`problemType.${key}.title`]} />
              </SelectableBox>
            )
            : null
        ))}
      </SelectableBox.Set>
      <Button variant="link" className="problem-type-modal__advanced-link" onClick={handleClick}>
        <FormattedMessage {...messages.advanceProblemButtonLabel} />
      </Button>
    </Container>
  );
};

export default ProblemTypeSelect;
