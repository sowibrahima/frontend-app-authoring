import { useEffect } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useNavigate } from 'react-router-dom';

import { getItemIcon } from '@src/generic/block-type-utils';
import { useCourseItemData } from '@src/course-outline/data/apiHooks';
import Loading from '@src/generic/Loading';
import { useCourseAuthoringContext } from '@src/CourseAuthoringContext';
import { useCourseOutlineContext } from '@src/course-outline/CourseOutlineContext';
import { useOutlineSidebarContext } from '@src/course-outline/outline-sidebar/OutlineSidebarContext';
import { getLibraryId } from '@src/generic/key-utils';
import { SectionSettings } from '@src/course-outline/outline-sidebar/info-sidebar/SectionSettings';
import { canMoveSection } from '@src/course-outline/drag-helper/utils';
import { XBlock } from '@src/data/types';

import messages from '../messages';
import { PublishButon } from './PublishButon';
import { ContextualInfoSidebar } from './ContextualInfoSidebar';
import { VisibilityTypes } from '@src/data/constants';

export const SectionSidebar = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  const { openUnlinkModal } = useCourseAuthoringContext();
  const {
    openPublishModal,
    handleDuplicateSectionSubmit,
    sections,
    updateSectionOrderByIndex,
    openDeleteModal,
  } = useCourseOutlineContext();
  const {
    clearSelection,
    currentTabKey,
    setCurrentTabKey,
    selectedContainerState,
    setSelectedContainerState,
  } = useOutlineSidebarContext();
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
  const { sectionId = '', index } = selectedContainerState ?? {};
  const { data: sectionData, isLoading } = useCourseItemData<XBlock>(sectionId);

  const handlePublish = () => {
    if (sectionData?.hasChanges) {
      openPublishModal({
        value: sectionData,
        sectionId: sectionData.id,
      });
    }
  };

  if (isLoading || !sectionData) {
    return <Loading />;
  }

  const handleMove = (step: number) => {
    if (index !== undefined) {
      updateSectionOrderByIndex(index, index + step);
      setSelectedContainerState(
        selectedContainerState ? { ...selectedContainerState, index: index + step } : undefined,
      );
    }
  };

  const subsections = sectionData.childInfo?.children ?? [];
  const units = subsections.reduce(
    (count, subsection) => count + (subsection.childInfo?.children?.length ?? 0),
    0,
  );
  const visibleToStaffOnly = sectionData.visibilityState === VisibilityTypes.STAFF_ONLY;

  return (
    <ContextualInfoSidebar
      item={sectionData}
      eyebrow={intl.formatMessage(messages.contextSectionEyebrow)}
      icon={getItemIcon(sectionData.category || '')}
      summaryTitle={intl.formatMessage(messages.contextContentSummary)}
      facts={[
        {
          label: intl.formatMessage(messages.contextContentLabel),
          value: intl.formatMessage(messages.contextContentCount, {
            subsections: subsections.length,
            units,
          }),
        },
        {
          label: intl.formatMessage(messages.contextVisibilityLabel),
          value: intl.formatMessage(
            visibleToStaffOnly ? messages.contextStaffOnly : messages.contextAllLearners,
          ),
        },
        {
          label: intl.formatMessage(messages.contextHighlightsLabel),
          value: intl.formatMessage(messages.contextHighlightsCount, {
            count: sectionData.highlights?.length ?? 0,
          }),
        },
      ]}
      settings={<SectionSettings key={sectionId} sectionId={sectionId} />}
      currentTabKey={currentTabKey}
      setCurrentTabKey={setCurrentTabKey}
      onBack={clearSelection}
      publishAction={sectionData.hasChanges ? <PublishButon onClick={handlePublish} /> : undefined}
      menuProps={{
        itemId: sectionId,
        index: index ?? -1,
        actions: sectionData.actions || {},
        canMoveItem: canMoveSection(sections),
        onClickDuplicate: handleDuplicateSectionSubmit,
        onClickMoveUp: () => handleMove(-1),
        onClickMoveDown: () => handleMove(1),
        onClickUnlink: () => openUnlinkModal({ value: sectionData, sectionId }),
        onClickDelete: openDeleteModal,
        onClickViewLibrary: () => {
          const upstreamRef = sectionData.upstreamInfo?.upstreamRef;
          if (upstreamRef) {
            const libId = getLibraryId(upstreamRef);
            navigate(`/library/${libId}/section/${upstreamRef}`);
          }
        },
      }}
    />
  );
};
