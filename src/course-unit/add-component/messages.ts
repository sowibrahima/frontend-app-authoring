import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'course-authoring.course-unit.add.component.title',
    defaultMessage: 'Ajouter une activite',
    description: 'Title text for add component section in course unit.',
  },
  advancedTitle: {
    id: 'course-authoring.course-unit.add.component.advanced.title',
    defaultMessage: 'Autres types d activites',
    description: 'Title text for advanced component section in empty units.',
  },
  buttonText: {
    id: 'course-authoring.course-unit.add.component.button.text',
    defaultMessage: 'Ajouter l activite :',
    description: 'Information text for screen-readers about each add component button',
  },
  modalBtnText: {
    id: 'course-authoring.course-unit.modal.button.text',
    defaultMessage: 'Selectionner',
    description: 'Information text for screen-readers about each add component button',
  },
  singleComponentPickerModalTitle: {
    id: 'course-authoring.course-unit.modal.single-title.text',
    defaultMessage: 'Selectionner une activite',
    description: 'Library content picker modal title.',
  },
  multipleComponentPickerModalTitle: {
    id: 'course-authoring.course-unit.modal.multiple-title.text',
    defaultMessage: 'Selectionner des activites',
    description: 'Problem bank component picker modal title.',
  },
  multipleComponentPickerModalBtn: {
    id: 'course-authoring.course-unit.modal.multiple-btn.text',
    defaultMessage: 'Ajouter les activites selectionnees',
    description: 'Problem bank component add button text.',
  },
  videoPickerModalTitle: {
    id: 'course-authoring.course-unit.modal.video-title.text',
    defaultMessage: 'Selectionner une video',
    description: 'Video picker modal title.',
  },
  modalContainerTitle: {
    id: 'course-authoring.course-unit.modal.container.title',
    defaultMessage: 'Ajouter l activite {componentTitle}',
    description: 'Modal title for adding components',
  },
  modalContainerCancelBtnText: {
    id: 'course-authoring.course-unit.modal.container.cancel.button.text',
    defaultMessage: 'Annuler',
    description: 'Modal cancel button text.',
  },
  lessonBuilderEyebrow: {
    id: 'course-authoring.course-unit.lesson-builder.eyebrow',
    defaultMessage: 'Lesson builder',
    description: 'Eyebrow above the empty lesson builder.',
  },
  lessonBuilderTitle: {
    id: 'course-authoring.course-unit.lesson-builder.title',
    defaultMessage: 'Que voulez-vous faire faire aux apprenants ?',
    description: 'Primary title for the empty lesson builder.',
  },
  lessonBuilderDescription: {
    id: 'course-authoring.course-unit.lesson-builder.description',
    defaultMessage: 'Commencez par une intention pedagogique. Vous pourrez enrichir la page avec plus de contenus ensuite.',
    description: 'Description text for the empty lesson builder.',
  },
  lessonBuilderCreateAction: {
    id: 'course-authoring.course-unit.lesson-builder.create-action',
    defaultMessage: 'Creer cette activite',
    description: 'CTA label inside recipe cards.',
  },
  lessonBuilderReadTitle: {
    id: 'course-authoring.course-unit.lesson-builder.read.title',
    defaultMessage: 'Lire',
    description: 'Read recipe title.',
  },
  lessonBuilderReadDescription: {
    id: 'course-authoring.course-unit.lesson-builder.read.description',
    defaultMessage: 'Presenter un concept avec du texte, des exemples et des visuels.',
    description: 'Read recipe description.',
  },
  lessonBuilderWatchTitle: {
    id: 'course-authoring.course-unit.lesson-builder.watch.title',
    defaultMessage: 'Regarder',
    description: 'Watch recipe title.',
  },
  lessonBuilderWatchDescription: {
    id: 'course-authoring.course-unit.lesson-builder.watch.description',
    defaultMessage: 'Introduire le sujet avec une video, une demonstration ou une capsule.',
    description: 'Watch recipe description.',
  },
  lessonBuilderPracticeTitle: {
    id: 'course-authoring.course-unit.lesson-builder.practice.title',
    defaultMessage: 'Pratiquer',
    description: 'Practice recipe title.',
  },
  lessonBuilderPracticeDescription: {
    id: 'course-authoring.course-unit.lesson-builder.practice.description',
    defaultMessage: 'Faire appliquer une notion dans un exercice ou une mise en situation.',
    description: 'Practice recipe description.',
  },
  lessonBuilderAnswerTitle: {
    id: 'course-authoring.course-unit.lesson-builder.answer.title',
    defaultMessage: 'Repondre',
    description: 'Answer recipe title.',
  },
  lessonBuilderAnswerDescription: {
    id: 'course-authoring.course-unit.lesson-builder.answer.description',
    defaultMessage: 'Verifier rapidement la comprehension avec une question ou un quiz.',
    description: 'Answer recipe description.',
  },
  lessonBuilderDiscussTitle: {
    id: 'course-authoring.course-unit.lesson-builder.discuss.title',
    defaultMessage: 'Discuter',
    description: 'Discuss recipe title.',
  },
  lessonBuilderDiscussDescription: {
    id: 'course-authoring.course-unit.lesson-builder.discuss.description',
    defaultMessage: 'Lancer une discussion guidee ou un retour collectif entre apprenants.',
    description: 'Discuss recipe description.',
  },
  lessonBuilderSubmitTitle: {
    id: 'course-authoring.course-unit.lesson-builder.submit.title',
    defaultMessage: 'Rendre un travail',
    description: 'Submit work recipe title.',
  },
  lessonBuilderSubmitDescription: {
    id: 'course-authoring.course-unit.lesson-builder.submit.description',
    defaultMessage: 'Collecter un devoir, un projet ou une production finale.',
    description: 'Submit work recipe description.',
  },
  modalComponentSupportLabelFullySupported: {
    id: 'course-authoring.course-unit.modal.component.support.label.fully-supported',
    defaultMessage: 'Pris en charge',
    description: 'Label for advance problem type\'s support status with full platform support',
  },
  modalComponentSupportLabelProvisionallySupported: {
    id: 'course-authoring.course-unit.modal.component.support.label.provisionally-support',
    defaultMessage: 'Pris en charge partiellement',
    description: 'Label for advance problem type\'s support status with provisional platform support',
  },
  modalComponentSupportLabelNotSupported: {
    id: 'course-authoring.course-unit.modal.component.support.label.not-supported',
    defaultMessage: 'Non pris en charge',
    description: 'Label for advance problem type\'s support status with no platform support',
  },
  modalComponentSupportTooltipFullySupported: {
    id: 'course-authoring.course-unit.modal.component.support.tooltip.fully-supported',
    defaultMessage: 'Fully supported tools and features are available for Open edX installations, '
      + 'are fully tested, have user interfaces where applicable, and are documented in the '
      + 'official Open edX guides that are available on docs.openedx.org.',
    description: 'Message for support status tooltip for modules with full platform support',
  },
  modalComponentSupportTooltipNotSupported: {
    id: 'course-authoring.course-unit.modal.component.support.tooltip.not-supported',
    defaultMessage: 'Tools with no support are not maintained by the Open edX community, '
      + 'and might be deprecated in the future. They are not recommended for use in '
      + 'courses due to non-compliance with one or more of the base requirements, such as '
      + 'testing, accessibility, internationalization, and documentation.',
    description: 'Message for support status tooltip for modules which is not supported',
  },
  modalComponentSupportTooltipProvisionallySupported: {
    id: 'course-authoring.course-unit.modal.component.support.tooltip.provisionally-support',
    defaultMessage: 'Provisionally supported tools might lack the robustness of functionality '
      + 'that your courses require. Open edX does not have control over the quality of the software, '
      + 'or of the content that can be provided using these tools. Test these tools thoroughly '
      + 'before using them in your course, especially in graded sections. Complete documentation '
      + 'might not be available for provisionally supported tools, or documentation might be '
      + 'available from sources other than the Open edX community.',
    description: 'Message for support status tooltip for modules with provisional platform support',
  },
});

export default messages;
