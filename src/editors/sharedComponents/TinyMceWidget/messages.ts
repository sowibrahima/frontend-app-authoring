import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  generateWithAi: {
    id: 'authoring.tinymce.generateWithAi.tooltip',
    defaultMessage: 'Generate with AI',
    description: 'Tooltip for the TinyMCE AI generation button.',
  },
  addImage: {
    id: 'authoring.tinymce.addImage.tooltip',
    defaultMessage: 'Add image',
    description: 'Tooltip for the TinyMCE image upload button.',
  },
  editImageSettings: {
    id: 'authoring.tinymce.editImageSettings.tooltip',
    defaultMessage: 'Edit image settings',
    description: 'Tooltip for the TinyMCE image settings button.',
  },
  sourceCode: {
    id: 'authoring.tinymce.sourceCode.tooltip',
    defaultMessage: 'Source code',
    description: 'Tooltip for the TinyMCE source code button.',
  },
  codeBlock: {
    id: 'authoring.tinymce.codeBlock.tooltip',
    defaultMessage: 'Code block',
    description: 'Tooltip for the TinyMCE inline code button.',
  },
  questionLabel: {
    id: 'authoring.tinymce.questionLabel.tooltip',
    defaultMessage: 'Apply a "Question" label to selected text for screen readers.',
    description: 'Tooltip for the TinyMCE accessible question label button.',
  },
});

export default messages;
