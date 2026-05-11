import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  pasteButton: {
    id: 'course-authoring.course-outline.subsection.button.paste-unit',
    defaultMessage: 'Paste unit',
    description: 'Message of the button to paste a new unit in a subsection.',
  },
  unitPickerModalTitle: {
    id: 'course-authoring.course-outline.subsection.unit.modal.single-title.text',
    defaultMessage: 'Select unit',
    description: 'Library unit picker modal title.',
  },
  activityPickerTitle: {
    id: 'course-authoring.course-outline.subsection.activity-picker.title',
    defaultMessage: 'Add an activity',
    description: 'Title for the activity picker modal.',
  },
  activityPickerIntro: {
    id: 'course-authoring.course-outline.subsection.activity-picker.intro',
    defaultMessage: 'Choose the type of activity to add to this lesson.',
    description: 'Intro text for the activity picker modal.',
  },
  activityBack: {
    id: 'course-authoring.course-outline.subsection.activity-picker.back',
    defaultMessage: 'Back',
    description: 'Back button in the activity picker.',
  },
  activityPickerAddSelected: {
    id: 'course-authoring.course-outline.subsection.activity-picker.add-selected',
    defaultMessage: 'Add selected activity',
    description: 'Button text for adding the selected advanced activity.',
  },
});

export default messages;
