import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  headingTitle: {
    id: 'course-authoring.course-outline.headingTitle',
    defaultMessage: 'Plan du cours',
  },
  headingSubtitle: {
    id: 'course-authoring.course-outline.subTitle',
    defaultMessage: 'Contenu',
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
    defaultMessage: 'Nouveau module',
    description: 'Text of button to create new section in course outline',
  },
  useSectionFromLibraryButton: {
    id: 'course-authoring.course-outline.button.use-section-from-library',
    defaultMessage: 'Utiliser un module de la bibliothèque',
    description: 'Text of the button to add a section from a library in a course.',
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
    defaultMessage: 'Nouvelle page d activite',
    description: 'Message of the button to create a new unit in a subsection.',
  },
  useUnitFromLibraryButton: {
    id: 'course-authoring.course-outline.button.use-unit-from-library',
    defaultMessage: 'Utiliser une activite de la bibliothèque',
    description: 'Message of the button to add a new unit from a library in a subsection.',
  },
  newSubsectionButton: {
    id: 'course-authoring.course-outline.button.new-subsection',
    defaultMessage: 'Nouvelle lecon',
    description: 'Text of button to create new subsection in a section',
  },
  useSubsectionFromLibraryButton: {
    id: 'course-authoring.course-outline.button.use-subsection-from-library',
    defaultMessage: 'Utiliser une lecon de la bibliothèque',
    description: 'Message of the button to add a new subsection from a library in a subsection.',
  },
  sectionPickerModalTitle: {
    id: 'course-authoring.course-outline.button.section-modal.title',
    defaultMessage: 'Selectionner un module',
    description: 'Section modal picker title text in outline',
  },
});

export default messages;
