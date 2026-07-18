import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  startDateTitle: {
    id: 'course-authoring.course-outline.status-bar.start-date',
    defaultMessage: 'Date and details',
  },
  setDate: {
    id: 'course-authoring.course-outline.status-bar.set-date',
    defaultMessage: 'Set Date',
  },
  pacingTypeTitle: {
    id: 'course-authoring.course-outline.status-bar.pacing-type',
    defaultMessage: 'Pacing type',
  },
  pacingTypeSelfPaced: {
    id: 'course-authoring.course-outline.status-bar.pacing-type.self-paced',
    defaultMessage: 'Self paced',
  },
  pacingTypeInstructorPaced: {
    id: 'course-authoring.course-outline.status-bar.pacing-type.instructor-Paced',
    defaultMessage: 'Instructor paced',
  },
  checklistTitle: {
    id: 'course-authoring.course-outline.status-bar.checklists',
    defaultMessage: 'Creation checklist',
  },
  checklistCompleted: {
    id: 'course-authoring.course-outline.status-bar.checklists.completed',
    defaultMessage: 'completed',
  },
  notificationMetadataTitle: {
    id: 'course-authoring.course-outline.status-bar.notification-metadata',
    defaultMessage: '{count, plural, one {{count} notification} other {{count} notifications}}',
    description: 'Metadata notifications text in course outline',
  },
  highlightEmailsTitle: {
    id: 'course-authoring.course-outline.status-bar.highlight-emails',
    defaultMessage: 'Highlight emails',
  },
  highlightEmailsButton: {
    id: 'course-authoring.course-outline.status-bar.highlight-emails.button',
    defaultMessage: 'Activate now',
  },
  highlightEmailsEnabled: {
    id: 'course-authoring.course-outline.status-bar.highlight-emails.enabled',
    defaultMessage: 'Enabled',
  },
  highlightEmailsLink: {
    id: 'course-authoring.course-outline.status-bar.highlight-emails.link',
    defaultMessage: 'Learn more',
  },
  courseTagsTitle: {
    id: 'course-authoring.course-outline.status-bar.course-tags',
    defaultMessage: 'Course tags',
    description: 'Course tags header in course outline',
  },
  courseManageTagsLink: {
    id: 'course-authoring.course-outline.status-bar.course-manage-tags-link',
    defaultMessage: 'Manage tags',
    description: 'Opens the drawer to edit content tags',
  },
  videoSharingTitle: {
    id: 'course-authoring.course-outline.status-bar.video-sharing.title',
    defaultMessage: 'Video sharing',
  },
  videoSharingLink: {
    id: 'course-authoring.course-outline.status-bar.video-sharing.link',
    defaultMessage: 'Learn more',
  },
  videoSharingPerVideoText: {
    id: 'course-authoring.course-outline.status-bar.video-sharing.perVideo.text',
    defaultMessage: 'Per video',
  },
  videoSharingAllOffText: {
    id: 'course-authoring.course-outline.status-bar.video-sharing.allOff.text',
    defaultMessage: 'No videos',
  },
  videoSharingAllOnText: {
    id: 'course-authoring.course-outline.status-bar.video-sharing.allOn.text',
    defaultMessage: 'All videos',
  },
  unpublishedBadgeText: {
    id: 'course-authoring.course-outline.status-bar.unpublished.badge.text',
    defaultMessage: 'Unpublished changes',
    description: 'Text shown when a course has unpublished changes.',
  },
  activeBadgeText: {
    id: 'course-authoring.course-outline.status-bar.active.badge.text',
    defaultMessage: 'Active',
    description: 'Text shown when a course has started and has not ended.',
  },
  archivedBadgeText: {
    id: 'course-authoring.course-outline.status-bar.archived.badge.text',
    defaultMessage: 'Archived',
    description: 'Text shown when a course has ended.',
  },
  upcomingBadgeText: {
    id: 'course-authoring.course-outline.status-bar.upcoming.badge.text',
    defaultMessage: 'Upcoming',
    description: 'Text shown when a course has not started.',
  },
  libraryUpdatesText: {
    id: 'course-authoring.course-outline.status-bar.library.updates.text',
    defaultMessage: '{count, plural, one {{count} library update} other {{count} library updates}}',
    description: 'Status text displaying the count of library updates.',
  },
});

export default messages;
