import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';
import type { IntlShape } from 'react-intl';
import {
  Button,
  Icon,
  useToggle,
} from '@openedx/paragon';
import {
  AccessTimeFilled,
  Person,
} from '@openedx/paragon/icons';
import { getItemIcon } from '@src/generic/block-type-utils';
import { InfoSidebarMenu } from '@src/generic/sidebar/InfoSidebarMenu';
import { useIframe } from '@src/generic/hooks/context/hooks';
import { getLibraryId } from '@src/generic/key-utils';
import { useClipboard } from '@src/generic/clipboard';
import { ToastContext } from '@src/generic/toast-context';
import { UnlinkModal, useUnlinkDownstream } from '@src/generic/unlink-modal';
import { useCourseAuthoringContext } from '@src/CourseAuthoringContext';
import {
  useCourseItemData,
  useDeleteCourseItem,
} from '@src/course-outline/data/apiHooks';
import { useConfigureUnitWithPageUpdates } from '@src/course-unit/data/apiHooks';
import DeleteModal from '@src/generic/delete-modal/DeleteModal';
import { getCourseUnitData } from '@src/course-unit/data/selectors';
import { messageTypes, UNIT_VISIBILITY_STATES } from '@src/course-unit/constants';
import { fetchCourseSectionVerticalData } from '@src/course-unit/data/thunk';
import { extractCourseUnitId } from '@src/course-unit/legacy-sidebar/utils';
import { GenericUnitInfoSettings } from './GenericUnitInfoSettings';
import PublishControls from './PublishControls';
import messages from './messages';

/**
 * Component with forms to edit unit settings.
 */
export const UnitInfoSettings = () => {
  const { sendMessageToIframe } = useIframe();
  const {
    id,
    visibilityState,
    discussionEnabled,
    userPartitionInfo,
  } = useSelector(getCourseUnitData);

  const updateCallback = () => {
    sendMessageToIframe(messageTypes.refreshXBlock, null);
  };

  return (
    <GenericUnitInfoSettings
      id={id}
      visibilityState={visibilityState}
      discussionEnabled={discussionEnabled}
      userPartitionInfo={userPartitionInfo}
      updateCallback={updateCallback}
      configureHook={useConfigureUnitWithPageUpdates}
    />
  );
};

type UnitStateData = {
  currentlyVisibleToStudents?: boolean;
  hasChanges?: boolean;
  published?: boolean;
  visibilityState?: string;
};

const getUnitState = (unit: UnitStateData, intl: IntlShape) => {
  if (unit.visibilityState === UNIT_VISIBILITY_STATES.staffOnly) {
    return {
      key: 'staff',
      label: intl.formatMessage(messages.compactStateStaffLabel),
      title: intl.formatMessage(messages.compactStateStaffTitle),
      description: intl.formatMessage(messages.compactStateStaffDescription),
    };
  }

  if (unit.published && unit.hasChanges) {
    return {
      key: 'draft',
      label: intl.formatMessage(messages.compactStateDraftLabel),
      title: intl.formatMessage(messages.compactStateChangesTitle),
      description: intl.formatMessage(messages.compactStateChangesDescription),
    };
  }

  if (unit.currentlyVisibleToStudents) {
    return {
      key: 'live',
      label: intl.formatMessage(messages.compactStateLiveLabel),
      title: intl.formatMessage(messages.compactStateLiveTitle),
      description: intl.formatMessage(messages.compactStateLiveDescription),
    };
  }

  if (unit.published) {
    return {
      key: 'scheduled',
      label: intl.formatMessage(messages.compactStateScheduledLabel),
      title: intl.formatMessage(messages.compactStateScheduledTitle),
      description: intl.formatMessage(messages.compactStateScheduledDescription),
    };
  }

  return {
    key: 'draft',
    label: intl.formatMessage(messages.compactStateDraftLabel),
    title: intl.formatMessage(messages.compactStateDraftTitle),
    description: intl.formatMessage(messages.compactStateDraftDescription),
  };
};

/**
 * Compact, information-first sidebar for the course unit page.
 */
export const UnitInfoSidebar = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { blockId } = useParams();
  const { copyToClipboard } = useClipboard();
  const currentItemData = useSelector(getCourseUnitData);
  const { showToast } = useContext(ToastContext);
  const { courseId } = useCourseAuthoringContext();

  const [isEditingSettings, openEditingSettings, closeEditingSettings] = useToggle(false);
  const [isUnlinkModalOpen, openUnlinkModal, closeUnlinkModal] = useToggle(false);
  const [isDeleteModalOpen, openDeleteModal, closeDeleteModal] = useToggle(false);
  const { mutateAsync: unlinkDownstream } = useUnlinkDownstream();
  const { mutateAsync: deleteCourseItem } = useDeleteCourseItem();

  const subsectionId = currentItemData?.ancestorInfo?.ancestors?.[0]?.id;
  const sectionId = currentItemData?.ancestorInfo?.ancestors?.[1]?.id;
  const { data: subsection } = useCourseItemData(subsectionId);
  const actions = { ...(currentItemData.actions ?? {}) };
  actions.deletable = actions.deletable && !subsection?.upstreamInfo?.upstreamRef;
  actions.duplicable = actions.duplicable && !subsection?.upstreamInfo?.upstreamRef;

  const state = getUnitState(currentItemData, intl);
  const selectedGroupsLabel = currentItemData.userPartitionInfo?.selectedGroupsLabel;
  const visibleToStaffOnly = currentItemData.visibilityState === UNIT_VISIBILITY_STATES.staffOnly;
  const visibilityLabel = visibleToStaffOnly
    ? intl.formatMessage(messages.compactAccessStaffOnly)
    : intl.formatMessage(messages.compactAccessAllLearners);
  const groupLabel = selectedGroupsLabel || intl.formatMessage(messages.compactAccessNoGroup);
  const discussionLabel = currentItemData.discussionEnabled
    ? intl.formatMessage(messages.compactDiscussionEnabled)
    : intl.formatMessage(messages.compactDiscussionDisabled);
  const publicationLabel = currentItemData.publishedOn
    ? intl.formatMessage(messages.publishLastPublished)
    : intl.formatMessage(messages.compactPublicationPlanned);
  const publicationValue = currentItemData.publishedOn
    || currentItemData.releaseDate
    || intl.formatMessage(messages.compactPublicationUnscheduled);

  const handleDeleteSubmit = async () => {
    await deleteCourseItem({
      itemId: currentItemData.id,
      subsectionId,
      sectionId,
    }, {
      onSuccess: () => {
        closeDeleteModal();
        navigate(`/course/${courseId}`);
      },
    });
  };

  const handleUnlinkSubmit = async () => {
    await unlinkDownstream({
      downstreamBlockId: currentItemData.id,
      subsectionId,
      sectionId,
    }, {
      onSuccess: () => {
        closeUnlinkModal();
        dispatch(fetchCourseSectionVerticalData(currentItemData.id, subsectionId));
      },
    });
  };

  const handleCopyLocation = () => {
    const locationId = extractCourseUnitId(currentItemData.id);
    if (!locationId) {
      return;
    }

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(locationId);
    } /* istanbul ignore next */ else {
      const textarea = document.createElement('textarea');
      textarea.value = locationId;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy'); // eslint-disable-line deprecation/deprecation
      document.body.removeChild(textarea);
    }
    showToast(intl.formatMessage(messages.locationCopiedText));
  };

  if (blockId === undefined) {
    // istanbul ignore next - This shouldn't be possible; it's just here to satisfy the type checker.
    throw new Error('Error: route is missing blockId.');
  }

  return (
    <div className="ws-unit-info-sidebar__inner">
      <header className="ws-unit-info-sidebar__header">
        <p className="ws-unit-info-sidebar__eyebrow">
          {intl.formatMessage(messages.compactSidebarEyebrow)}
        </p>
        <div className="ws-unit-info-sidebar__title-row">
          <div className="ws-unit-info-sidebar__title">
            <Icon src={getItemIcon('unit')} aria-hidden />
            <h2>{currentItemData.displayName}</h2>
          </div>
          <div className="ws-unit-info-sidebar__title-actions">
            <span className={`ws-unit-info-sidebar__badge is-${state.key}`}>{state.label}</span>
            <InfoSidebarMenu
              itemId={currentItemData.id}
              index={-1}
              actions={actions}
              onClickUnlink={openUnlinkModal}
              onClickDelete={openDeleteModal}
              onClickViewLibrary={() => {
                const upstreamRef = currentItemData?.upstreamInfo?.upstreamRef;
                if (upstreamRef) {
                  const libId = getLibraryId(upstreamRef);
                  navigate(`/library/${libId}/unit/${upstreamRef}`);
                }
              }}
              onClickCopy={() => copyToClipboard(currentItemData.id)}
              onClickCopyLocation={handleCopyLocation}
            />
          </div>
        </div>
      </header>

      <div className="ws-unit-info-sidebar__body">
        <section className="ws-unit-info-sidebar__section">
          <h3>{intl.formatMessage(messages.compactStateSectionTitle)}</h3>
          <div className="ws-unit-info-sidebar__state">
            <span className={`ws-unit-info-sidebar__state-dot is-${state.key}`} aria-hidden />
            <div>
              <strong>{state.title}</strong>
              <p>{state.description}</p>
            </div>
          </div>
        </section>

        <section className="ws-unit-info-sidebar__section">
          <h3>{intl.formatMessage(messages.compactActivitySectionTitle)}</h3>
          {currentItemData.editedOn && (
            <div className="ws-unit-info-sidebar__activity-row">
              <Icon src={Person} aria-hidden />
              <div>
                <span>{intl.formatMessage(messages.compactLastModified)}</span>
                <strong>
                  {currentItemData.editedBy ? `${currentItemData.editedBy} · ` : ''}
                  {currentItemData.editedOn}
                </strong>
              </div>
            </div>
          )}
          <div className="ws-unit-info-sidebar__activity-row">
            <Icon src={AccessTimeFilled} aria-hidden />
            <div>
              <span>{publicationLabel}</span>
              <strong>{publicationValue}</strong>
            </div>
          </div>
          <PublishControls blockId={blockId} hideCopyButton compact />
        </section>

        <section className="ws-unit-info-sidebar__section">
          <div className="ws-unit-info-sidebar__section-heading">
            <h3>{intl.formatMessage(messages.compactAccessSectionTitle)}</h3>
            {!isEditingSettings && (
              <Button variant="tertiary" size="sm" onClick={openEditingSettings}>
                {intl.formatMessage(messages.compactEditAction)}
              </Button>
            )}
          </div>
          {isEditingSettings ? (
            <div className="ws-unit-info-sidebar__settings">
              <UnitInfoSettings />
              <Button variant="outline-primary" size="sm" onClick={closeEditingSettings}>
                {intl.formatMessage(messages.compactDoneAction)}
              </Button>
            </div>
          ) : (
            <div className="ws-unit-info-sidebar__access-list">
              <div>
                <span>{intl.formatMessage(messages.sidebarInfoVisibilityTitle)}</span>
                <strong>{visibilityLabel}</strong>
              </div>
              <div>
                <span>{intl.formatMessage(messages.compactGroupRestrictionLabel)}</span>
                <strong>{groupLabel}</strong>
              </div>
              <div>
                <span>{intl.formatMessage(messages.compactDiscussionsLabel)}</span>
                <strong>{discussionLabel}</strong>
              </div>
            </div>
          )}
        </section>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        close={closeDeleteModal}
        onDeleteSubmit={handleDeleteSubmit}
        category="unit"
      />
      <UnlinkModal
        isOpen={isUnlinkModalOpen}
        close={closeUnlinkModal}
        onUnlinkSubmit={handleUnlinkSubmit}
        displayName={currentItemData.displayName}
        category="vertical"
      />
    </div>
  );
};
