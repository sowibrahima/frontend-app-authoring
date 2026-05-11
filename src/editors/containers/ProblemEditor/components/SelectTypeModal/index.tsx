import React from 'react';

import { Row, Stack } from '@openedx/paragon';

import {
  AdvancedProblemType,
  isAdvancedProblemType,
  ProblemType,
  ProblemTypeKeys,
} from '@src/editors/data/constants/problem';
import ProblemTypeSelect from './content/ProblemTypeSelect';
import Preview from './content/Preview';
import AdvanceTypeSelect from './content/AdvanceTypeSelect';
import SelectTypeWrapper from './SelectTypeWrapper';
import * as hooks from './hooks';
import './index.scss';

interface Props {
  onClose: (() => void) | null;
}

const SelectTypeModal: React.FC<Props> = ({
  onClose,
}) => {
  const [selected, setSelected] = React.useState<ProblemType | AdvancedProblemType>(ProblemTypeKeys.SINGLESELECT);
  hooks.useArrowNav(selected, setSelected);

  return (
    <SelectTypeWrapper onClose={onClose} selected={selected}>
      <Row className="problem-type-modal__body-row">
        {(!isAdvancedProblemType(selected)) ? (
          <Stack direction="horizontal" gap={4} className="problem-type-modal__content">
            <ProblemTypeSelect selected={selected} setSelected={setSelected} />
            <Preview problemType={selected} />
          </Stack>
        ) : <AdvanceTypeSelect selected={selected} setSelected={setSelected} />}
      </Row>
    </SelectTypeWrapper>
  );
};

export default SelectTypeModal;
