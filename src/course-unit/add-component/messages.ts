import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  title: {
    id: 'course-authoring.course-unit.add.component.title',
    defaultMessage: 'Add activity',
    description: 'Title text for add component section in course unit.',
  },
  advancedTitle: {
    id: 'course-authoring.course-unit.add.component.advanced.title',
    defaultMessage: 'Other activity types',
    description: 'Title text for advanced component section in empty units.',
  },
  buttonText: {
    id: 'course-authoring.course-unit.add.component.button.text',
    defaultMessage: 'Add activity:',
    description: 'Information text for screen-readers about each add component button',
  },
  modalBtnText: {
    id: 'course-authoring.course-unit.modal.button.text',
    defaultMessage: 'Select',
    description: 'Information text for screen-readers about each add component button',
  },
  singleComponentPickerModalTitle: {
    id: 'course-authoring.course-unit.modal.single-title.text',
    defaultMessage: 'Select an activity',
    description: 'Library content picker modal title.',
  },
  multipleComponentPickerModalTitle: {
    id: 'course-authoring.course-unit.modal.multiple-title.text',
    defaultMessage: 'Select activities',
    description: 'Problem bank component picker modal title.',
  },
  multipleComponentPickerModalBtn: {
    id: 'course-authoring.course-unit.modal.multiple-btn.text',
    defaultMessage: 'Add selected activities',
    description: 'Problem bank component add button text.',
  },
  videoPickerModalTitle: {
    id: 'course-authoring.course-unit.modal.video-title.text',
    defaultMessage: 'Select a video',
    description: 'Video picker modal title.',
  },
  modalContainerTitle: {
    id: 'course-authoring.course-unit.modal.container.title',
    defaultMessage: 'Add activity {componentTitle}',
    description: 'Modal title for adding components',
  },
  modalContainerCancelBtnText: {
    id: 'course-authoring.course-unit.modal.container.cancel.button.text',
    defaultMessage: 'Cancel',
    description: 'Modal cancel button text.',
  },
  lessonBuilderEyebrow: {
    id: 'course-authoring.course-unit.lesson-builder.eyebrow',
    defaultMessage: 'Lesson builder',
    description: 'Eyebrow above the empty lesson builder.',
  },
  lessonBuilderTitle: {
    id: 'course-authoring.course-unit.lesson-builder.title',
    defaultMessage: 'What should learners do?',
    description: 'Primary title for the empty lesson builder.',
  },
  lessonBuilderDescription: {
    id: 'course-authoring.course-unit.lesson-builder.description',
    defaultMessage: 'Start with a teaching intent. You can enrich the page with more content later.',
    description: 'Description text for the empty lesson builder.',
  },
  lessonBuilderCreateAction: {
    id: 'course-authoring.course-unit.lesson-builder.create-action',
    defaultMessage: 'Create this activity',
    description: 'CTA label inside recipe cards.',
  },
  activityBack: {
    id: 'course-authoring.course-unit.lesson-builder.back',
    defaultMessage: 'Back',
    description: 'Back button in the activity picker.',
  },
  lessonBuilderReadTitle: {
    id: 'course-authoring.course-unit.lesson-builder.read.title',
    defaultMessage: 'Read',
    description: 'Read recipe title.',
  },
  lessonBuilderReadDescription: {
    id: 'course-authoring.course-unit.lesson-builder.read.description',
    defaultMessage: 'Present a concept with text, examples, and visuals.',
    description: 'Read recipe description.',
  },
  lessonBuilderWatchTitle: {
    id: 'course-authoring.course-unit.lesson-builder.watch.title',
    defaultMessage: 'Watch',
    description: 'Watch recipe title.',
  },
  lessonBuilderWatchDescription: {
    id: 'course-authoring.course-unit.lesson-builder.watch.description',
    defaultMessage: 'Introduce the topic with a video, demo, or short clip.',
    description: 'Watch recipe description.',
  },
  lessonBuilderPracticeTitle: {
    id: 'course-authoring.course-unit.lesson-builder.practice.title',
    defaultMessage: 'Practice',
    description: 'Practice recipe title.',
  },
  lessonBuilderPracticeDescription: {
    id: 'course-authoring.course-unit.lesson-builder.practice.description',
    defaultMessage: 'Apply a concept through an exercise or scenario.',
    description: 'Practice recipe description.',
  },
  lessonBuilderAnswerTitle: {
    id: 'course-authoring.course-unit.lesson-builder.answer.title',
    defaultMessage: 'Answer',
    description: 'Answer recipe title.',
  },
  lessonBuilderAnswerDescription: {
    id: 'course-authoring.course-unit.lesson-builder.answer.description',
    defaultMessage: 'Quickly check understanding with a question or quiz.',
    description: 'Answer recipe description.',
  },
  lessonBuilderDiscussTitle: {
    id: 'course-authoring.course-unit.lesson-builder.discuss.title',
    defaultMessage: 'Discuss',
    description: 'Discuss recipe title.',
  },
  lessonBuilderDiscussDescription: {
    id: 'course-authoring.course-unit.lesson-builder.discuss.description',
    defaultMessage: 'Start a guided discussion or group reflection with learners.',
    description: 'Discuss recipe description.',
  },
  lessonBuilderSubmitTitle: {
    id: 'course-authoring.course-unit.lesson-builder.submit.title',
    defaultMessage: 'Submit work',
    description: 'Submit work recipe title.',
  },
  lessonBuilderSubmitDescription: {
    id: 'course-authoring.course-unit.lesson-builder.submit.description',
    defaultMessage: 'Collect an assignment, project, or final deliverable.',
    description: 'Submit work recipe description.',
  },
  lessonBuilderListenTitle: {
    id: 'course-authoring.course-unit.lesson-builder.listen.title',
    defaultMessage: 'Listen',
    description: 'Listen recipe title.',
  },
  lessonBuilderListenDescription: {
    id: 'course-authoring.course-unit.lesson-builder.listen.description',
    defaultMessage: 'Course audio or generated narration. Coming soon.',
    description: 'Listen recipe description.',
  },
  lessonBuilderExerciseTitle: {
    id: 'course-authoring.course-unit.lesson-builder.exercise.title',
    defaultMessage: 'Exercise',
    description: 'Exercise recipe title.',
  },
  lessonBuilderExerciseDescription: {
    id: 'course-authoring.course-unit.lesson-builder.exercise.description',
    defaultMessage: 'Quiz, assignment, open response, or interactive activity.',
    description: 'Exercise recipe description.',
  },
  lessonBuilderLiveTitle: {
    id: 'course-authoring.course-unit.lesson-builder.live.title',
    defaultMessage: 'Live session',
    description: 'Live session recipe title.',
  },
  lessonBuilderLiveDescription: {
    id: 'course-authoring.course-unit.lesson-builder.live.description',
    defaultMessage: 'Schedule a live BBB classroom session for this lesson.',
    description: 'Live session recipe description.',
  },
  lessonBuilderLiveCheckingDescription: {
    id: 'course-authoring.course-unit.lesson-builder.live.checking.description',
    defaultMessage: 'Checking live session availability.',
    description: 'Live session availability loading description.',
  },
  lessonBuilderLiveUnavailableDescription: {
    id: 'course-authoring.course-unit.lesson-builder.live.unavailable.description',
    defaultMessage: 'Live sessions are not enabled for this organization.',
    description: 'Disabled live session recipe description.',
  },
  lessonBuilderOtherTitle: {
    id: 'course-authoring.course-unit.lesson-builder.other.title',
    defaultMessage: 'Other',
    description: 'Other recipe title.',
  },
  lessonBuilderOtherDescription: {
    id: 'course-authoring.course-unit.lesson-builder.other.description',
    defaultMessage: 'Show advanced components and less common options.',
    description: 'Other recipe description.',
  },
  lessonBuilderHtmlTitle: {
    id: 'course-authoring.course-unit.lesson-builder.html.title',
    defaultMessage: 'HTML text',
    description: 'HTML text choice title.',
  },
  lessonBuilderHtmlDescription: {
    id: 'course-authoring.course-unit.lesson-builder.html.description',
    defaultMessage: 'Create a text activity with the HTML editor.',
    description: 'HTML text choice description.',
  },
  lessonBuilderPdfTitle: {
    id: 'course-authoring.course-unit.lesson-builder.pdf.title',
    defaultMessage: 'PDF file',
    description: 'PDF choice title.',
  },
  lessonBuilderPdfDescription: {
    id: 'course-authoring.course-unit.lesson-builder.pdf.description',
    defaultMessage: 'Upload a PDF file and configure how it appears in the course.',
    description: 'PDF choice description.',
  },
  lessonBuilderQuizTitle: {
    id: 'course-authoring.course-unit.lesson-builder.quiz.title',
    defaultMessage: 'Quiz',
    description: 'Quiz choice title.',
  },
  lessonBuilderQuizDescription: {
    id: 'course-authoring.course-unit.lesson-builder.quiz.description',
    defaultMessage: 'Quick question or understanding check.',
    description: 'Quiz choice description.',
  },
  lessonBuilderDragDropTitle: {
    id: 'course-authoring.course-unit.lesson-builder.drag-drop.title',
    defaultMessage: 'Drag and drop',
    description: 'Drag and drop choice title.',
  },
  lessonBuilderDragDropDescription: {
    id: 'course-authoring.course-unit.lesson-builder.drag-drop.description',
    defaultMessage: 'Interactive sorting or matching exercise.',
    description: 'Drag and drop choice description.',
  },
  lessonBuilderOpenResponseTitle: {
    id: 'course-authoring.course-unit.lesson-builder.open-response.title',
    defaultMessage: 'Open response',
    description: 'Open response choice title.',
  },
  lessonBuilderOpenResponseDescription: {
    id: 'course-authoring.course-unit.lesson-builder.open-response.description',
    defaultMessage: 'Collect a long-form response or assignment.',
    description: 'Open response choice description.',
  },
  lessonBuilderCollectTitle: {
    id: 'course-authoring.course-unit.lesson-builder.collect.title',
    defaultMessage: 'Collect responses',
    description: 'Collect answers choice title.',
  },
  lessonBuilderCollectDescription: {
    id: 'course-authoring.course-unit.lesson-builder.collect.description',
    defaultMessage: 'Receive a file, project, or final deliverable.',
    description: 'Collect answers choice description.',
  },
  lessonBuilderScormTitle: {
    id: 'course-authoring.course-unit.lesson-builder.scorm.title',
    defaultMessage: 'SCORM',
    description: 'SCORM advanced activity title.',
  },
  lessonBuilderScormDescription: {
    id: 'course-authoring.course-unit.lesson-builder.scorm.description',
    defaultMessage: 'Upload a SCORM package for external interactive lessons.',
    description: 'SCORM advanced activity description.',
  },
  lessonBuilderH5pTitle: {
    id: 'course-authoring.course-unit.lesson-builder.h5p.title',
    defaultMessage: 'H5P',
    description: 'H5P advanced activity title.',
  },
  lessonBuilderH5pDescription: {
    id: 'course-authoring.course-unit.lesson-builder.h5p.description',
    defaultMessage: 'Add an H5P interactive component such as a quiz, game, or presentation.',
    description: 'H5P advanced activity description.',
  },
  lessonBuilderLtiTitle: {
    id: 'course-authoring.course-unit.lesson-builder.lti.title',
    defaultMessage: 'LTI tool',
    description: 'LTI advanced activity title.',
  },
  lessonBuilderLtiDescription: {
    id: 'course-authoring.course-unit.lesson-builder.lti.description',
    defaultMessage: 'Connect an external learning tool using LTI.',
    description: 'LTI advanced activity description.',
  },
  lessonBuilderIframeTitle: {
    id: 'course-authoring.course-unit.lesson-builder.iframe.title',
    defaultMessage: 'Iframe embed',
    description: 'Iframe advanced activity title.',
  },
  lessonBuilderIframeDescription: {
    id: 'course-authoring.course-unit.lesson-builder.iframe.description',
    defaultMessage: 'Embed an external web experience directly in the activity.',
    description: 'Iframe advanced activity description.',
  },
  lessonBuilderPollTitle: {
    id: 'course-authoring.course-unit.lesson-builder.poll.title',
    defaultMessage: 'Poll',
    description: 'Poll advanced activity title.',
  },
  lessonBuilderPollDescription: {
    id: 'course-authoring.course-unit.lesson-builder.poll.description',
    defaultMessage: 'Ask learners a quick opinion or checkpoint question.',
    description: 'Poll advanced activity description.',
  },
  lessonBuilderSurveyTitle: {
    id: 'course-authoring.course-unit.lesson-builder.survey.title',
    defaultMessage: 'Survey',
    description: 'Survey advanced activity title.',
  },
  lessonBuilderSurveyDescription: {
    id: 'course-authoring.course-unit.lesson-builder.survey.description',
    defaultMessage: 'Collect structured feedback or learner self-report data.',
    description: 'Survey advanced activity description.',
  },
  modalComponentSupportLabelFullySupported: {
    id: 'course-authoring.course-unit.modal.component.support.label.fully-supported',
    defaultMessage: 'Supported',
    description: 'Label for advance problem type\'s support status with full platform support',
  },
  modalComponentSupportLabelProvisionallySupported: {
    id: 'course-authoring.course-unit.modal.component.support.label.provisionally-support',
    defaultMessage: 'Partially supported',
    description: 'Label for advance problem type\'s support status with provisional platform support',
  },
  modalComponentSupportLabelNotSupported: {
    id: 'course-authoring.course-unit.modal.component.support.label.not-supported',
    defaultMessage: 'Not supported',
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
