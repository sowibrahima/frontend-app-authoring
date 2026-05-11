import React, {
  useContext, useEffect, useState, useRef, useCallback, ReactNode, useMemo,
} from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  ActionRow, Button, Icon, StandardModal, useToggle,
} from '@openedx/paragon';
import { useQueryClient } from '@tanstack/react-query';
import classNames from 'classnames';
import { isEmpty } from 'lodash';

import CourseOutlineSubsectionCardExtraActionsSlot from '@src/plugin-slots/CourseOutlineSubsectionCardExtraActionsSlot';
import { setCurrentItem, setCurrentSection, setCurrentSubsection } from '@src/course-outline/data/slice';
import { RequestStatus, RequestStatusType } from '@src/data/constants';
import CardHeader from '@src/course-outline/card-header/CardHeader';
import SortableItem from '@src/course-outline/drag-helper/SortableItem';
import { DragContext } from '@src/course-outline/drag-helper/DragContextProvider';
import { useClipboard, PasteComponent } from '@src/generic/clipboard';
import TitleButton from '@src/course-outline/card-header/TitleButton';
import { fetchCourseSectionQuery } from '@src/course-outline/data/thunk';
import XBlockStatus from '@src/course-outline/xblock-status/XBlockStatus';
import { getItemStatus, getItemStatusBorder, scrollToElement } from '@src/course-outline/utils';
import { ComponentPicker, SelectedComponent } from '@src/library-authoring';
import { COMPONENT_TYPE_ICON_MAP, COMPONENT_TYPES } from '@src/generic/block-type-utils/constants';
import { ContainerType } from '@src/generic/key-utils';
import { UpstreamInfoIcon } from '@src/generic/upstream-info-icon';
import { ContentType } from '@src/library-authoring/routes';
import OutlineAddChildButtons from '@src/course-outline/OutlineAddChildButtons';
import { PreviewLibraryXBlockChanges } from '@src/course-unit/preview-changes';
import addComponentMessages from '@src/course-unit/add-component/messages';
import type { XBlock } from '@src/data/types';
import { invalidateLinksQuery } from '@src/course-libraries/data/apiHooks';
import { getLiveSessionsCapability } from '@src/course-unit/add-component/liveSessionsApi';
import messages from './messages';

type UnitComponentData = {
  type: string,
  category?: string,
  displayName?: string,
  boilerplate?: string,
};

type CreatedComponentData = {
  courseKey: string,
  locator: string,
  unitLocator?: string,
};

const LIVE_SESSION_XBLOCK_TYPE = 'live_session';

const getEditorPage = (): React.ComponentType<any> => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const module = require('@src/editors/EditorPage');
  return module.default;
};

const getVideoSelectorPage = (): React.ComponentType<any> => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const module = require('@src/editors/VideoSelectorPage');
  return module.default;
};

interface SubsectionCardProps {
  section: XBlock,
  subsection: XBlock,
  children: ReactNode
  isSectionsExpanded: boolean,
  isSelfPaced: boolean,
  isCustomRelativeDatesActive: boolean,
  onOpenPublishModal: () => void,
  onEditSubmit: (itemId: string, sectionId: string, displayName: string) => void,
  savingStatus?: RequestStatusType,
  onOpenDeleteModal: () => void,
  onOpenUnlinkModal: () => void,
  onDuplicateSubmit: () => void,
  onNewUnitSubmit: (
    subsectionId: string,
    sectionId?: string,
    component?: UnitComponentData,
    callback?: (args: CreatedComponentData) => void,
  ) => void,
  onAddUnitFromLibrary: (options: {
    type: string,
    category?: string,
    parentLocator: string,
    displayName?: string,
    boilerplate?: string,
    stagedContent?: string,
    libraryContentKey: string,
  }) => void,
  index: number,
  getPossibleMoves: (index: number, step: number) => void,
  onOrderChange: (section: XBlock, moveDetails: any) => void,
  onOpenConfigureModal: () => void,
  onPasteClick: (parentLocator: string, sectionId: string) => void,
  resetScrollState: () => void,
}

type ActivityPickerItem = {
  key: string,
  title: string,
  description: string,
  icon: React.ComponentType,
  onClick?: () => void,
  disabled?: boolean,
};

type AdvancedActivityPickerItem = {
  key: string,
  title: string,
  description: string,
  component: UnitComponentData,
};

const SubsectionCard = ({
  section,
  subsection,
  isSectionsExpanded,
  isSelfPaced,
  isCustomRelativeDatesActive,
  children,
  index,
  getPossibleMoves,
  onOpenPublishModal,
  onEditSubmit,
  savingStatus,
  onOpenDeleteModal,
  onOpenUnlinkModal,
  onDuplicateSubmit,
  onNewUnitSubmit,
  onAddUnitFromLibrary,
  onOrderChange,
  onOpenConfigureModal,
  onPasteClick,
  resetScrollState,
}: SubsectionCardProps) => {
  const currentRef = useRef(null);
  const intl = useIntl();
  const dispatch = useDispatch();
  const { activeId, overId } = useContext(DragContext);
  const [searchParams] = useSearchParams();
  const locatorId = searchParams.get('show');
  const isScrolledToElement = locatorId === subsection.id;
  const [isFormOpen, openForm, closeForm] = useToggle(false);
  const [isSyncModalOpen, openSyncModal, closeSyncModal] = useToggle(false);
  const namePrefix = 'subsection';
  const { sharedClipboardData, showPasteUnit } = useClipboard();
  const [
    isAddLibraryUnitModalOpen,
    openAddLibraryUnitModal,
    closeAddLibraryUnitModal,
  ] = useToggle(false);
  const [
    isActivityPickerOpen,
    openActivityPicker,
    closeActivityPicker,
  ] = useToggle(false);
  const [
    isVideoSelectorModalOpen,
    showVideoSelectorModal,
    closeVideoSelectorModal,
  ] = useToggle(false);
  const [
    isXBlockEditorModalOpen,
    showXBlockEditorModal,
    closeXBlockEditorModal,
  ] = useToggle(false);
  const [activityPickerStep, setActivityPickerStep] = useState<'root' | 'read' | 'exercise' | 'other'>('root');
  const [selectedAdvancedActivityKey, setSelectedAdvancedActivityKey] = useState<string | null>(null);
  const [isLiveSessionAvailabilityLoaded, setIsLiveSessionAvailabilityLoaded] = useState(false);
  const [isLiveSessionAvailable, setIsLiveSessionAvailable] = useState(false);
  const [editorCourseId, setEditorCourseId] = useState<string | null>(null);
  const [editorBlockType, setEditorBlockType] = useState<string | null>(null);
  const [editorBlockId, setEditorBlockId] = useState<string | null>(null);
  const { courseId } = useParams();
  const queryClient = useQueryClient();

  const {
    id,
    category,
    displayName,
    hasChanges,
    published,
    visibilityState,
    actions: subsectionActions,
    isHeaderVisible = true,
    enableCopyPasteUnits = false,
    proctoringExamConfigurationLink,
    upstreamInfo,
  } = subsection;

  const blockSyncData = useMemo(() => {
    if (!upstreamInfo?.readyToSync) {
      return undefined;
    }
    return {
      displayName,
      downstreamBlockId: id,
      upstreamBlockId: upstreamInfo.upstreamRef,
      upstreamBlockVersionSynced: upstreamInfo.versionSynced,
      isReadyToSyncIndividually: upstreamInfo.isReadyToSyncIndividually,
      isContainer: true,
      blockType: 'subsection',
    };
  }, [upstreamInfo]);

  // re-create actions object for customizations
  const actions = { ...subsectionActions };
  // add actions to control display of move up & down menu button.
  const moveUpDetails = getPossibleMoves(index, -1);
  const moveDownDetails = getPossibleMoves(index, 1);
  actions.allowMoveUp = !isEmpty(moveUpDetails) && !section.upstreamInfo?.upstreamRef;
  actions.allowMoveDown = !isEmpty(moveDownDetails) && !section.upstreamInfo?.upstreamRef;
  actions.deletable = actions.deletable && !section.upstreamInfo?.upstreamRef;
  actions.duplicable = actions.duplicable && !section.upstreamInfo?.upstreamRef;

  // Expand the subsection if a search result should be shown/scrolled to
  const containsSearchResult = () => {
    if (locatorId) {
      return !!subsection.childInfo?.children?.filter((child) => child.id === locatorId).length;
    }

    return false;
  };
  const [isExpanded, setIsExpanded] = useState(containsSearchResult() || !isHeaderVisible || isSectionsExpanded);
  const subsectionStatus = getItemStatus({
    published,
    visibilityState,
    hasChanges,
  });
  const borderStyle = getItemStatusBorder(subsectionStatus);

  useEffect(() => {
    setIsExpanded(isSectionsExpanded);
  }, [isSectionsExpanded]);

  const handleExpandContent = () => {
    setIsExpanded((prevState) => !prevState);
  };

  const handleClickMenuButton = () => {
    dispatch(setCurrentSection(section));
    dispatch(setCurrentSubsection(subsection));
    dispatch(setCurrentItem(subsection));
  };

  const handleOnPostChangeSync = useCallback(() => {
    dispatch(fetchCourseSectionQuery([section.id]));
    if (courseId) {
      invalidateLinksQuery(queryClient, courseId);
    }
  }, [dispatch, section, queryClient, courseId]);

  const handleEditSubmit = (titleValue: string) => {
    if (displayName !== titleValue) {
      onEditSubmit(id, section.id, titleValue);
      return;
    }

    closeForm();
  };

  const handleSubsectionMoveUp = () => {
    onOrderChange(section, moveUpDetails);
  };

  const handleSubsectionMoveDown = () => {
    onOrderChange(section, moveDownDetails);
  };

  const handleNewButtonClick = () => {
    setActivityPickerStep('root');
    setSelectedAdvancedActivityKey(null);
    openActivityPicker();
  };
  const handlePasteButtonClick = () => onPasteClick(id, section.id);

  const closeActivityPickerFlow = () => {
    setActivityPickerStep('root');
    setSelectedAdvancedActivityKey(null);
    closeActivityPicker();
  };

  const returnToActivityPickerRoot = () => {
    setActivityPickerStep('root');
    setSelectedAdvancedActivityKey(null);
  };

  const closeXBlockModals = useCallback(() => {
    closeXBlockEditorModal();
    closeVideoSelectorModal();
  }, [closeXBlockEditorModal, closeVideoSelectorModal]);

  const refreshSectionAfterXBlockEdit = useCallback(() => {
    closeXBlockModals();
    dispatch(fetchCourseSectionQuery([section.id], { subsectionId: id }));
  }, [closeXBlockModals, dispatch, section.id, id]);

  useEffect(() => {
    if (!isActivityPickerOpen || !courseId) {
      return undefined;
    }

    let isMounted = true;
    setIsLiveSessionAvailabilityLoaded(false);

    getLiveSessionsCapability(courseId)
      .then((capability) => {
        if (isMounted) {
          setIsLiveSessionAvailable(Boolean(capability.enabled));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLiveSessionAvailable(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLiveSessionAvailabilityLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [courseId, isActivityPickerOpen]);

  const openEditorForCreatedComponent = useCallback((component: UnitComponentData, result: CreatedComponentData) => {
    if (!result?.courseKey || !result?.locator) {
      return;
    }

    setEditorCourseId(result.courseKey);
    setEditorBlockType(component.type);
    setEditorBlockId(result.locator);

    if (component.type === COMPONENT_TYPES.video) {
      showVideoSelectorModal();
      return;
    }

    if (
      component.type === COMPONENT_TYPES.html
      || component.type === COMPONENT_TYPES.problem
      || component.type === COMPONENT_TYPES.openassessment
    ) {
      showXBlockEditorModal();
    }
  }, [showVideoSelectorModal, showXBlockEditorModal]);

  const handleCreateActivity = (component: UnitComponentData) => {
    onNewUnitSubmit(id, section.id, component, (result) => openEditorForCreatedComponent(component, result));
    closeActivityPickerFlow();
  };

  const liveSessionDescriptionMessage = () => {
    if (!isLiveSessionAvailabilityLoaded) {
      return addComponentMessages.lessonBuilderLiveCheckingDescription;
    }

    if (isLiveSessionAvailable) {
      return addComponentMessages.lessonBuilderLiveDescription;
    }

    return addComponentMessages.lessonBuilderLiveUnavailableDescription;
  };

  const activityGroups: ActivityPickerItem[] = [
    {
      key: 'read',
      title: intl.formatMessage(addComponentMessages.lessonBuilderReadTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderReadDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.html],
      onClick: () => setActivityPickerStep('read'),
    },
    {
      key: 'watch',
      title: intl.formatMessage(addComponentMessages.lessonBuilderWatchTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderWatchDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.video],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.video,
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderWatchTitle),
      }),
    },
    {
      key: 'listen',
      title: intl.formatMessage(addComponentMessages.lessonBuilderListenTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderListenDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.video],
      disabled: true,
    },
    {
      key: 'exercise',
      title: intl.formatMessage(addComponentMessages.lessonBuilderExerciseTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderExerciseDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.problem],
      onClick: () => setActivityPickerStep('exercise'),
    },
    {
      key: 'live',
      title: intl.formatMessage(addComponentMessages.lessonBuilderLiveTitle),
      description: intl.formatMessage(liveSessionDescriptionMessage()),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.video],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.advanced,
        category: LIVE_SESSION_XBLOCK_TYPE,
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderLiveTitle),
      }),
      disabled: !isLiveSessionAvailable,
    },
    {
      key: 'other',
      title: intl.formatMessage(addComponentMessages.lessonBuilderOtherTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderOtherDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.advanced],
      onClick: () => setActivityPickerStep('other'),
    },
  ];

  const readChoices: ActivityPickerItem[] = [
    {
      key: 'html',
      title: intl.formatMessage(addComponentMessages.lessonBuilderHtmlTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderHtmlDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.html],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.html,
        boilerplate: COMPONENT_TYPES.html,
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderHtmlTitle),
      }),
    },
    {
      key: 'pdf',
      title: intl.formatMessage(addComponentMessages.lessonBuilderPdfTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderPdfDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.html],
      disabled: true,
    },
  ];

  const exerciseChoices: ActivityPickerItem[] = [
    {
      key: 'quiz',
      title: intl.formatMessage(addComponentMessages.lessonBuilderQuizTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderQuizDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.problem],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.problem,
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderQuizTitle),
      }),
    },
    {
      key: 'drag-drop',
      title: intl.formatMessage(addComponentMessages.lessonBuilderDragDropTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderDragDropDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.dragAndDrop],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.dragAndDrop,
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderDragDropTitle),
      }),
    },
    {
      key: 'open-response',
      title: intl.formatMessage(addComponentMessages.lessonBuilderOpenResponseTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderOpenResponseDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.openassessment],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.openassessment,
        category: COMPONENT_TYPES.openassessment,
        boilerplate: 'peer-assessment',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderOpenResponseTitle),
      }),
    },
    {
      key: 'collect',
      title: intl.formatMessage(addComponentMessages.lessonBuilderCollectTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderCollectDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.openassessment],
      onClick: () => handleCreateActivity({
        type: COMPONENT_TYPES.openassessment,
        category: COMPONENT_TYPES.openassessment,
        boilerplate: 'staff-assessment',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderCollectTitle),
      }),
    },
  ];

  const otherChoices: AdvancedActivityPickerItem[] = [
    {
      key: 'scorm',
      title: intl.formatMessage(addComponentMessages.lessonBuilderScormTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderScormDescription),
      component: {
        type: COMPONENT_TYPES.advanced,
        category: 'scorm',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderScormTitle),
      },
    },
    {
      key: 'h5p',
      title: intl.formatMessage(addComponentMessages.lessonBuilderH5pTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderH5pDescription),
      component: {
        type: COMPONENT_TYPES.advanced,
        category: 'h5p',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderH5pTitle),
      },
    },
    {
      key: 'lti-consumer',
      title: intl.formatMessage(addComponentMessages.lessonBuilderLtiTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderLtiDescription),
      component: {
        type: COMPONENT_TYPES.advanced,
        category: 'lti_consumer',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderLtiTitle),
      },
    },
    {
      key: 'iframe',
      title: intl.formatMessage(addComponentMessages.lessonBuilderIframeTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderIframeDescription),
      component: {
        type: COMPONENT_TYPES.advanced,
        category: 'iframe',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderIframeTitle),
      },
    },
    {
      key: 'poll',
      title: intl.formatMessage(addComponentMessages.lessonBuilderPollTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderPollDescription),
      component: {
        type: COMPONENT_TYPES.advanced,
        category: 'poll',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderPollTitle),
      },
    },
    {
      key: 'survey',
      title: intl.formatMessage(addComponentMessages.lessonBuilderSurveyTitle),
      description: intl.formatMessage(addComponentMessages.lessonBuilderSurveyDescription),
      component: {
        type: COMPONENT_TYPES.advanced,
        category: 'survey',
        displayName: intl.formatMessage(addComponentMessages.lessonBuilderSurveyTitle),
      },
    },
  ];

  const selectedAdvancedActivity = otherChoices.find(
    (item) => item.key === selectedAdvancedActivityKey,
  );

  const renderActivityButtons = (items: ActivityPickerItem[]) => (
    <div className="ws-activity-picker__grid">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="ws-activity-picker__card"
          onClick={item.onClick}
          disabled={item.disabled}
        >
          <span className="ws-activity-picker__icon" aria-hidden="true">
            <Icon src={item.icon} />
          </span>
          <span className="ws-activity-picker__title">{item.title}</span>
          <span className="ws-activity-picker__description">{item.description}</span>
        </button>
      ))}
    </div>
  );

  const renderAdvancedActivityList = () => (
    <div className="ws-activity-picker__advanced-list" role="group">
      {otherChoices.map((item) => {
        const isSelected = selectedAdvancedActivityKey === item.key;

        return (
          <label
            key={item.key}
            className={classNames('ws-activity-picker__advanced-item', {
              'is-selected': isSelected,
            })}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => setSelectedAdvancedActivityKey(isSelected ? null : item.key)}
            />
            <span className="ws-activity-picker__advanced-checkbox" aria-hidden="true" />
            <span className="ws-activity-picker__advanced-content">
              <span className="ws-activity-picker__advanced-title">{item.title}</span>
              <span className="ws-activity-picker__advanced-description">{item.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );

  const titleComponent = (
    <TitleButton
      title={displayName}
      isExpanded={isExpanded}
      onTitleClick={handleExpandContent}
      namePrefix={namePrefix}
      prefixIcon={<UpstreamInfoIcon upstreamInfo={upstreamInfo} />}
    />
  );

  const extraActionsComponent = (
    <CourseOutlineSubsectionCardExtraActionsSlot
      subsection={subsection}
      section={section}
    />
  );

  useEffect(() => {
    if (activeId === id && isExpanded) {
      setIsExpanded(false);
    } else if (overId === id && !isExpanded) {
      setIsExpanded(true);
    }
  }, [activeId, overId]);

  useEffect(() => {
    // if this items has been newly added, scroll to it.
    if (currentRef.current && (subsection.shouldScroll || isScrolledToElement)) {
      // Align element closer to the top of the screen if scrolling for search result
      const alignWithTop = !!isScrolledToElement;
      scrollToElement(currentRef.current, alignWithTop, true);
      resetScrollState();
    }
  }, [isScrolledToElement]);

  useEffect(() => {
    // If the locatorId is set/changed, we need to make sure that the subsection is expanded
    // if it contains the result, in order to scroll to it
    setIsExpanded((prevState) => (containsSearchResult() || prevState));
  }, [locatorId, setIsExpanded]);

  useEffect(() => {
    if (savingStatus === RequestStatus.SUCCESSFUL) {
      closeForm();
    }
  }, [savingStatus]);

  const isDraggable = (
    actions.draggable
      && (actions.allowMoveUp || actions.allowMoveDown)
      && !(isHeaderVisible === false)
      && !section.upstreamInfo?.upstreamRef
  );

  const handleSelectLibraryUnit = useCallback((selectedUnit: SelectedComponent) => {
    onAddUnitFromLibrary({
      type: COMPONENT_TYPES.libraryV2,
      category: ContainerType.Vertical,
      parentLocator: id,
      libraryContentKey: selectedUnit.usageKey,
    });
    closeAddLibraryUnitModal();
  }, [id, onAddUnitFromLibrary, closeAddLibraryUnitModal]);

  const VideoSelectorPage = isVideoSelectorModalOpen ? getVideoSelectorPage() : null;
  const EditorPage = isXBlockEditorModalOpen ? getEditorPage() : null;

  return (
    <>
      <SortableItem
        id={id}
        data={{
          category,
          displayName,
          childAddable: actions.childAddable,
          status: subsectionStatus,
        }}
        key={id}
        isDraggable={isDraggable}
        isDroppable={actions.childAddable || section.actions.childAddable}
        componentStyle={{
          padding: '.9rem 1rem',
          borderRadius: '1rem',
          border: '1px solid #ECEEF3',
          background: '#FAFAF7',
          ...borderStyle,
        }}
      >
        <div
          className={`subsection-card ${isScrolledToElement ? 'highlight' : ''}`}
          data-testid="subsection-card"
          ref={currentRef}
        >
          {isHeaderVisible && (
            <>
              <CardHeader
                title={displayName}
                status={subsectionStatus}
                cardId={id}
                hasChanges={hasChanges}
                onClickMenuButton={handleClickMenuButton}
                onClickPublish={onOpenPublishModal}
                onClickEdit={openForm}
                onClickDelete={onOpenDeleteModal}
                onClickUnlink={onOpenUnlinkModal}
                onClickMoveUp={handleSubsectionMoveUp}
                onClickMoveDown={handleSubsectionMoveDown}
                onClickConfigure={onOpenConfigureModal}
                onClickSync={openSyncModal}
                isFormOpen={isFormOpen}
                closeForm={closeForm}
                onEditSubmit={handleEditSubmit}
                savingStatus={savingStatus}
                onClickDuplicate={onDuplicateSubmit}
                titleComponent={titleComponent}
                namePrefix={namePrefix}
                actions={actions}
                proctoringExamConfigurationLink={proctoringExamConfigurationLink}
                isSequential
                extraActionsComponent={extraActionsComponent}
                readyToSync={upstreamInfo?.readyToSync}
              />
              <div className="subsection-card__content item-children" data-testid="subsection-card__content">
                <XBlockStatus
                  isSelfPaced={isSelfPaced}
                  isCustomRelativeDatesActive={isCustomRelativeDatesActive}
                  blockData={subsection}
                />
              </div>
            </>
          )}
          {(isExpanded) && (
            <div
              data-testid="subsection-card__units"
              className={classNames('subsection-card__units', { 'item-children': isDraggable })}
            >
              {children}
              {actions.childAddable && (
                <>
                  <OutlineAddChildButtons
                    handleNewButtonClick={handleNewButtonClick}
                    handleUseFromLibraryClick={openAddLibraryUnitModal}
                    childType={ContainerType.Unit}
                  />
                  {enableCopyPasteUnits && showPasteUnit && sharedClipboardData && (
                    <PasteComponent
                      text={intl.formatMessage(messages.pasteButton)}
                      clipboardData={sharedClipboardData}
                      onClick={handlePasteButtonClick}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </SortableItem>
      <StandardModal
        title={intl.formatMessage(messages.unitPickerModalTitle)}
        isOpen={isAddLibraryUnitModalOpen}
        onClose={closeAddLibraryUnitModal}
        isOverflowVisible={false}
        size="xl"
      >
        <ComponentPicker
          showOnlyPublished
          extraFilter={['block_type = "unit"']}
          componentPickerMode="single"
          onComponentSelected={handleSelectLibraryUnit}
          visibleTabs={[ContentType.units]}
        />
      </StandardModal>
      <StandardModal
        title={intl.formatMessage(messages.activityPickerTitle)}
        isOpen={isActivityPickerOpen}
        onClose={closeActivityPickerFlow}
        isOverflowVisible={false}
        size="lg"
      >
        <div className="ws-activity-picker">
          <p className="ws-activity-picker__intro">
            {intl.formatMessage(messages.activityPickerIntro)}
          </p>
          {activityPickerStep !== 'root' && (
            <Button
              variant="tertiary"
              className="ws-activity-picker__back"
              onClick={returnToActivityPickerRoot}
            >
              {intl.formatMessage(messages.activityBack)}
            </Button>
          )}
          {activityPickerStep === 'root' && renderActivityButtons(activityGroups)}
          {activityPickerStep === 'read' && renderActivityButtons(readChoices)}
          {activityPickerStep === 'exercise' && renderActivityButtons(exerciseChoices)}
          {activityPickerStep === 'other' && renderAdvancedActivityList()}
        </div>
        {activityPickerStep === 'other' && (
          <ActionRow className="ws-activity-picker__footer">
            <ActionRow.Spacer />
            <Button variant="tertiary" onClick={closeActivityPickerFlow}>
              {intl.formatMessage(addComponentMessages.modalContainerCancelBtnText)}
            </Button>
            <Button
              variant="primary"
              disabled={!selectedAdvancedActivity}
              onClick={() => selectedAdvancedActivity && handleCreateActivity(selectedAdvancedActivity.component)}
            >
              {intl.formatMessage(messages.activityPickerAddSelected)}
            </Button>
          </ActionRow>
        )}
      </StandardModal>
      <StandardModal
        title={intl.formatMessage(addComponentMessages.videoPickerModalTitle)}
        isOpen={isVideoSelectorModalOpen}
        onClose={closeVideoSelectorModal}
        isOverflowVisible={false}
        size="xl"
      >
        <div className="selector-page">
          {VideoSelectorPage && (
            <VideoSelectorPage
              blockId={editorBlockId}
              courseId={editorCourseId}
              studioEndpointUrl={getConfig().STUDIO_BASE_URL}
              lmsEndpointUrl={getConfig().LMS_BASE_URL}
              onCancel={closeVideoSelectorModal}
              returnFunction={/* istanbul ignore next */ () => refreshSectionAfterXBlockEdit}
            />
          )}
        </div>
      </StandardModal>
      {EditorPage && editorCourseId && editorBlockType && editorBlockId && (
        <div className="editor-page">
          <EditorPage
            courseId={editorCourseId}
            blockType={editorBlockType}
            blockId={editorBlockId}
            studioEndpointUrl={getConfig().STUDIO_BASE_URL}
            lmsEndpointUrl={getConfig().LMS_BASE_URL}
            onClose={refreshSectionAfterXBlockEdit}
            returnFunction={/* istanbul ignore next */ () => refreshSectionAfterXBlockEdit}
          />
        </div>
      )}
      {blockSyncData && (
        <PreviewLibraryXBlockChanges
          blockData={blockSyncData}
          isModalOpen={isSyncModalOpen}
          closeModal={closeSyncModal}
          postChange={handleOnPostChangeSync}
        />
      )}
    </>
  );
};

export default SubsectionCard;
