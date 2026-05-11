import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl, FormattedMessage } from '@edx/frontend-platform/i18n';

import {
  Container,
  Button,
  AlertModal,
  ActionRow,
} from '@openedx/paragon';

import PropTypes from 'prop-types';
import { useEditorContext } from '@src/editors/EditorContext';
import AnswerWidget from './AnswerWidget';
import SettingsWidget from './SettingsWidget';
import QuestionWidget from './QuestionWidget';
import EditorContainer from '../../../EditorContainer';
import RawEditor from '../../../../sharedComponents/RawEditor';
import { ProblemTypeKeys } from '../../../../data/constants/problem';

import {
  checkIfEditorsDirty, parseState, saveWarningModalToggle, getContent,
} from './hooks';

import './index.scss';
import messages from './messages';
import ExplanationWidget from './ExplanationWidget';
import { saveBlock } from '../../../../hooks';

import { actions, selectors } from '../../../../data/redux';
import { ProblemEditorContextProvider } from './ProblemEditorContext';

const EditProblemView = ({ returnFunction }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const editorRef = useRef(null);

  const analytics = useSelector(selectors.app.analytics);
  const lmsEndpointUrl = useSelector(selectors.app.lmsEndpointUrl);
  const returnUrl = useSelector(selectors.app.returnUrl);
  const learningContextId = useSelector(selectors.app.learningContextId);
  const blockId = useSelector(selectors.app.blockId);
  const problemType = useSelector(selectors.problem.problemType);
  const problemState = useSelector(selectors.problem.completeState);
  const isDirty = useSelector(selectors.problem.isDirty);

  const isMarkdownEditorEnabledSelector = useSelector(selectors.problem.isMarkdownEditorEnabled);
  const { isMarkdownEditorEnabledForContext } = useEditorContext();

  const isMarkdownEditorEnabled = isMarkdownEditorEnabledSelector && isMarkdownEditorEnabledForContext;

  const isAdvancedProblemType = problemType === ProblemTypeKeys.ADVANCED;

  const { isSaveWarningModalOpen, openSaveWarningModal, closeSaveWarningModal } = saveWarningModalToggle();
  const canUseAiGeneration = typeof window !== 'undefined'
    && Boolean(window.WSAIAssistant?.openComponentGenerationModal);

  const applyGeneratedQuiz = (quiz) => {
    if (!quiz?.question || !Array.isArray(quiz.choices)) {
      return;
    }

    const generatedAnswers = quiz.choices.map((choice, index) => ({
      id: String.fromCharCode(65 + index),
      title: choice.text || '',
      selectedFeedback: choice.feedback || quiz.explanation || '',
      unselectedFeedback: '',
      correct: Boolean(choice.correct),
      isAnswerRange: false,
    }));
    const normalizedAnswers = generatedAnswers.length ? generatedAnswers : [{
      id: 'A',
      title: '',
      selectedFeedback: '',
      unselectedFeedback: '',
      correct: true,
      isAnswerRange: false,
    }];
    const correctAnswerCount = normalizedAnswers.filter(answer => answer.correct).length;
    const generatedProblemType = correctAnswerCount > 1
      ? ProblemTypeKeys.MULTISELECT
      : ProblemTypeKeys.SINGLESELECT;

    dispatch(actions.problem.updateField({
      problemType: generatedProblemType,
      question: quiz.question,
      answers: normalizedAnswers,
      correctAnswerCount: Math.max(correctAnswerCount, 1),
      generalFeedback: quiz.explanation || '',
      isDirty: true,
    }));

    const editors = window.tinymce?.editors || {};
    editors.question?.setContent?.(quiz.question);
    normalizedAnswers.forEach((answer) => {
      editors[`answer-${answer.id}`]?.setContent?.(answer.title);
      editors[`selectedFeedback-${answer.id}`]?.setContent?.(answer.selectedFeedback);
      editors[`unselectedFeedback-${answer.id}`]?.setContent?.('');
    });
  };

  const openQuizGeneration = () => {
    window.WSAIAssistant.openComponentGenerationModal({
      courseId: learningContextId,
      blockId,
      componentType: 'quiz',
      onInsert: applyGeneratedQuiz,
    });
  };

  const checkIfDirty = () => {
    if (isAdvancedProblemType && editorRef?.current) {
      return editorRef.current.observer?.lastChange !== 0;
    }
    return isDirty || checkIfEditorsDirty();
  };

  return (
    <ProblemEditorContextProvider editorRef={editorRef}>
      <EditorContainer
        getContent={() => getContent({
          problemState,
          openSaveWarningModal,
          isAdvancedProblemType,
          isMarkdownEditorEnabled,
          editorRef,
          lmsEndpointUrl,
        })}
        isDirty={checkIfDirty}
        returnFunction={returnFunction}
      >
        <AlertModal
          title={isAdvancedProblemType
            ? intl.formatMessage(messages.olxSettingDiscrepancyTitle)
            : intl.formatMessage(messages.noAnswerTitle)}
          isOpen={isSaveWarningModalOpen}
          onClose={closeSaveWarningModal}
          footerNode={(
            <ActionRow>
              <Button variant="tertiary" onClick={closeSaveWarningModal}>
                <FormattedMessage {...messages.saveWarningModalCancelButtonLabel} />
              </Button>
              <Button
                onClick={() => saveBlock({
                  content: parseState({
                    problem: problemState,
                    isAdvanced: isAdvancedProblemType,
                    isMarkdown: isMarkdownEditorEnabled,
                    ref: editorRef,
                    lmsEndpointUrl,
                  })(),
                  returnFunction,
                  destination: returnUrl,
                  dispatch,
                  analytics,
                })}
              >
                <FormattedMessage {...messages.saveWarningModalSaveButtonLabel} />
              </Button>
            </ActionRow>
        )}
        >
          {isAdvancedProblemType ? (
            <FormattedMessage {...messages.olxSettingDiscrepancyBodyExplanation} />
          ) : (
            <>
              <div>
                <FormattedMessage {...messages.saveWarningModalBodyQuestion} />
              </div>
              <div>
                <FormattedMessage {...messages.noAnswerBodyExplanation} />
              </div>
            </>
          )}
        </AlertModal>

        <div className="editProblemView-aiActions">
          {canUseAiGeneration && !isAdvancedProblemType && !isMarkdownEditorEnabled && (
            <Button variant="primary" size="sm" onClick={openQuizGeneration}>
              <FormattedMessage {...messages.generateQuizWithAi} />
            </Button>
          )}
        </div>

        <div className="editProblemView">
          {isAdvancedProblemType || isMarkdownEditorEnabled ? (
            <Container fluid className="advancedEditorTopMargin p-0">
              <RawEditor
                editorRef={editorRef}
                lang={isMarkdownEditorEnabled ? 'markdown' : 'xml'}
                content={isMarkdownEditorEnabled ? problemState.rawMarkdown : problemState.rawOLX}
              />
            </Container>
          ) : (
            <span className="editProblemView-main">
              <QuestionWidget />
              <ExplanationWidget />
              <AnswerWidget problemType={problemType} />
            </span>
          )}

          <aside className="editProblemView-settingsColumn">
            <SettingsWidget problemType={problemType} />
          </aside>
        </div>
      </EditorContainer>
    </ProblemEditorContextProvider>
  );
};
EditProblemView.defaultProps = {
  returnFunction: null,
};

EditProblemView.propTypes = {
  returnFunction: PropTypes.func,
};

export default EditProblemView;
