import { useEffect } from 'react';
import { isEmpty } from 'lodash';

import { useIntl } from '@edx/frontend-platform/i18n';
import { useNavigate } from 'react-router-dom';

import { getItemIcon } from '@src/generic/block-type-utils';
import { useCourseItemData } from '@src/course-outline/data/apiHooks';
import Loading from '@src/generic/Loading';
import { useCourseAuthoringContext } from '@src/CourseAuthoringContext';
import { useCourseOutlineContext } from '@src/course-outline/CourseOutlineContext';
import { useOutlineSidebarContext } from '@src/course-outline/outline-sidebar/OutlineSidebarContext';
import { getLibraryId } from '@src/generic/key-utils';
import { possibleSubsectionMoves } from '@src/course-outline/drag-helper/utils';
import { XBlock } from '@src/data/types';

import { PublishButon } from './PublishButon';
import messages from '../messages';
import { SubsectionSettings } from './SubsectionSettings';
import { ContextualInfoSidebar } from './ContextualInfoSidebar';
import { VisibilityTypes } from '@src/data/constants';

export const SubsectionSidebar = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  const {
    clearSelection,
    currentTabKey,
    setCurrentTabKey,
    selectedContainerState,
    setSelectedContainerState,
  } = useOutlineSidebarContext();
  const { subsectionId = '', index } = selectedContainerState ?? {};

  const { data: subsectionData, isLoading } = useCourseItemData<XBlock>(subsectionId);

  const availableTabs = {
    info: 'info',
    settings: 'settings',
  };

  useEffect(() => {
    if (!currentTabKey || !Object.values(availableTabs).includes(currentTabKey)) {
      // Set default Tab key
      setCurrentTabKey('info');
    }
  }, [currentTabKey, setCurrentTabKey]);
  const { data: section } = useCourseItemData<XBlock>(selectedContainerState?.sectionId);
  const { openUnlinkModal } = useCourseAuthoringContext();
  const {
    openPublishModal,
    handleDuplicateSubsectionSubmit,
    sections,
    updateSubsectionOrderByIndex,
    openDeleteModal,
  } = useCourseOutlineContext();
  const sectionIndex = sections.findIndex((s) => s.id === selectedContainerState?.sectionId);

  const handlePublish = () => {
    if (selectedContainerState?.sectionId && subsectionData?.hasChanges) {
      openPublishModal({
        value: subsectionData,
        sectionId: selectedContainerState?.sectionId,
      });
    }
  };

  if (isLoading || !subsectionData) {
    return <Loading />;
  }

  // re-create actions object for customizations
  const actions = { ...subsectionData.actions };
  actions.deletable = actions.deletable && !section?.upstreamInfo?.upstreamRef;
  actions.duplicable = actions.duplicable && !section?.upstreamInfo?.upstreamRef;

  const getPossibleMoves = section ?
    possibleSubsectionMoves(
      [...sections],
      sectionIndex ?? -1,
      section,
      section.childInfo.children,
    ) :
    undefined;

  const canMoveSubsection = (oldIndex: number, step: number) => {
    if (getPossibleMoves && section) {
      const moveDetails = getPossibleMoves(oldIndex, step);
      return !isEmpty(moveDetails) && !section.upstreamInfo?.upstreamRef;
    }
    // istanbul ignore next
    return false;
  };

  const handleMove = (step: number) => {
    if (section && getPossibleMoves && index !== undefined && sectionIndex !== undefined) {
      const moveDetails = getPossibleMoves(index, step);
      updateSubsectionOrderByIndex(section, moveDetails);
      if (!isEmpty(moveDetails)) {
        const newSectionId = moveDetails.sectionId;
        // A subsection can move to a different section (cross-section move)
        const isCrossSection = newSectionId !== section.id;
        // istanbul ignore next
        const newSectionIndex = isCrossSection
          ? sections.findIndex((s) => s.id === newSectionId)
          : sectionIndex;
        // Cross-section up: goes to end of previous section; cross-section down: goes to start of next section
        // istanbul ignore next
        const newIndex = isCrossSection
          ? (step === -1 ? sections[newSectionIndex].childInfo.children.length : 0)
          : index + step;
        // istanbul ignore next
        setSelectedContainerState(
          selectedContainerState ?
            {
              ...selectedContainerState,
              sectionId: newSectionId,
              index: newIndex,
            } :
            undefined,
        );
      }
    }
  };

  const visibleToStaffOnly = subsectionData.visibilityState === VisibilityTypes.STAFF_ONLY;
  const assessmentResults = subsectionData.showCorrectness === 'always'
    ? messages.contextAssessmentAlways
    : subsectionData.showCorrectness === 'past_due'
    ? messages.contextAssessmentAfterDue
    : messages.contextAssessmentHidden;
  const specialExamConfigured = subsectionData.isTimeLimited
    || subsectionData.isProctoredExam
    || subsectionData.isPracticeExam
    || subsectionData.isOnboardingExam;

  return (
    <ContextualInfoSidebar
      item={subsectionData}
      eyebrow={intl.formatMessage(messages.contextSubsectionEyebrow)}
      icon={getItemIcon(subsectionData.category || '')}
      summaryTitle={intl.formatMessage(messages.contextTeachingSummary)}
      facts={[
        {
          label: intl.formatMessage(messages.contextContentLabel),
          value: intl.formatMessage(messages.contextUnitCount, {
            units: subsectionData.childInfo?.children?.length ?? 0,
          }),
        },
        {
          label: intl.formatMessage(messages.contextGradingLabel),
          value: subsectionData.graded
            ? (subsectionData.format || intl.formatMessage(messages.contextGraded))
            : intl.formatMessage(messages.contextUngraded),
        },
        {
          label: intl.formatMessage(messages.contextVisibilityLabel),
          value: intl.formatMessage(
            visibleToStaffOnly ? messages.contextStaffOnly : messages.contextAllLearners,
          ),
        },
        {
          label: intl.formatMessage(messages.contextAssessmentResultsLabel),
          value: intl.formatMessage(assessmentResults),
        },
        {
          label: intl.formatMessage(messages.contextSpecialExamLabel),
          value: intl.formatMessage(
            specialExamConfigured ? messages.contextSpecialExamConfigured : messages.contextNone,
          ),
        },
      ]}
      settings={<SubsectionSettings key={subsectionId} subsectionId={subsectionId} />}
      currentTabKey={currentTabKey}
      setCurrentTabKey={setCurrentTabKey}
      onBack={clearSelection}
      publishAction={subsectionData.hasChanges ? <PublishButon onClick={handlePublish} /> : undefined}
      menuProps={{
        itemId: subsectionId,
        index: index ?? -1,
        actions,
        canMoveItem: canMoveSubsection,
        onClickDuplicate: handleDuplicateSubsectionSubmit,
        onClickMoveUp: () => handleMove(-1),
        onClickMoveDown: () => handleMove(1),
        onClickUnlink: () =>
          openUnlinkModal({
            value: subsectionData,
            sectionId: selectedContainerState?.sectionId,
          }),
        onClickDelete: openDeleteModal,
        onClickViewLibrary: () => {
          const upstreamRef = subsectionData.upstreamInfo?.upstreamRef;
          if (upstreamRef) {
            const libId = getLibraryId(upstreamRef);
            navigate(`/library/${libId}/subsection/${upstreamRef}`);
          }
        },
      }}
    />
  );
};
