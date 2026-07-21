import { useSelector } from 'react-redux';
import { Icon, Stack, useToggle } from '@openedx/paragon';
import { InfoOutline as InfoOutlineIcon, Person } from '@openedx/paragon/icons';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import ModalNotification from '@src/generic/modal-notification';
import { useIframe } from '@src/generic/hooks/context/hooks';
import { getCourseUnitData } from '@src/course-unit/data/selectors';
import { messageTypes, PUBLISH_TYPES } from '@src/course-unit/constants';
import { SidebarFooter } from '@src/course-unit/legacy-sidebar/components';
import useCourseUnitData from '@src/course-unit/legacy-sidebar/hooks';
import ReleaseInfoComponent from '@src/course-unit/legacy-sidebar/components/ReleaseInfoComponent';
import { useConfigureUnitWithPageUpdates } from '@src/course-unit/data/apiHooks';
import messages from './messages';

interface PublishControlsProps {
  blockId: string;
  hideCopyButton?: boolean;
  compact?: boolean;
}

const PublishControls = ({
  blockId,
  hideCopyButton = false,
  compact = false,
}: PublishControlsProps) => {
  const unitData = useSelector(getCourseUnitData);
  const {
    locationId,
    releaseLabel,
    publishCardClass,
  } = useCourseUnitData(unitData);
  const intl = useIntl();
  const { sendMessageToIframe } = useIframe();

  const [isDiscardModalOpen, openDiscardModal, closeDiscardModal] = useToggle(false);

  const {
    editedOn,
    editedBy,
    publishedBy,
    publishedOn,
  } = unitData;

  const publishMutation = useConfigureUnitWithPageUpdates();

  const handleCourseUnitDiscardChanges = () => {
    closeDiscardModal();
    publishMutation.mutate(
      {
        unitId: blockId,
        type: PUBLISH_TYPES.discardChanges,
        isVisibleToStaffOnly: false,
        groupAccess: null,
      },
      {
        onSuccess: () => sendMessageToIframe(messageTypes.refreshXBlock, null),
      },
    );
  };

  const handleCourseUnitPublish = () => {
    publishMutation.mutate({
      unitId: blockId,
      type: PUBLISH_TYPES.makePublic,
      isVisibleToStaffOnly: false,
      groupAccess: null,
    });
  };

  const discardChangesModal = (
    <ModalNotification
      title={intl.formatMessage(messages.modalDiscardUnitChangesTitle)}
      isOpen={isDiscardModalOpen}
      actionButtonText={intl.formatMessage(messages.modalDiscardUnitChangesActionButtonText)}
      cancelButtonText={intl.formatMessage(messages.modalDiscardUnitChangesCancelButtonText)}
      handleAction={handleCourseUnitDiscardChanges}
      handleCancel={closeDiscardModal}
      message={intl.formatMessage(messages.modalDiscardUnitChangesDescription)}
      icon={InfoOutlineIcon}
    />
  );

  if (compact) {
    return (
      <div className="ws-unit-info-sidebar__publish-actions">
        <SidebarFooter
          locationId={locationId}
          openDiscardModal={openDiscardModal}
          handlePublishing={handleCourseUnitPublish}
          hideCopyButton={hideCopyButton}
        />
        {discardChangesModal}
      </div>
    );
  }

  return (
    <div className={`course-unit-publish-controls border p-3 ${publishCardClass}`}>
      <Stack gap={4}>
        <Stack gap={2}>
          {editedOn && (
            <div>
              <span className="heading-label">
                <FormattedMessage {...messages.publishInfoDraftSaved} />
              </span>
              <Stack direction="horizontal" gap={1} className="text-primary-700">
                {editedBy && (
                  <>
                    <Icon src={Person} />
                    <span>
                      {editedBy}
                    </span>
                    <span>
                      -
                    </span>
                  </>
                )}
                <span>
                  {editedOn}
                </span>
              </Stack>
            </div>
          )}
          {publishedOn && (
            <div>
              <span className="heading-label">
                <FormattedMessage {...messages.publishLastPublished} />
              </span>
              <Stack direction="horizontal" gap={1} className="text-primary-700">
                {publishedBy && (
                  <>
                    <Icon src={Person} />
                    <span>
                      {publishedBy}
                    </span>
                    <span>
                      -
                    </span>
                  </>
                )}
                <span>
                  {publishedOn}
                </span>
              </Stack>
            </div>
          )}
        </Stack>
        <Stack>
          <span className="heading-label">
            {releaseLabel}
          </span>
          <div className="text-primary-700">
            <ReleaseInfoComponent />
          </div>
        </Stack>
      </Stack>
      <SidebarFooter
        locationId={locationId}
        openDiscardModal={openDiscardModal}
        handlePublishing={handleCourseUnitPublish}
        hideCopyButton={hideCopyButton}
      />
      {discardChangesModal}
    </div>
  );
};

export default PublishControls;
