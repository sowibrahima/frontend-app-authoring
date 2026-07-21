import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Container,
  Button,
  TransitionReplace,
} from '@openedx/paragon';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@openedx/paragon/icons';
import { useCourseAuthoringContext } from '@src/CourseAuthoringContext';
import { CourseAuthoringUnitSidebarSlot } from '../plugin-slots/CourseAuthoringUnitSidebarSlot';

import SubHeader from '../generic/sub-header/SubHeader';
import { RequestStatus } from '../data/constants';
import getPageHeadTitle from '../generic/utils';
import AlertMessage from '../generic/alert-message';
import { PasteComponent } from '../generic/clipboard';
import { SavingErrorAlert } from '../generic/saving-error-alert';
import ConnectionErrorAlert from '../generic/ConnectionErrorAlert';
import Loading from '../generic/Loading';
import AddComponent from './add-component/AddComponent';
import HeaderTitle from './header-title/HeaderTitle';
import Breadcrumbs from './breadcrumbs/Breadcrumbs';
import Sequence from './course-sequence';
import { useCourseUnit, useHandleCreateNewCourseXBlock, useScrollToLastPosition } from './hooks';
import messages from './messages';
import { PasteNotificationAlert } from './clipboard';
import XBlockContainerIframe from './xblock-container-iframe';
import MoveModal from './move-modal';
import IframePreviewLibraryXBlockChanges from './preview-changes';
import CourseUnitHeaderActionsSlot from '../plugin-slots/CourseUnitHeaderActionsSlot';
import { UnitSidebarProvider } from './unit-sidebar/UnitSidebarContext';
import { UnitSidebarPagesProvider } from './unit-sidebar/UnitSidebarPagesContext';
import { useHelpUrls } from '@src/help-urls/hooks';

const CourseUnit = () => {
  const intl = useIntl();
  const { blockId } = useParams();
  const { courseId } = useCourseAuthoringContext();
  const urls = useHelpUrls(['syncLibraryUpdates']);

  if (courseId === undefined) {
    // istanbul ignore next - This shouldn't be possible; it's just here to satisfy the type checker.
    throw new Error('Error: route is missing courseId.');
  }

  if (blockId === undefined) {
    // istanbul ignore next - This shouldn't be possible; it's just here to satisfy the type checker.
    throw new Error('Error: route is missing blockId.');
  }

  const {
    courseUnit,
    isLoading,
    sequenceId,
    unitTitle,
    unitCategory,
    errorMessage,
    sequenceStatus,
    savingStatus,
    isTitleEditFormOpen,
    isUnitVerticalType,
    isUnitLegacyLibraryType,
    isSplitTestType,
    isProblemBankType,
    staticFileNotices,
    currentlyVisibleToStudents,
    unitXBlockActions,
    sharedClipboardData,
    showPasteXBlock,
    showPasteUnit,
    handleTitleEditSubmit,
    headerNavigationsActions,
    handleTitleEdit,
    courseVerticalChildren,
    canPasteComponent,
    isMoveModalOpen,
    openMoveModal,
    closeMoveModal,
    movedXBlockParams,
    handleRollbackMovedXBlock,
    handleCloseXBlockMovedAlert,
    handleNavigateToTargetUnit,
    addComponentTemplateData,
  } = useCourseUnit({ courseId, blockId });

  const handleCreateNewCourseXBlock = useHandleCreateNewCourseXBlock({ blockId });

  const readOnly = !!courseUnit.readOnly;

  useEffect(() => {
    document.title = getPageHeadTitle('', unitTitle);
  }, [unitTitle]);

  useScrollToLastPosition();

  if (isLoading) {
    return <Loading />;
  }

  if (sequenceStatus === RequestStatus.FAILED) {
    return (
      <Container size="xl" className="course-unit px-4 mt-4">
        <ConnectionErrorAlert />
      </Container>
    );
  }

  return (
    <UnitSidebarProvider readOnly={readOnly}>
      <UnitSidebarPagesProvider>
        <Container fluid className="course-unit px-4">
          <section className="course-unit-container mb-4">
            <TransitionReplace>
              {movedXBlockParams.isSuccess ?
                (
                  <AlertMessage
                    key="xblock-moved-alert"
                    data-testid="xblock-moved-alert"
                    show={movedXBlockParams.isSuccess}
                    variant="success"
                    icon={CheckCircleIcon}
                    title={movedXBlockParams.isUndo
                      ? intl.formatMessage(messages.alertMoveCancelTitle)
                      : intl.formatMessage(messages.alertMoveSuccessTitle)}
                    description={movedXBlockParams.isUndo
                      ? intl.formatMessage(messages.alertMoveCancelDescription, { title: movedXBlockParams.title })
                      : intl.formatMessage(messages.alertMoveSuccessDescription, { title: movedXBlockParams.title })}
                    aria-hidden={movedXBlockParams.isSuccess}
                    dismissible
                    actions={movedXBlockParams.isUndo ? undefined : [
                      <Button
                        onClick={handleRollbackMovedXBlock}
                        key="xblock-moved-alert-undo-move-button"
                      >
                        {intl.formatMessage(messages.undoMoveButton)}
                      </Button>,
                      <Button
                        onClick={handleNavigateToTargetUnit}
                        key="xblock-moved-alert-new-location-button"
                      >
                        {intl.formatMessage(messages.newLocationButton)}
                      </Button>,
                    ]}
                    onClose={handleCloseXBlockMovedAlert}
                  />
                ) :
                null}
            </TransitionReplace>
            {courseUnit.upstreamInfo?.upstreamLink && (
              <AlertMessage
                description={intl.formatMessage(
                  messages.alertLibraryUnitReadOnlyText,
                  {
                    link: (
                      <Alert.Link href={courseUnit.upstreamInfo.upstreamLink}>
                        <FormattedMessage {...messages.alertLibraryUnitReadOnlyLinkText} />
                      </Alert.Link>
                    ),
                    learnMore: (
                      <Alert.Link href={urls['syncLibraryUpdates']}>
                        <FormattedMessage {...messages.alertLibraryUnitReadOnlyLearnMoreText} />
                      </Alert.Link>
                    ),
                  },
                )}
                variant="info"
              />
            )}
            <div className="course-unit-body d-flex align-items-start">
              <div className="course-unit-content flex-fill">
                <SubHeader
                  hideBorder
                  title={
                    <HeaderTitle
                      unitTitle={unitTitle}
                      isTitleEditFormOpen={isTitleEditFormOpen}
                      handleTitleEdit={handleTitleEdit}
                      handleTitleEditSubmit={handleTitleEditSubmit}
                    />
                  }
                  breadcrumbs={
                    <Breadcrumbs
                      courseId={courseId}
                      parentUnitId={sequenceId}
                    />
                  }
                  headerActions={
                    <CourseUnitHeaderActionsSlot
                      category={unitCategory}
                      headerNavigationsActions={headerNavigationsActions}
                      unitTitle={unitTitle}
                      verticalBlocks={courseVerticalChildren.children}
                      isPublished={courseUnit.published}
                    />
                  }
                />
                {isUnitVerticalType && (
                  <Sequence
                    courseId={courseId}
                    sequenceId={sequenceId}
                    unitId={blockId}
                    handleCreateNewCourseXBlock={handleCreateNewCourseXBlock}
                    showPasteUnit={showPasteUnit}
                  />
                )}
                {currentlyVisibleToStudents && (
                  <AlertMessage
                    className="course-unit__alert"
                    title={intl.formatMessage(messages.alertUnpublishedVersion)}
                    variant="warning"
                    icon={WarningIcon}
                  />
                )}
                {staticFileNotices && (
                  <PasteNotificationAlert
                    staticFileNotices={staticFileNotices}
                    courseId={courseId}
                  />
                )}
                {blockId && (
                  <XBlockContainerIframe
                    courseId={courseId}
                    blockId={blockId}
                    isUnitVerticalType={isUnitVerticalType}
                    unitXBlockActions={unitXBlockActions}
                    courseVerticalChildren={courseVerticalChildren.children}
                  />
                )}
                {!readOnly && showPasteXBlock && canPasteComponent && isUnitVerticalType && sharedClipboardData
                  && /* istanbul ignore next */ (
                    <PasteComponent
                      clipboardData={sharedClipboardData}
                      onClick={
                        /* istanbul ignore next */
                        () => handleCreateNewCourseXBlock({ stagedContent: 'clipboard', parentLocator: blockId })
                      }
                      text={intl.formatMessage(messages.pasteButtonText)}
                    />
                  )}
                {!readOnly && blockId && (
                  <AddComponent
                    parentLocator={blockId}
                    isSplitTestType={isSplitTestType}
                    isUnitVerticalType={isUnitVerticalType}
                    isProblemBankType={isProblemBankType}
                    isEmptyUnit={courseVerticalChildren.children.length === 0}
                    handleCreateNewCourseXBlock={handleCreateNewCourseXBlock}
                    addComponentTemplateData={addComponentTemplateData}
                  />
                )}
                <MoveModal
                  isOpenModal={isMoveModalOpen}
                  openModal={openMoveModal}
                  closeModal={closeMoveModal}
                  courseId={courseId}
                />
                <IframePreviewLibraryXBlockChanges />
              </div>
              {!isUnitLegacyLibraryType && (
                <CourseAuthoringUnitSidebarSlot
                  courseId={courseId}
                  blockId={blockId}
                  unitTitle={unitTitle}
                  xBlocks={courseVerticalChildren.children}
                  readOnly={readOnly}
                  isUnitVerticalType={isUnitVerticalType}
                  isSplitTestType={isSplitTestType}
                />
              )}
            </div>
          </section>
        </Container>
        <div className="alert-toast">
          <SavingErrorAlert
            isQueryFailed={savingStatus === RequestStatus.FAILED}
            errorMessage={errorMessage}
          />
        </div>
      </UnitSidebarPagesProvider>
    </UnitSidebarProvider>
  );
};

export default CourseUnit;
