import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import AssignmentSection from '.';
import AssignmentItem from './assignments/AssignmentItem';
import AssignmentTypeName from './assignments/AssignmentTypeName';
import messages from './messages';

const testObj = {};

const defaultAssignments = {
  type: 'Test type',
  minCount: 1,
  dropCount: 1,
  shortLabel: 'TT',
  weight: 100,
  id: 0,
};

const setGradingData = (fn) => {
  testObj.graders = fn({}).graders;
};

const RootWrapper = (props = {}) => (
  <IntlProvider locale="en">
    <AssignmentSection
      handleRemoveAssignment={jest.fn()}
      setShowSavePrompt={jest.fn()}
      graders={[defaultAssignments]}
      setGradingData={jest.fn()}
      courseAssignmentLists={defaultAssignments}
      setShowSuccessAlert={jest.fn()}
      {...props}
    />
  </IntlProvider>
);

const StatefulRootWrapper = () => {
  const [state, setState] = React.useState({ graders: [defaultAssignments] });

  const setStatefulGradingData = (fn) => {
    setState((prevState) => {
      const nextState = fn(prevState);
      testObj.graders = nextState.graders;
      return nextState;
    });
  };

  return (
    <RootWrapper
      graders={state.graders}
      setGradingData={setStatefulGradingData}
    />
  );
};

describe('<AssignmentSection />', () => {
  it('checking the correct display of titles, labels, descriptions', async () => {
    const { getByText, queryByText } = render(<RootWrapper />);
    await waitFor(() => {
      expect(getByText(messages.assignmentTypeNameTitle.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.assignmentTypeNameDescription.defaultMessage)).toBeInTheDocument();
      expect(queryByText(messages.abbreviationTitle.defaultMessage)).not.toBeInTheDocument();
      expect(queryByText(messages.abbreviationDescription.defaultMessage)).not.toBeInTheDocument();
      expect(getByText(messages.weightOfTotalGradeTitle.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.weightOfTotalGradeDescription.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.totalNumberTitle.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.totalNumberDescription.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.ignoreLowestScoresTitle.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.ignoreLowestScoresDescription.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.numberOfDroppableTitle.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.numberOfDroppableDescription.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.assignmentAlertWarningDescription.defaultMessage)).toBeInTheDocument();
      expect(getByText(messages.assignmentDeleteButton.defaultMessage)).toBeInTheDocument();
    });
  });
  it('keeps hidden assignment abbreviation synced to the full assignment type name', () => {
    const { getByTestId, queryByTestId } = render(<RootWrapper setGradingData={setGradingData} />);
    expect(queryByTestId('assignment-shortLabel-input')).not.toBeInTheDocument();

    const assignmentTypeNameInput = getByTestId('assignment-type-name-input');
    fireEvent.change(assignmentTypeNameInput, { target: { name: 'type', value: 'Project work' } });
    expect(testObj.graders[0].type).toBe('Project work');
    expect(testObj.graders[0].shortLabel).toBe('Project work');
  });
  it('checking correct assignment weight of total grade value', async () => {
    const { getByTestId } = render(<RootWrapper setGradingData={setGradingData} />);
    await waitFor(() => {
      const assignmentWeightInput = getByTestId('assignment-weight-input');
      expect(assignmentWeightInput.value).toBe('100');
      fireEvent.change(assignmentWeightInput, { target: { value: '123' } });
      expect(testObj.graders[0].weight).toBe(123);
    });
  });
  it('checking correct assignment total number value', async () => {
    const { getByTestId } = render(<RootWrapper setGradingData={setGradingData} />);
    await waitFor(() => {
      const assignmentTotalNumberInput = getByTestId('assignment-minCount-input');
      expect(assignmentTotalNumberInput.value).toBe('1');
      fireEvent.change(assignmentTotalNumberInput, { target: { value: '123' } });
      expect(testObj.graders[0].minCount).toBe(123);
    });
  });
  it('checking correct assignment number of droppable value', async () => {
    const { getByTestId } = render(<RootWrapper setGradingData={setGradingData} />);
    await waitFor(() => {
      expect(getByTestId('assignment-ignore-lowest-toggle')).toBeInTheDocument();
      const assignmentNumberOfDroppableInput = getByTestId('assignment-dropCount-input');
      expect(assignmentNumberOfDroppableInput.value).toBe('1');
      fireEvent.change(assignmentNumberOfDroppableInput, { target: { value: '2' } });
      expect(testObj.graders[0].dropCount).toBe(2);
    });
  });
  it('hides and clears scores to ignore when ignore lowest scores is disabled', async () => {
    const { getByTestId, queryByTestId } = render(<StatefulRootWrapper />);
    await waitFor(() => {
      expect(getByTestId('assignment-dropCount-input')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('assignment-ignore-lowest-toggle'));
    expect(testObj.graders[0].dropCount).toBe(0);
    await waitFor(() => {
      expect(queryByTestId('assignment-dropCount-input')).not.toBeInTheDocument();
    });
  });
  it('checking correct error msg if dropCount have negative number or empty string', async () => {
    const { getByText, getByTestId } = render(<RootWrapper />);
    await waitFor(() => {
      const assignmentNumberOfDroppableInput = getByTestId('assignment-dropCount-input');
      expect(assignmentNumberOfDroppableInput.value).toBe('1');
      fireEvent.change(assignmentNumberOfDroppableInput, { target: { value: '-2' } });
      expect(getByText(messages.numberOfDroppableErrorMessage.defaultMessage)).toBeInTheDocument();
      fireEvent.change(assignmentNumberOfDroppableInput, { target: { value: '' } });
      expect(getByText(messages.numberOfDroppableErrorMessage.defaultMessage)).toBeInTheDocument();
    });
  });
  it('checking correct error msg if minCount have negative number or empty string', async () => {
    const { getByText, getByTestId } = render(<RootWrapper />);
    await waitFor(() => {
      const assignmentMinCountInput = getByTestId('assignment-minCount-input');
      expect(assignmentMinCountInput.value).toBe('1');
      fireEvent.change(assignmentMinCountInput, { target: { value: '-2' } });
      expect(getByText(messages.totalNumberErrorMessage.defaultMessage)).toBeInTheDocument();
      fireEvent.change(assignmentMinCountInput, { target: { value: '' } });
      expect(getByText(messages.totalNumberErrorMessage.defaultMessage)).toBeInTheDocument();
    });
  });
  it('should disable all inputs and delete button when isEditable is false', async () => {
    const { getAllByRole, getByText } = render(<RootWrapper isEditable={false} />);
    await waitFor(() => {
      const inputs = getAllByRole('textbox').concat(getAllByRole('spinbutton'));
      inputs.forEach((input) => expect(input).toBeDisabled());
      const deleteBtn = getByText(messages.assignmentDeleteButton.defaultMessage).closest('button');
      expect(deleteBtn).toBeDisabled();
    });
  });

  it('renders AssignmentItem with default disabled=false when prop is omitted', () => {
    const { getByTestId } = render(
      <IntlProvider locale="en">
        <ul>
          <AssignmentItem
            title="Test"
            descriptions="Test description"
            type="text"
            name="shortLabel"
            className="test-class"
            onChange={jest.fn()}
          />
        </ul>
      </IntlProvider>,
    );
    expect(getByTestId('assignment-shortLabel-input')).not.toBeDisabled();
  });

  it('renders AssignmentTypeName with default disabled=false when prop is omitted', () => {
    const { getByTestId } = render(
      <IntlProvider locale="en">
        <ul>
          <AssignmentTypeName value="Homework" onChange={jest.fn()} />
        </ul>
      </IntlProvider>,
    );
    expect(getByTestId('assignment-type-name-input')).not.toBeDisabled();
  });

  it('checking correct error msg if total weight have negative number', async () => {
    const { getByText, getByTestId } = render(<RootWrapper />);
    await waitFor(() => {
      const assignmentWeightInput = getByTestId('assignment-weight-input');
      expect(assignmentWeightInput.value).toBe('100');
      fireEvent.change(assignmentWeightInput, { target: { value: '-100' } });
      expect(getByText(messages.weightOfTotalGradeErrorMessage.defaultMessage)).toBeInTheDocument();
    });
  });
});
