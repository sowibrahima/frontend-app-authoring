import React from 'react';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import { ArrowBack } from '@openedx/paragon/icons';
import { useNavigate } from 'react-router-dom';

import WutiskillStudioHomeHeader from '../header/WutiskillStudioHomeHeader';
import WutiFooter from '../footer/WutiFooter';

const messages = defineMessages({
  backToDashboard: {
    id: 'wuti.authoring.faq.backToDashboard',
    defaultMessage: 'Back to dashboard',
    description: 'Back link to the Studio dashboard from the Studio FAQ page.',
  },
  eyebrow: {
    id: 'wuti.authoring.faq.eyebrow',
    defaultMessage: 'Studio FAQ',
    description: 'Small label above the Studio FAQ page title.',
  },
  title: {
    id: 'wuti.authoring.faq.title',
    defaultMessage: 'Instructor questions',
    description: 'Title for the Studio FAQ page.',
  },
  subtitle: {
    id: 'wuti.authoring.faq.subtitle',
    defaultMessage: 'Answers for course teams preparing, publishing, and maintaining learning content in Studio.',
    description: 'Subtitle for the Studio FAQ page.',
  },
  questionCreateCourseTitle: {
    id: 'wuti.authoring.faq.question.createCourse.title',
    defaultMessage: 'How do I create a new course in Studio?',
    description: 'FAQ question about creating a course in Studio.',
  },
  questionCreateCourseAnswer: {
    id: 'wuti.authoring.faq.question.createCourse.answer',
    defaultMessage: 'From the Studio dashboard, choose Create a course, then enter the organization, course number, run, title, language, and schedule. Use a short course number and a clear run name so learners and team members can identify the course easily.',
    description: 'FAQ answer about creating a course in Studio.',
  },
  questionStructureCourseTitle: {
    id: 'wuti.authoring.faq.question.structureCourse.title',
    defaultMessage: 'How should I structure my course for learners?',
    description: 'FAQ question about course structure.',
  },
  questionStructureCourseAnswer: {
    id: 'wuti.authoring.faq.question.structureCourse.answer',
    defaultMessage: 'Build the course as modules, lessons, and activity pages. Keep each lesson focused on one objective, mix short explanations with practice, and publish changes after reviewing the learner view.',
    description: 'FAQ answer about course structure.',
  },
  questionLowBandwidthAuthoringTitle: {
    id: 'wuti.authoring.faq.question.lowBandwidthAuthoring.title',
    defaultMessage: 'How can I add videos or files when my Internet connection is limited?',
    description: 'FAQ question about authoring with limited connectivity.',
  },
  questionLowBandwidthAuthoringAnswer: {
    id: 'wuti.authoring.faq.question.lowBandwidthAuthoring.answer',
    defaultMessage: 'Prepare compressed videos, PDFs, and images before uploading. Upload one file at a time, avoid very large video files, and keep a local copy of your materials so you can retry if the connection drops.',
    description: 'FAQ answer about authoring with limited connectivity.',
  },
  questionCourseTeamTitle: {
    id: 'wuti.authoring.faq.question.courseTeam.title',
    defaultMessage: 'How do I invite another instructor or assistant to work on my course?',
    description: 'FAQ question about adding course team members.',
  },
  questionCourseTeamAnswer: {
    id: 'wuti.authoring.faq.question.courseTeam.answer',
    defaultMessage: 'Open the course, go to Course team, and add the person with the email address they use on the platform. Assign only the access they need, then ask them to confirm they can open the course in Studio.',
    description: 'FAQ answer about adding course team members.',
  },
});

const faqItems = [
  {
    title: messages.questionCreateCourseTitle,
    answer: messages.questionCreateCourseAnswer,
  },
  {
    title: messages.questionStructureCourseTitle,
    answer: messages.questionStructureCourseAnswer,
  },
  {
    title: messages.questionLowBandwidthAuthoringTitle,
    answer: messages.questionLowBandwidthAuthoringAnswer,
  },
  {
    title: messages.questionCourseTeamTitle,
    answer: messages.questionCourseTeamAnswer,
  },
];

const StudioFaqPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  return (
    <div className="ws-studio-faq-page">
      <WutiskillStudioHomeHeader />
      <main className="ws-studio-faq-page__body">
        <button
          type="button"
          className="ws-studio-faq-page__back"
          onClick={() => navigate('/home')}
        >
          <Icon src={ArrowBack} />
          {intl.formatMessage(messages.backToDashboard)}
        </button>

        <header className="ws-studio-faq-page__header">
          <p className="ws-studio-faq-page__eyebrow">{intl.formatMessage(messages.eyebrow)}</p>
          <h1 className="ws-studio-faq-page__title">{intl.formatMessage(messages.title)}</h1>
          <p className="ws-studio-faq-page__subtitle">{intl.formatMessage(messages.subtitle)}</p>
        </header>

        <section className="ws-studio-faq-page__list" aria-label={intl.formatMessage(messages.title)}>
          {faqItems.map((item) => (
            <details className="ws-studio-faq-page__item" key={item.title.id}>
              <summary className="ws-studio-faq-page__question">
                <span>{intl.formatMessage(item.title)}</span>
              </summary>
              <div className="ws-studio-faq-page__answer">
                <p>{intl.formatMessage(item.answer)}</p>
              </div>
            </details>
          ))}
        </section>
      </main>
      <WutiFooter />
    </div>
  );
};

export default StudioFaqPage;
