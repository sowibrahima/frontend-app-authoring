import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { useIntl, FormattedMessage } from '@edx/frontend-platform/i18n';
import {
  ActionRow, Button, Icon, StandardModal, useToggle,
} from '@openedx/paragon';
import { ArrowRight } from '@openedx/paragon/icons';

import { useWaffleFlags } from '@src/data/apiHooks';
import { COMPONENT_TYPE_ICON_MAP, COMPONENT_TYPES } from '@src/generic/block-type-utils/constants';
import { ComponentPicker } from '@src/library-authoring/component-picker';
import { ContentType } from '@src/library-authoring/routes';
import { useIframe } from '@src/generic/hooks/context/hooks';
import { useEventListener } from '@src/generic/hooks';
import VideoSelectorPage from '@src/editors/VideoSelectorPage';
import EditorPage from '@src/editors/EditorPage';
import { SelectedComponent } from '@src/library-authoring';
import { fetchCourseSectionVerticalData } from '../data/thunk';
import { messageTypes } from '../constants';
import messages from './messages';
import AddComponentButton from './add-component-btn';
import ComponentModalView from './add-component-modals/ComponentModalView';
import { getCourseSectionVertical, getCourseUnitData } from '../data/selectors';
import { getLiveSessionsCapability } from './liveSessionsApi';

type ComponentTemplateData = {
  displayName: string,
  category?: string,
  type: string,
  beta?: boolean,
  templates: Array<{
    boilerplateName?: string,
    category?: string,
    displayName: string,
    supportLevel?: string | boolean,
  }>,
  supportLegend: {
    allowUnsupportedXblocks?: boolean,
    documentationLabel?: string,
    showLegend?: boolean,
  },
};

const LIVE_SESSION_XBLOCK_TYPE = 'live_session';

export interface AddComponentProps {
  isSplitTestType?: boolean,
  isUnitVerticalType?: boolean,
  isEmptyUnit?: boolean,
  parentLocator: string,
  handleCreateNewCourseXBlock: (
    args: object,
    callback?: (args: { courseKey: string, locator: string }) => void
  ) => void,
  isProblemBankType?: boolean,
  addComponentTemplateData?: {
    blockId: string,
    parentLocator?: string,
    model: ComponentTemplateData,
  },
}

const AddComponent = ({
  parentLocator,
  isSplitTestType,
  isUnitVerticalType,
  isEmptyUnit,
  isProblemBankType,
  addComponentTemplateData,
  handleCreateNewCourseXBlock,
}: AddComponentProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const [isOpenAdvanced, openAdvanced, closeAdvanced] = useToggle(false);
  const [isOpenHtml, openHtml, closeHtml] = useToggle(false);
  const [isOpenOpenAssessment, openOpenAssessment, closeOpenAssessment] = useToggle(false);
  const { componentTemplates = {} } = useSelector(getCourseSectionVertical);
  const componentTemplateList = Array.isArray(componentTemplates) ? componentTemplates : [];
  const isLiveSessionComponentAvailable = componentTemplateList.some(
    (component: ComponentTemplateData) => (
      component.type === COMPONENT_TYPES.advanced
      && component.templates.some(template => template.category === LIVE_SESSION_XBLOCK_TYPE)
    ),
  );
  const [isLiveSessionOrgEnabled, setIsLiveSessionOrgEnabled] = useState(false);
  const [isLiveSessionAvailabilityLoaded, setIsLiveSessionAvailabilityLoaded] = useState(false);
  const isLiveSessionAvailable = isLiveSessionComponentAvailable && isLiveSessionOrgEnabled;
  const { courseId: routeCourseId } = useParams();
  const blockId = addComponentTemplateData?.parentLocator || parentLocator;
  const [isAddLibraryContentModalOpen, showAddLibraryContentModal, closeAddLibraryContentModal] = useToggle();
  const [isVideoSelectorModalOpen, showVideoSelectorModal, closeVideoSelectorModal] = useToggle();
  const [isXBlockEditorModalOpen, showXBlockEditorModal, closeXBlockEditorModal] = useToggle();
  const [isActivityPickerOpen, openActivityPicker, closeActivityPicker] = useToggle(false);
  const [activityPickerStep, setActivityPickerStep] = useState<'root' | 'read' | 'exercise' | 'other'>('root');

  const [blockType, setBlockType] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [newBlockId, setNewBlockId] = useState<string | null>(null);
  const [isSelectLibraryContentModalOpen, showSelectLibraryContentModal, closeSelectLibraryContentModal] = useToggle();
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [usageId, setUsageId] = useState(null);
  const { sendMessageToIframe } = useIframe();
  const { useVideoGalleryFlow, useNewPdfEditor } = useWaffleFlags(courseId ?? undefined);

  const courseUnit = useSelector(getCourseUnitData);
  const sequenceId = courseUnit?.ancestorInfo?.ancestors?.[0]?.id;

  useEffect(() => {
    if (!routeCourseId || !isUnitVerticalType) {
      return undefined;
    }

    let isMounted = true;
    setIsLiveSessionAvailabilityLoaded(false);

    getLiveSessionsCapability(routeCourseId)
      .then((capability) => {
        if (isMounted) {
          setIsLiveSessionOrgEnabled(Boolean(capability.enabled));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLiveSessionOrgEnabled(false);
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
  }, [isUnitVerticalType, routeCourseId]);

  const receiveMessage = useCallback(({ data: { type, payload } }) => {
    if (type === messageTypes.showMultipleComponentPicker) {
      showSelectLibraryContentModal();
    }
    if (type === messageTypes.showSingleComponentPicker) {
      setUsageId(payload.usageId);
      showAddLibraryContentModal();
    }
  }, [showSelectLibraryContentModal, showAddLibraryContentModal, setUsageId]);

  useEventListener('message', receiveMessage);

  const onComponentSelectionSubmit = useCallback(() => {
    sendMessageToIframe(messageTypes.addSelectedComponentsToBank, { selectedComponents });
    closeSelectLibraryContentModal();
  }, [selectedComponents]);

  const onXBlockSave = useCallback(/* istanbul ignore next */ () => {
    closeXBlockEditorModal();
    closeVideoSelectorModal();
    sendMessageToIframe(messageTypes.refreshXBlock, null);
    dispatch(fetchCourseSectionVerticalData(blockId, sequenceId));
  }, [closeXBlockEditorModal, closeVideoSelectorModal, sendMessageToIframe]);

  const onXBlockCancel = useCallback(/* istanbul ignore next */ () => {
    // ignoring tests because it triggers when someone closes the editor which has a separate store
    closeXBlockEditorModal();
    closeVideoSelectorModal();
    dispatch(fetchCourseSectionVerticalData(blockId, sequenceId));
  }, [closeXBlockEditorModal, closeVideoSelectorModal, sendMessageToIframe, blockId, sequenceId]);

  const handleLibraryV2Selection = useCallback((selection: SelectedComponent) => {
    handleCreateNewCourseXBlock({
      type: COMPONENT_TYPES.libraryV2,
      category: selection.blockType,
      parentLocator: usageId || blockId,
      libraryContentKey: selection.usageKey,
    });
    closeAddLibraryContentModal();
  }, [usageId]);

  const handleCreateNewXBlock = (type: string, moduleName?: string) => {
    switch (type) {
      case COMPONENT_TYPES.discussion:
      case COMPONENT_TYPES.dragAndDrop:
        handleCreateNewCourseXBlock({ type, parentLocator: blockId });
        break;
      case COMPONENT_TYPES.problem:
        handleCreateNewCourseXBlock({ type, parentLocator: blockId }, ({ courseKey, locator }) => {
          setCourseId(courseKey);
          setBlockType(type);
          setNewBlockId(locator);
          showXBlockEditorModal();
        });
        break;
      case COMPONENT_TYPES.video:
        handleCreateNewCourseXBlock(
          { type, parentLocator: blockId },
          /* istanbul ignore next */ ({ courseKey, locator }) => {
            setCourseId(courseKey);
            setBlockType(type);
            setNewBlockId(locator);
            if (useVideoGalleryFlow) {
              showVideoSelectorModal();
            } else {
              showXBlockEditorModal();
            }
          },
        );
        break;
        // TODO: The library functional will be a bit different of current legacy (CMS)
        //  behaviour and this ticket is on hold (blocked by other development team).
      case COMPONENT_TYPES.library:
        handleCreateNewCourseXBlock({ type, category: 'library_content', parentLocator: blockId });
        break;
      case COMPONENT_TYPES.itembank:
        handleCreateNewCourseXBlock({ type, category: 'itembank', parentLocator: blockId });
        break;
      case COMPONENT_TYPES.libraryV2:
        showAddLibraryContentModal();
        break;
      case COMPONENT_TYPES.advanced:
        if (moduleName === COMPONENT_TYPES.pdf && useNewPdfEditor) {
          handleCreateNewCourseXBlock(
            { type: moduleName, parentLocator: blockId },
            /* istanbul ignore next */
            ({ courseKey, locator }) => {
              setCourseId(courseKey);
              setBlockType(moduleName);
              setNewBlockId(locator);
              showXBlockEditorModal();
            },
          );
        } else {
          handleCreateNewCourseXBlock({ type: moduleName, category: moduleName, parentLocator: blockId });
        }
        break;
      case COMPONENT_TYPES.openassessment:
        handleCreateNewCourseXBlock({ boilerplate: moduleName, category: type, parentLocator: blockId });
        break;
      case COMPONENT_TYPES.html:
        handleCreateNewCourseXBlock({
          type,
          boilerplate: moduleName,
          parentLocator: blockId,
        }, /* istanbul ignore next */ ({ courseKey, locator }) => {
          setCourseId(courseKey);
          setBlockType(type);
          setNewBlockId(locator);
          showXBlockEditorModal();
        });
        break;
      default:
    }
  };

  const closeActivityPickerFlow = () => {
    setActivityPickerStep('root');
    closeActivityPicker();
  };

  const createActivity = (type: string, moduleName?: string) => {
    handleCreateNewXBlock(type, moduleName);
    closeActivityPickerFlow();
  };

  const liveSessionDescriptionMessage = () => {
    if (!isLiveSessionAvailabilityLoaded) {
      return messages.lessonBuilderLiveCheckingDescription;
    }

    if (isLiveSessionAvailable) {
      return messages.lessonBuilderLiveDescription;
    }

    return messages.lessonBuilderLiveUnavailableDescription;
  };

  const activityGroups = [
    {
      key: 'read',
      title: intl.formatMessage(messages.lessonBuilderReadTitle),
      description: intl.formatMessage(messages.lessonBuilderReadDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.html],
      onClick: () => setActivityPickerStep('read'),
    },
    {
      key: 'watch',
      title: intl.formatMessage(messages.lessonBuilderWatchTitle),
      description: intl.formatMessage(messages.lessonBuilderWatchDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.video],
      onClick: () => createActivity(COMPONENT_TYPES.video),
    },
    {
      key: 'listen',
      title: intl.formatMessage(messages.lessonBuilderListenTitle),
      description: intl.formatMessage(messages.lessonBuilderListenDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.video],
      disabled: true,
    },
    {
      key: 'exercise',
      title: intl.formatMessage(messages.lessonBuilderExerciseTitle),
      description: intl.formatMessage(messages.lessonBuilderExerciseDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.problem],
      onClick: () => setActivityPickerStep('exercise'),
    },
    {
      key: 'live',
      title: intl.formatMessage(messages.lessonBuilderLiveTitle),
      description: intl.formatMessage(liveSessionDescriptionMessage()),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.video],
      onClick: () => createActivity(COMPONENT_TYPES.advanced, LIVE_SESSION_XBLOCK_TYPE),
      disabled: !isLiveSessionAvailable,
    },
    {
      key: 'other',
      title: intl.formatMessage(messages.lessonBuilderOtherTitle),
      description: intl.formatMessage(messages.lessonBuilderOtherDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.advanced],
      onClick: () => setActivityPickerStep('other'),
    },
  ];

  const readChoices = [
    {
      key: 'html',
      title: intl.formatMessage(messages.lessonBuilderHtmlTitle),
      description: intl.formatMessage(messages.lessonBuilderHtmlDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.html],
      onClick: () => createActivity(COMPONENT_TYPES.html, COMPONENT_TYPES.html),
    },
    {
      key: 'pdf',
      title: intl.formatMessage(messages.lessonBuilderPdfTitle),
      description: intl.formatMessage(messages.lessonBuilderPdfDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.html],
      onClick: () => createActivity(COMPONENT_TYPES.advanced, COMPONENT_TYPES.pdf),
    },
  ];

  const exerciseChoices = [
    {
      key: 'quiz',
      title: intl.formatMessage(messages.lessonBuilderQuizTitle),
      description: intl.formatMessage(messages.lessonBuilderQuizDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.problem],
      onClick: () => createActivity(COMPONENT_TYPES.problem),
    },
    {
      key: 'drag-drop',
      title: intl.formatMessage(messages.lessonBuilderDragDropTitle),
      description: intl.formatMessage(messages.lessonBuilderDragDropDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.dragAndDrop],
      onClick: () => createActivity(COMPONENT_TYPES.dragAndDrop),
    },
    {
      key: 'open-response',
      title: intl.formatMessage(messages.lessonBuilderOpenResponseTitle),
      description: intl.formatMessage(messages.lessonBuilderOpenResponseDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.openassessment],
      onClick: () => createActivity(COMPONENT_TYPES.openassessment, 'peer-assessment'),
    },
    {
      key: 'collect',
      title: intl.formatMessage(messages.lessonBuilderCollectTitle),
      description: intl.formatMessage(messages.lessonBuilderCollectDescription),
      icon: COMPONENT_TYPE_ICON_MAP[COMPONENT_TYPES.openassessment],
      onClick: () => createActivity(COMPONENT_TYPES.openassessment, 'staff-assessment'),
    },
  ];

  const renderActivityCards = (items) => (
    <div className="ws-lesson-builder__grid">
      {items.map((action) => (
        <button
          key={action.key}
          type="button"
          className="ws-lesson-builder__card"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          <span className="ws-lesson-builder__card-icon" aria-hidden="true">
            <Icon src={action.icon} />
          </span>
          <span className="ws-lesson-builder__card-title">{action.title}</span>
          <span className="ws-lesson-builder__card-description">{action.description}</span>
          {!action.disabled && (
            <span className="ws-lesson-builder__card-link">
              {intl.formatMessage(messages.lessonBuilderCreateAction)}
              <Icon src={ArrowRight} />
            </span>
          )}
        </button>
      ))}
    </div>
  );

  const renderLegacyComponents = () => (
    <ul className="new-component-type list-unstyled m-0 d-flex flex-wrap justify-content-center">
      {componentTemplateList.map((component: ComponentTemplateData) => {
        const { type, displayName, beta } = component;
        let modalParams: { open: () => void, close: () => void, isOpen: boolean };

        if (!component.templates.length) {
          return null;
        }

        switch (type) {
          case COMPONENT_TYPES.advanced:
            modalParams = {
              open: openAdvanced,
              close: closeAdvanced,
              isOpen: isOpenAdvanced,
            };
            break;
          case COMPONENT_TYPES.html:
            modalParams = {
              open: openHtml,
              close: closeHtml,
              isOpen: isOpenHtml,
            };
            break;
          case COMPONENT_TYPES.openassessment:
            modalParams = {
              open: openOpenAssessment,
              close: closeOpenAssessment,
              isOpen: isOpenOpenAssessment,
            };
            break;
          default:
            return (
              <li key={type}>
                <AddComponentButton
                  onClick={() => createActivity(type)}
                  displayName={displayName}
                  type={type}
                  beta={beta}
                />
              </li>
            );
        }

        return (
          <ComponentModalView
            key={type}
            component={component}
            handleCreateNewXBlock={handleCreateNewXBlock}
            modalParams={modalParams}
          />
        );
      })}
    </ul>
  );

  if (isUnitVerticalType || isSplitTestType || isProblemBankType) {
    return (
      <div className="py-4">
        {componentTemplateList.length && isUnitVerticalType ? (
          <>
            {isEmptyUnit && (
              <section className="ws-lesson-builder">
                <div className="ws-lesson-builder__header">
                  <p className="ws-lesson-builder__eyebrow">
                    {intl.formatMessage(messages.lessonBuilderEyebrow)}
                  </p>
                  <h5 className="ws-lesson-builder__title">
                    {intl.formatMessage(messages.lessonBuilderTitle)}
                  </h5>
                  <p className="ws-lesson-builder__description">
                    {intl.formatMessage(messages.lessonBuilderDescription)}
                  </p>
                </div>

                {activityPickerStep !== 'root' && (
                  <Button
                    variant="tertiary"
                    className="ws-activity-picker__back mb-3"
                    onClick={() => setActivityPickerStep('root')}
                  >
                    {intl.formatMessage(messages.activityBack)}
                  </Button>
                )}
                {activityPickerStep === 'root' && renderActivityCards(activityGroups)}
                {activityPickerStep === 'read' && renderActivityCards(readChoices)}
                {activityPickerStep === 'exercise' && renderActivityCards(exerciseChoices)}
                {activityPickerStep === 'other' && renderLegacyComponents()}
              </section>
            )}
            {!isEmptyUnit && (
              <div className="ws-add-activity-compact">
                <Button
                  variant="primary"
                  onClick={() => {
                    setActivityPickerStep('root');
                    openActivityPicker();
                  }}
                >
                  {intl.formatMessage(messages.title)}
                </Button>
              </div>
            )}
          </>
        ) : null}
        <StandardModal
          title={intl.formatMessage(messages.title)}
          isOpen={isActivityPickerOpen}
          onClose={closeActivityPickerFlow}
          isOverflowVisible={false}
          size="lg"
        >
          <div className="ws-activity-picker">
            {activityPickerStep !== 'root' && (
              <Button
                variant="tertiary"
                className="ws-activity-picker__back"
                onClick={() => setActivityPickerStep('root')}
              >
                {intl.formatMessage(messages.activityBack)}
              </Button>
            )}
            {activityPickerStep === 'root' && renderActivityCards(activityGroups)}
            {activityPickerStep === 'read' && renderActivityCards(readChoices)}
            {activityPickerStep === 'exercise' && renderActivityCards(exerciseChoices)}
            {activityPickerStep === 'other' && renderLegacyComponents()}
          </div>
        </StandardModal>
        <StandardModal
          title={
            isAddLibraryContentModalOpen
              ? intl.formatMessage(messages.singleComponentPickerModalTitle)
              : intl.formatMessage(messages.multipleComponentPickerModalTitle)
          }
          isOpen={isAddLibraryContentModalOpen || isSelectLibraryContentModalOpen}
          onClose={() => {
            closeAddLibraryContentModal();
            closeSelectLibraryContentModal();
          }}
          isOverflowVisible={false}
          size="xl"
          footerNode={
            isSelectLibraryContentModalOpen && (
              <ActionRow>
                <Button onClick={onComponentSelectionSubmit}>
                  <FormattedMessage {...messages.multipleComponentPickerModalBtn} />
                </Button>
              </ActionRow>
            )
          }
        >
          <ComponentPicker
            showOnlyPublished
            extraFilter={['NOT block_type = "unit"', 'NOT block_type = "section"', 'NOT block_type = "subsection"']}
            visibleTabs={[ContentType.home, ContentType.components, ContentType.collections]}
            componentPickerMode={isAddLibraryContentModalOpen ? 'single' : 'multiple'}
            onComponentSelected={handleLibraryV2Selection}
            onChangeComponentSelection={setSelectedComponents}
          />
        </StandardModal>
        <StandardModal
          title={intl.formatMessage(messages.videoPickerModalTitle)}
          isOpen={isVideoSelectorModalOpen}
          onClose={closeVideoSelectorModal}
          isOverflowVisible={false}
          size="xl"
        >
          <div className="selector-page">
            <VideoSelectorPage
              blockId={newBlockId}
              courseId={courseId}
              studioEndpointUrl={getConfig().STUDIO_BASE_URL}
              lmsEndpointUrl={getConfig().LMS_BASE_URL}
              onCancel={closeVideoSelectorModal}
              returnFunction={/* istanbul ignore next */ () => onXBlockSave}
            />
          </div>
        </StandardModal>
        {isXBlockEditorModalOpen && courseId && blockType && newBlockId && (
          <div className="editor-page">
            <EditorPage
              courseId={courseId}
              blockType={blockType}
              blockId={newBlockId}
              studioEndpointUrl={getConfig().STUDIO_BASE_URL}
              lmsEndpointUrl={getConfig().LMS_BASE_URL}
              onClose={onXBlockCancel}
              returnFunction={/* istanbul ignore next */ () => onXBlockSave}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AddComponent;
