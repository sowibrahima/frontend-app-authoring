import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  popoverContentText: {
    id: 'course-authoring.generic.paste-component.popover.content.text',
    defaultMessage: 'Source:',
    description: 'The popover content label before the source course name of the copied content.',
  },
  pasteButtonWhatsInClipboardText: {
    id: 'course-authoring.generic.paste-component.paste-button.whats-in-clipboard.text',
    defaultMessage: 'Copied content details',
    description: 'The popover trigger button text of the info about copied content.',
  },
});

export default messages;
