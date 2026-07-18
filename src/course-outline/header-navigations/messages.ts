import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  newSectionButton: {
    id: 'course-authoring.course-outline.header-navigations.button.new-section',
    defaultMessage: 'New module',
  },
  addButton: {
    id: 'course-authoring.course-outline.header-navigations.button.add-button',
    defaultMessage: 'Add',
    description: 'Label for the button that opens the add-content sidebar.',
  },
  newSectionButtonTooltip: {
    id: 'course-authoring.course-outline.header-navigations.button.new-section.tooltip',
    defaultMessage: 'Add a new module',
  },
  reindexButton: {
    id: 'course-authoring.course-outline.header-navigations.button.reindex',
    defaultMessage: 'Reindex',
  },
  reindexButtonTooltip: {
    id: 'course-authoring.course-outline.header-navigations.button.reindex.tooltip',
    defaultMessage: 'Reindex course',
  },
  expandAllButton: {
    id: 'course-authoring.course-outline.header-navigations.button.expand-all',
    defaultMessage: 'Expand all',
  },
  collapseAllButton: {
    id: 'course-authoring.course-outline.header-navigations.button.collapse-all',
    defaultMessage: 'Collapse all',
  },
  viewLiveButton: {
    id: 'course-authoring.course-outline.header-navigations.button.view-live',
    defaultMessage: 'View live',
  },
  courseInfoButtonTooltip: {
    id: 'course-authoring.course-outline.header-navigations.button.course.info.tooltip',
    defaultMessage: 'Click to open course info in sidebar',
    description: 'Tooltip for the button that opens course information in the sidebar.',
  },
  courseInfoButton: {
    id: 'course-authoring.course-outline.header-navigations.button.course.info',
    defaultMessage: 'Course info',
    description: 'Label for the button that opens course information in the sidebar.',
  },
  viewLiveButtonTooltip: {
    id: 'course-authoring.course-outline.header-navigations.button.view-live.tooltip',
    defaultMessage: 'Open course in the LMS in a new tab',
  },
});

export default messages;
