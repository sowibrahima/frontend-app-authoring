import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  headingTitle: {
    id: 'course-authoring.course-outline.headingTitle',
    defaultMessage: 'Course outline',
  },
  headingSubtitle: {
    id: 'course-authoring.course-outline.subTitle',
    defaultMessage: 'Content',
  },
  alertSuccessTitle: {
    id: 'course-authoring.course-outline.reindex.alert.success.title',
    defaultMessage: 'Course index',
  },
  alertSuccessDescription: {
    id: 'course-authoring.course-outline.reindex.alert.success.description',
    defaultMessage: 'Course has been successfully reindexed.',
  },
  alertSuccessAriaLabelledby: {
    id: 'course-authoring.course-outline.reindex.alert.success.aria.labelledby',
    defaultMessage: 'alert-confirmation-title',
  },
  alertSuccessAriaDescribedby: {
    id: 'course-authoring.course-outline.reindex.alert.success.aria.describedby',
    defaultMessage: 'alert-confirmation-description',
  },
  newSectionButton: {
    id: 'course-authoring.course-outline.section-list.button.new-section',
    defaultMessage: 'New module',
    description: 'Text of button to create new section in course outline',
  },
  useSectionFromLibraryButton: {
    id: 'course-authoring.course-outline.button.use-section-from-library',
    defaultMessage: 'Use a module from the library',
    description: 'Text of the button to add a section from a library in a course.',
  },
  defaultModuleName: {
    id: 'course-authoring.course-outline.default-name.module',
    defaultMessage: 'Module',
    description: 'Default display name for a newly created module.',
  },
  defaultLessonName: {
    id: 'course-authoring.course-outline.default-name.lesson',
    defaultMessage: 'Lesson',
    description: 'Default display name for a newly created lesson.',
  },
  defaultActivityName: {
    id: 'course-authoring.course-outline.default-name.activity',
    defaultMessage: 'Activity',
    description: 'Default display name for a newly created activity.',
  },
  createItemNameModalTitle: {
    id: 'course-authoring.course-outline.create-name-modal.title',
    defaultMessage: 'Name this {itemType}',
    description: 'Title for the modal that asks for a new outline item name.',
  },
  createItemNameModalLabel: {
    id: 'course-authoring.course-outline.create-name-modal.label',
    defaultMessage: '{itemType} name',
    description: 'Label for the input used to name a new outline item.',
  },
  createItemNameModalPlaceholder: {
    id: 'course-authoring.course-outline.create-name-modal.placeholder',
    defaultMessage: 'Enter a name',
    description: 'Placeholder for the input used to name a new outline item.',
  },
  createItemNameModalRequired: {
    id: 'course-authoring.course-outline.create-name-modal.required',
    defaultMessage: '{itemType} name is required',
    description: 'Validation message when a new outline item name is missing.',
  },
  createItemNameModalCancel: {
    id: 'course-authoring.course-outline.create-name-modal.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button text for the new outline item name modal.',
  },
  createItemNameModalCreate: {
    id: 'course-authoring.course-outline.create-name-modal.create',
    defaultMessage: 'Create',
    description: 'Submit button text for the new outline item name modal.',
  },
  exportTagsCreatingToastMessage: {
    id: 'course-authoring.course-outline.export-tags.toast.creating.message',
    defaultMessage: 'Please wait. Creating export file for course tags...',
    description: 'In progress message in toast when exporting tags of a course',
  },
  exportTagsSuccessToastMessage: {
    id: 'course-authoring.course-outline.export-tags.toast.success.message',
    defaultMessage: 'Course tags exported successfully',
    description: 'Success message in toast when exporting tags of a course',
  },
  exportTagsErrorToastMessage: {
    id: 'course-authoring.course-outline.export-tags.toast.error.message',
    defaultMessage: 'An error has occurred creating the file',
    description: 'Error message in toast when exporting tags of a course',
  },
  newUnitButton: {
    id: 'course-authoring.course-outline.button.new-unit',
    defaultMessage: 'New activity page',
    description: 'Message of the button to create a new unit in a subsection.',
  },
  useUnitFromLibraryButton: {
    id: 'course-authoring.course-outline.button.use-unit-from-library',
    defaultMessage: 'Use an activity from the library',
    description: 'Message of the button to add a new unit from a library in a subsection.',
  },
  newSubsectionButton: {
    id: 'course-authoring.course-outline.button.new-subsection',
    defaultMessage: 'New lesson',
    description: 'Text of button to create new subsection in a section',
  },
  useSubsectionFromLibraryButton: {
    id: 'course-authoring.course-outline.button.use-subsection-from-library',
    defaultMessage: 'Use a lesson from the library',
    description: 'Message of the button to add a new subsection from a library in a subsection.',
  },
  sectionPickerModalTitle: {
    id: 'course-authoring.course-outline.button.section-modal.title',
    defaultMessage: 'Select a module',
    description: 'Section modal picker title text in outline',
  },
});

export default messages;
