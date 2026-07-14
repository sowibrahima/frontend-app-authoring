import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import {
  ArrowLeft,
  ArrowRight,
  AutoAwesome,
  Check,
  CreditCard,
  EditNote,
  LibraryBooks,
  MoneyOff,
  People,
  Settings,
} from '@openedx/paragon/icons';

import { RequestStatus } from '../data/constants';
import { getStudioHomeData } from '../studio-home/data/selectors';
import {
  getOrganizations,
  getRedirectUrlObj,
  getSavingStatus,
  getPostErrors,
} from '../generic/data/selectors';
import { updateSavingStatus, updatePostErrors } from '../generic/data/slice';
import {
  fetchOrganizationsQuery,
  updateCreateOrRerunCourseQuery,
} from '../generic/data/thunks';
import { getCourseDetails, updateCourseDetails } from '../schedule-and-details/data/api';
import { uploadAssets } from '../generic/course-upload-image/data/api';
import { COMPONENT_TYPES } from '../generic/block-type-utils/constants';
import { createCourseXblock, getCourseOutlineIndex } from '../course-outline/data/api';
import {
  CoursePlanBuilder,
  CoursePlanDraft,
  CoursePlanStructure,
  CoursePlanTemplateSummary,
  createEmptyPlanStructure,
  createPlanDraftFromStructure,
  createScratchPlanDraft,
  hydratePlanStructure,
} from '../course-plan-builder';
import {
  applyCoursePlanToCourse,
  createCourseGenerationJob,
  getCourseGenerationJob,
  getCoursePlanTemplate,
  getCoursePlanTemplates,
} from '../course-plan-templates/data/api';
import './CreateCourseWizard.scss';

type PacingType = 'instructor' | 'self' | '';
type PriceMode = 'free' | 'paid' | '';
type CreationStrategy = 'template' | 'ai' | 'scratch' | '';
type PrerequisiteMode = 'none' | 'required';
type BlueprintType = 'videoQuiz' | 'reading' | 'project' | 'assessment' | 'corporate' | '';
type RecipeType = 'read' | 'watch' | 'practice' | 'answer' | 'discuss' | 'submit';

interface WizardData {
  displayName: string;
  org: string;
  number: string;
  run: string;
  shortDescription: string;
  language: string;
  overviewHtml: string;
  courseStart: string;
  courseEnd: string;
  enrollmentStart: string;
  enrollmentEnd: string;
  pacing: PacingType;
  prerequisiteMode: PrerequisiteMode;
  prerequisiteCourse: string;
  priceMode: PriceMode;
  paidPrice: string;
  currency: string;
  creationStrategy: CreationStrategy;
  templateId: string;
  blueprintType: BlueprintType;
  topicPrompt: string;
}

interface CalendarErrors {
  courseRange?: string;
  enrollmentRange?: string;
}

interface OutlineActivity {
  id: string;
  title: string;
  recipe: RecipeType;
}

interface OutlineLesson {
  id: string;
  title: string;
  activities: OutlineActivity[];
}

interface OutlineModule {
  id: string;
  title: string;
  lessons: OutlineLesson[];
}

const TOTAL_STEPS = 7;
const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024;
const THUMBNAIL_MIME_TYPES = ['image/png', 'image/jpeg'];
const COURSE_SETUP_STORAGE_PREFIX = 'wutiskill.course-setup.';

const LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'fr', label: 'French' },
  { value: 'en', label: 'English' },
  { value: 'wo', label: 'Wolof' },
  { value: 'ar', label: 'Arabic' },
];

const BLUEPRINT_OPTIONS: Array<{
  value: BlueprintType;
  labelId: string;
  label: string;
  descriptionId: string;
  description: string;
}> = [
  {
    value: 'videoQuiz',
    labelId: 'wuti.authoring.wizard.blueprint.videoQuiz.label',
    label: 'Video + quiz',
    descriptionId: 'wuti.authoring.wizard.blueprint.videoQuiz.description',
    description: 'A guided path built around short videos followed by quick checks.',
  },
  {
    value: 'reading',
    labelId: 'wuti.authoring.wizard.blueprint.reading.label',
    label: 'Guided reading',
    descriptionId: 'wuti.authoring.wizard.blueprint.reading.description',
    description: 'A progression centered on reading, synthesis, and discussion.',
  },
  {
    value: 'project',
    labelId: 'wuti.authoring.wizard.blueprint.project.label',
    label: 'Guided project',
    descriptionId: 'wuti.authoring.wizard.blueprint.project.description',
    description: 'A learning path that leads to a concrete deliverable.',
  },
  {
    value: 'assessment',
    labelId: 'wuti.authoring.wizard.blueprint.assessment.label',
    label: 'Assessment preparation',
    descriptionId: 'wuti.authoring.wizard.blueprint.assessment.description',
    description: 'A structure focused on review, sample questions, and targeted practice.',
  },
  {
    value: 'corporate',
    labelId: 'wuti.authoring.wizard.blueprint.corporate.label',
    label: 'Internal training',
    descriptionId: 'wuti.authoring.wizard.blueprint.corporate.description',
    description: 'A short, paced format for workplace skill development.',
  },
];

const RECIPE_OPTIONS: Array<{
  value: RecipeType;
  labelId: string;
  label: string;
  description: string;
}> = [
  {
    value: 'read',
    labelId: 'wuti.authoring.wizard.recipe.read.label',
    label: 'Read',
    description: 'Explain a concept with text, examples, and visuals.',
  },
  {
    value: 'watch',
    labelId: 'wuti.authoring.wizard.recipe.watch.label',
    label: 'Watch',
    description: 'Introduce the topic with a video or demonstration.',
  },
  {
    value: 'practice',
    labelId: 'wuti.authoring.wizard.recipe.practice.label',
    label: 'Practice',
    description: 'Apply the concept through an exercise or hands-on task.',
  },
  {
    value: 'answer',
    labelId: 'wuti.authoring.wizard.recipe.answer.label',
    label: 'Answer',
    description: 'Check understanding with a quiz or open question.',
  },
  {
    value: 'discuss',
    labelId: 'wuti.authoring.wizard.recipe.discuss.label',
    label: 'Discuss',
    description: 'Invite learners to reflect together on a key point.',
  },
  {
    value: 'submit',
    labelId: 'wuti.authoring.wizard.recipe.submit.label',
    label: 'Submit work',
    description: 'Collect an assignment, project, or final deliverable.',
  },
];

function generateCourseNumber(org: string): string {
  const id = Math.floor(10000000 + Math.random() * 90000000);
  return `${org.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${id}`;
}

function removeDeprecatedCourseSetupFields() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);

      if (key && key.startsWith(COURSE_SETUP_STORAGE_PREFIX)) {
        const rawSetupMetadata = localStorage.getItem(key);

        if (rawSetupMetadata) {
          const setupMetadata = JSON.parse(rawSetupMetadata);

          if (setupMetadata && typeof setupMetadata === 'object' && !Array.isArray(setupMetadata)) {
            const hasDeprecatedFields = Object.prototype.hasOwnProperty.call(setupMetadata, 'audience')
              || Object.prototype.hasOwnProperty.call(setupMetadata, 'learningOutcome');

            if (hasDeprecatedFields) {
              delete setupMetadata.audience;
              delete setupMetadata.learningOutcome;
              localStorage.setItem(key, JSON.stringify(setupMetadata));
            }
          }
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to remove deprecated setup metadata:', error);
  }
}

function currentRun(): string {
  const d = new Date();
  return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function toIsoOrNull(localDateTime: string): string | null {
  if (!localDateTime) {
    return null;
  }
  const parsed = new Date(localDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function removeUnsetDateFields<T extends Record<string, unknown>>(details: T, dateUpdates: Record<string, string>) {
  const sanitizedDetails = { ...details };

  (['startDate', 'endDate', 'enrollmentStart', 'enrollmentEnd'] as const).forEach((field) => {
    if (!dateUpdates[field]) {
      delete sanitizedDetails[field];
    }
  });

  return sanitizedDetails;
}

function parseLocalDateTime(value: string): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function makeLocalId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanTitle(value: string, fallback: string): string {
  return value.trim() || fallback;
}

function buildActivity(title: string, recipe: RecipeType): OutlineActivity {
  return {
    id: makeLocalId('activity'),
    title,
    recipe,
  };
}

function buildLesson(title: string, activities: OutlineActivity[] = []): OutlineLesson {
  return {
    id: makeLocalId('lesson'),
    title,
    activities,
  };
}

function buildModule(title: string, lessons: OutlineLesson[] = []): OutlineModule {
  return {
    id: makeLocalId('module'),
    title,
    lessons,
  };
}

function extractTopicSeed(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'this topic';
  }
  return trimmed;
}

function buildTemplateOutline(blueprintType: BlueprintType, courseTitle: string): OutlineModule[] {
  const subject = extractTopicSeed(courseTitle);

  switch (blueprintType) {
    case 'videoQuiz':
      return [
        buildModule(`Discover ${subject}`, [
          buildLesson('Welcome and initial overview', [
            buildActivity('Introductory video', 'watch'),
            buildActivity('Check key concepts', 'answer'),
          ]),
          buildLesson('Core basics to remember', [
            buildActivity('Reference reading', 'read'),
            buildActivity('Quick quiz', 'answer'),
          ]),
        ]),
        buildModule(`Take action with ${subject}`, [
          buildLesson('Guided demonstration', [
            buildActivity('Step-by-step video', 'watch'),
            buildActivity('Practice task', 'practice'),
          ]),
          buildLesson('Consolidate learning', [
            buildActivity('Synthesis discussion', 'discuss'),
          ]),
        ]),
      ];
    case 'reading':
      return [
        buildModule(`Understand ${subject}`, [
          buildLesson('Context and definitions', [
            buildActivity('Main reading', 'read'),
          ]),
          buildLesson('Watch points', [
            buildActivity('Annotated reading', 'read'),
            buildActivity('Interpretation discussion', 'discuss'),
          ]),
        ]),
        buildModule(`Go deeper into ${subject}`, [
          buildLesson('Case study', [
            buildActivity('Guided reading', 'read'),
            buildActivity('Synthesis question', 'answer'),
          ]),
        ]),
      ];
    case 'project':
      return [
        buildModule(`Launch the ${subject} project`, [
          buildLesson('Goal and deliverable', [
            buildActivity('Project framing', 'read'),
            buildActivity('Reference example', 'watch'),
          ]),
        ]),
        buildModule('Build progressively', [
          buildLesson('First iteration', [
            buildActivity('Hands-on workshop', 'practice'),
          ]),
          buildLesson('Feedback and adjustments', [
            buildActivity('Group exchange', 'discuss'),
          ]),
        ]),
        buildModule('Deliver and evaluate', [
          buildLesson('Final submission', [
            buildActivity('Project submission', 'submit'),
          ]),
        ]),
      ];
    case 'assessment':
      return [
        buildModule(`Review ${subject}`, [
          buildLesson('Essential reminders', [
            buildActivity('Concept summary', 'read'),
            buildActivity('Sample questions', 'answer'),
          ]),
        ]),
        buildModule('Train', [
          buildLesson('Exercise series', [
            buildActivity('Timed practice', 'practice'),
          ]),
          buildLesson('Annotated correction', [
            buildActivity('Group debrief', 'discuss'),
          ]),
        ]),
      ];
    case 'corporate':
      return [
        buildModule(`Why ${subject} matters`, [
          buildLesson('Business context', [
            buildActivity('Short video', 'watch'),
            buildActivity('Internal policy reading', 'read'),
          ]),
        ]),
        buildModule('Apply the best practice', [
          buildLesson('Scenario', [
            buildActivity('Validation exercise', 'practice'),
            buildActivity('Understanding check', 'answer'),
          ]),
        ]),
      ];
    default:
      return [];
  }
}

function buildAiOutline(sourcePrompt: string, variant: number): OutlineModule[] {
  const topic = extractTopicSeed(sourcePrompt);
  const variantIndex = variant % 3;

  if (variantIndex === 0) {
    return [
      buildModule(`Foundations of ${topic}`, [
        buildLesson('Understand the basics', [
          buildActivity('Framing reading', 'read'),
          buildActivity('Placement quiz', 'answer'),
        ]),
      ]),
      buildModule(`Use ${topic} in a simple case`, [
        buildLesson('Guided demonstration', [
          buildActivity('Example video', 'watch'),
          buildActivity('Application exercise', 'practice'),
        ]),
      ]),
      buildModule(`Consolidate ${topic}`, [
        buildLesson('Synthesis and next steps', [
          buildActivity('Closing discussion', 'discuss'),
        ]),
      ]),
    ];
  }

  if (variantIndex === 1) {
    return [
      buildModule(`Get started with ${topic}`, [
        buildLesson('Vocabulary and landmarks', [
          buildActivity('Introductory reading', 'read'),
        ]),
        buildLesson('First understanding check', [
          buildActivity('Diagnostic quiz', 'answer'),
        ]),
      ]),
      buildModule(`Put ${topic} into practice`, [
        buildLesson('Guided scenario', [
          buildActivity('Practical workshop', 'practice'),
          buildActivity('Group debrief', 'discuss'),
        ]),
      ]),
    ];
  }

  return [
    buildModule(`Explore ${topic}`, [
      buildLesson('Topic overview', [
        buildActivity('Context video', 'watch'),
        buildActivity('Additional reading', 'read'),
      ]),
    ]),
    buildModule('Take action', [
      buildLesson('First implementation', [
        buildActivity('Practical case', 'practice'),
      ]),
      buildLesson('Final evaluation', [
        buildActivity('Work to submit', 'submit'),
      ]),
    ]),
  ];
}

function buildOutlineDraft(data: WizardData, generationRound: number): OutlineModule[] {
  if (data.creationStrategy === 'template') {
    return buildTemplateOutline(data.blueprintType, data.displayName);
  }

  if (data.creationStrategy === 'ai') {
    return buildAiOutline(data.topicPrompt.trim() || data.displayName, generationRound);
  }

  return [];
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function resolveCreatedCourseKey(redirectData: unknown): string {
  const response = redirectData as {
    courseKey?: string;
    course_key?: string;
    destinationCourseKey?: string;
    url?: string;
  };

  const explicitCourseKey = response?.destinationCourseKey || response?.courseKey || response?.course_key;
  if (explicitCourseKey) {
    return explicitCourseKey;
  }

  const courseUrl = response?.url || '';
  const match = courseUrl.match(/course-v1:[^/?#]+/);
  return match?.[0] || '';
}

async function resolveCourseUsageKey(courseId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const outlineIndex: any = await getCourseOutlineIndex(courseId);
      if (outlineIndex?.courseStructure?.id) {
        return outlineIndex.courseStructure.id;
      }
    } catch (error) {
      // Retry below; course shell can take a short moment to become queryable.
    }

    // eslint-disable-next-line no-await-in-loop
    await wait(350 * (attempt + 1));
  }

  return null;
}

async function safeCreateCourseXblock(payload: Record<string, unknown>) {
  try {
    await createCourseXblock(payload as any);
  } catch (error) {
    // Non-blocking scaffolding; the author can still complete the unit manually.
    // eslint-disable-next-line no-console
    console.error('Unable to scaffold unit activity:', error);
  }
}

/* eslint-disable no-await-in-loop, no-continue */
async function scaffoldActivityPage(unitLocator: string, activity: OutlineActivity) {
  switch (activity.recipe) {
    case 'read':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.html,
        boilerplate: COMPONENT_TYPES.html,
        displayName: 'Main text',
        parentLocator: unitLocator,
      });
      break;
    case 'watch':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.video,
        displayName: 'Video',
        parentLocator: unitLocator,
      });
      break;
    case 'practice':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.html,
        boilerplate: COMPONENT_TYPES.html,
        displayName: 'Instructions',
        parentLocator: unitLocator,
      });
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.problem,
        displayName: 'Exercise',
        parentLocator: unitLocator,
      });
      break;
    case 'answer':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.problem,
        displayName: 'Question',
        parentLocator: unitLocator,
      });
      break;
    case 'discuss':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.discussion,
        displayName: 'Discussion',
        parentLocator: unitLocator,
      });
      break;
    case 'submit':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.html,
        boilerplate: COMPONENT_TYPES.html,
        displayName: 'Brief',
        parentLocator: unitLocator,
      });
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.openassessment,
        category: COMPONENT_TYPES.openassessment,
        boilerplate: 'peer-assessment',
        displayName: 'Work to submit',
        parentLocator: unitLocator,
      });
      break;
    default:
      break;
  }
}

async function provisionOutlineDraft(courseId: string, outlineDraft: OutlineModule[]) {
  if (!outlineDraft.length) {
    return;
  }

  const courseUsageKey = await resolveCourseUsageKey(courseId);
  if (!courseUsageKey) {
    throw new Error(`Course outline was not ready for ${courseId}.`);
  }

  for (const moduleItem of outlineDraft) {
    const sectionResult: any = await createCourseXblock({
      parentLocator: courseUsageKey,
      type: 'chapter',
      displayName: cleanTitle(moduleItem.title, 'New module'),
    });
    const sectionLocator = sectionResult?.locator;

    if (!sectionLocator) {
      continue;
    }

    for (const lessonItem of moduleItem.lessons) {
      const subsectionResult: any = await createCourseXblock({
        parentLocator: sectionLocator,
        type: 'sequential',
        displayName: cleanTitle(lessonItem.title, 'New lesson'),
      });
      const subsectionLocator = subsectionResult?.locator;

      if (!subsectionLocator) {
        continue;
      }

      for (const activityItem of lessonItem.activities) {
        const unitResult: any = await createCourseXblock({
          parentLocator: subsectionLocator,
          type: 'vertical',
          displayName: cleanTitle(activityItem.title, 'New activity page'),
        });
        const unitLocator = unitResult?.locator;

        if (unitLocator) {
          await scaffoldActivityPage(unitLocator, activityItem);
        }
      }
    }
  }
}

/* eslint-enable no-await-in-loop, no-continue */

async function pollGenerationStructure(jobId: string): Promise<CoursePlanStructure | null> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const job = await getCourseGenerationJob(jobId);

    if (job?.status === 'completed') {
      return job.structure || job.structure_summary || null;
    }

    if (job?.status === 'failed' || job?.status === 'cancelled') {
      throw new Error(job.error_message || 'AI generation failed.');
    }

    // eslint-disable-next-line no-await-in-loop
    await wait(1500);
  }

  throw new Error(
    'AI generation is taking too long. The course was created, but the AI plan has not been applied yet.',
  );
}

const CreateCourseWizard = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useCallback((
    id: string,
    defaultMessage: string,
    values?: Record<string, string | number | boolean | null | undefined>,
  ) => intl.formatMessage({ id, defaultMessage }, values), [intl]);
  const getLanguageLabel = useCallback((language: string) => {
    const labels: Record<string, string> = {
      fr: t('wuti.authoring.wizard.languageFrench', 'French'),
      en: t('wuti.authoring.wizard.languageEnglish', 'English'),
      wo: t('wuti.authoring.wizard.languageWolof', 'Wolof'),
      ar: t('wuti.authoring.wizard.languageArabic', 'Arabic'),
    };

    return labels[language] || language;
  }, [t]);

  const allOrganizations: string[] = useSelector(getOrganizations) ?? [];
  const studioHomeData = useSelector(getStudioHomeData) || {};
  const {
    canCreateOrganizations = false,
    allowedOrganizations = [],
  } = studioHomeData as {
    canCreateOrganizations?: boolean;
    allowedOrganizations?: string[];
  };
  const rawOrganizations: string[] = useMemo(() => {
    const fetchedOrganizations = allOrganizations ?? [];
    const permissionOrganizations = allowedOrganizations ?? [];

    if (canCreateOrganizations) {
      return fetchedOrganizations.length > 0 ? fetchedOrganizations : permissionOrganizations;
    }

    return permissionOrganizations.length > 0 ? permissionOrganizations : fetchedOrganizations;
  }, [allOrganizations, allowedOrganizations, canCreateOrganizations]);
  const organizations: string[] = useMemo(
    () => Array.from(new Set(rawOrganizations.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rawOrganizations],
  );

  const savingStatus = useSelector(getSavingStatus);
  const redirectUrlObj = useSelector(getRedirectUrlObj);
  const postErrors = useSelector(getPostErrors);

  const [step, setStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [generationRound, setGenerationRound] = useState(0);
  const [data, setData] = useState<WizardData>({
    displayName: '',
    org: '',
    number: '',
    run: currentRun(),
    shortDescription: '',
    language: 'fr',
    overviewHtml: '',
    courseStart: '',
    courseEnd: '',
    enrollmentStart: '',
    enrollmentEnd: '',
    pacing: '',
    prerequisiteMode: 'none',
    prerequisiteCourse: '',
    priceMode: '',
    paidPrice: '',
    currency: 'XOF',
    creationStrategy: '',
    templateId: '',
    blueprintType: '',
    topicPrompt: '',
  });

  const [outlineDraft, setOutlineDraft] = useState<OutlineModule[]>([]);
  const [planDraft, setPlanDraft] = useState<CoursePlanDraft>(createScratchPlanDraft('', 'fr'));
  const [coursePlanTemplates, setCoursePlanTemplates] = useState<CoursePlanTemplateSummary[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [touched, setTouched] = useState<Partial<Record<keyof WizardData, boolean>>>({});
  const [calendarErrors, setCalendarErrors] = useState<CalendarErrors>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailError, setThumbnailError] = useState('');
  const [overviewPreviewMode, setOverviewPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const overviewTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    removeDeprecatedCourseSetupFields();
  }, []);

  useEffect(() => {
    dispatch(fetchOrganizationsQuery() as any);
  }, [dispatch]);

  useEffect(() => {
    if (!data.org && organizations.length === 1) {
      const onlyOrg = organizations[0];
      setData((prev) => ({
        ...prev,
        org: onlyOrg,
        number: generateCourseNumber(onlyOrg),
      }));
    }
  }, [organizations, data.org]);

  useEffect(() => {
    if (!data.org) {
      setCoursePlanTemplates([]);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingTemplates(true);
    setTemplateError('');

    getCoursePlanTemplates({ org: data.org })
      .then((templates) => {
        if (isMounted) {
          setCoursePlanTemplates(templates);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setCoursePlanTemplates([]);
          setTemplateError(error?.message || t(
            'wuti.authoring.wizard.templateLoadError',
            'Unable to load plan templates.',
          ));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTemplates(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [data.org, t]);

  useEffect(() => () => {
    if (thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
  }, [thumbnailPreview]);

  const persistCourseSetup = useCallback(async (courseId: string) => {
    try {
      const setupMetadata = {
        startingPoint: {
          strategy: data.creationStrategy,
          templateId: data.templateId || null,
          blueprintType: data.blueprintType || null,
          topicPrompt: data.topicPrompt.trim(),
        },
        coursePlanDraft: planDraft,
        outlineDraft,
        pricing: {
          mode: data.priceMode,
          currency: data.currency,
          amount: data.priceMode === 'paid' ? Number(data.paidPrice) : 0,
          certificateEnabled: true,
          provider: 'openedx-zeitlabs-payments',
        },
      };

      localStorage.setItem(`${COURSE_SETUP_STORAGE_PREFIX}${courseId}`, JSON.stringify(setupMetadata));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to persist setup metadata:', error);
    }

    let uploadedCourseImagePath = '';
    let uploadedCourseImageName = '';

    if (thumbnailFile) {
      try {
        const fileData = new FormData();
        fileData.append('file', thumbnailFile);
        const uploadResponse: any = await uploadAssets(courseId, fileData);
        const uploadedAssetUrl = uploadResponse?.asset?.url;
        const uploadedAssetName = uploadResponse?.asset?.displayName;

        if (uploadedAssetUrl) {
          uploadedCourseImagePath = uploadedAssetUrl;
          uploadedCourseImageName = uploadedAssetName || uploadedAssetUrl.split('block@').pop() || thumbnailFile.name;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unable to upload thumbnail:', error);
      }
    }

    try {
      const currentCourseDetails: any = await getCourseDetails(courseId);
      const dateUpdates: Record<string, string> = {};
      const courseStart = toIsoOrNull(data.courseStart);
      const courseEnd = toIsoOrNull(data.courseEnd);
      const enrollmentStart = toIsoOrNull(data.enrollmentStart);
      const enrollmentEnd = toIsoOrNull(data.enrollmentEnd);

      if (courseStart) {
        dateUpdates.startDate = courseStart;
      }
      if (courseEnd) {
        dateUpdates.endDate = courseEnd;
      }
      if (enrollmentStart) {
        dateUpdates.enrollmentStart = enrollmentStart;
      }
      if (enrollmentEnd) {
        dateUpdates.enrollmentEnd = enrollmentEnd;
      }

      const mergedCourseDetails = removeUnsetDateFields({
        ...currentCourseDetails,
        shortDescription: data.shortDescription.trim(),
        language: data.language,
        overview: data.overviewHtml.trim(),
        selfPaced: data.pacing === 'self',
        preRequisiteCourses: data.prerequisiteMode === 'required' && data.prerequisiteCourse.trim()
          ? [data.prerequisiteCourse.trim()]
          : [],
        ...dateUpdates,
        ...(uploadedCourseImagePath ? {
          courseImageAssetPath: uploadedCourseImagePath,
          courseImageName: uploadedCourseImageName,
        } : {}),
      }, dateUpdates);

      await updateCourseDetails(courseId, mergedCourseDetails);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to sync initial course details:', error);
    }

    try {
      if (data.creationStrategy === 'ai') {
        const job = await createCourseGenerationJob(courseId, {
          instructions: data.topicPrompt.trim(),
          sourceText: data.topicPrompt.trim() || data.displayName.trim(),
          filePaths: [],
        });
        const generatedStructure = await pollGenerationStructure(job.id);
        if (generatedStructure?.sections?.length) {
          const hydratedStructure = hydratePlanStructure(generatedStructure, data.displayName.trim(), data.language);
          await applyCoursePlanToCourse(courseId, hydratedStructure, 'append');
        }
      } else if (data.creationStrategy === 'template' && planDraft.structure.sections.length > 0) {
        const hydratedStructure = hydratePlanStructure(planDraft.structure, data.displayName.trim(), data.language);
        await applyCoursePlanToCourse(courseId, hydratedStructure, 'append');
      } else {
        await provisionOutlineDraft(courseId, outlineDraft);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to provision the initial course plan:', error);
      throw error;
    }
  }, [
    data.blueprintType,
    data.courseEnd,
    data.courseStart,
    data.creationStrategy,
    data.currency,
    data.enrollmentEnd,
    data.enrollmentStart,
    data.language,
    data.overviewHtml,
    data.pacing,
    data.paidPrice,
    data.priceMode,
    data.prerequisiteCourse,
    data.prerequisiteMode,
    data.shortDescription,
    data.templateId,
    data.topicPrompt,
    outlineDraft,
    planDraft,
    thumbnailFile,
  ]);

  useEffect(() => {
    if (savingStatus === RequestStatus.SUCCESSFUL) {
      const { url, destinationCourseKey } = redirectUrlObj as any;
      const createdCourseKey = resolveCreatedCourseKey(redirectUrlObj);
      dispatch(updateSavingStatus({ status: '' }));

      if (!url) {
        setIsSubmitting(false);
        setIsFinalizing(false);
        return;
      }

      const destination = destinationCourseKey ? `${url}${destinationCourseKey}` : url;

      const finalizeSetupAndNavigate = async () => {
        setIsFinalizing(true);
        try {
          if (createdCourseKey) {
            await persistCourseSetup(createdCourseKey);
          } else {
            // eslint-disable-next-line no-console
            console.error('Unable to resolve created course key from create response:', redirectUrlObj);
          }
          setIsFinalizing(false);
          setIsSubmitting(false);
          navigate(destination);
        } catch (error: any) {
          setIsFinalizing(false);
          setIsSubmitting(false);
          dispatch(updatePostErrors({
            errMsg: error?.message || t(
              'wuti.authoring.wizard.coursePlanApplyError',
              'The course was created, but the selected course plan could not be applied.',
            ),
          }));
        }
      };

      finalizeSetupAndNavigate();
    } else if (savingStatus === RequestStatus.FAILED) {
      dispatch(updateSavingStatus({ status: '' }));
      setIsSubmitting(false);
      setIsFinalizing(false);
    }
  }, [dispatch, navigate, persistCourseSetup, redirectUrlObj, savingStatus, t]);

  const goToStep = useCallback((next: number) => {
    setStep(next);
    setAnimKey((k) => k + 1);
  }, []);

  const handleBack = () => {
    if (step > 1) {
      goToStep(step - 1);
    } else {
      navigate('/home');
    }
  };

  const setField = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleOrgChange = (org: string) => {
    setData((prev) => ({
      ...prev,
      org,
      number: org ? generateCourseNumber(org) : '',
      run: currentRun(),
    }));
    setTouched((prev) => ({ ...prev, org: true }));
  };

  const handleStrategyChange = (strategy: CreationStrategy) => {
    setData((prev) => ({
      ...prev,
      creationStrategy: strategy,
      templateId: strategy === 'template' ? prev.templateId : '',
      blueprintType: strategy === 'template' ? prev.blueprintType : '',
      topicPrompt: strategy === 'ai'
        ? (prev.topicPrompt || prev.displayName || prev.shortDescription)
        : prev.topicPrompt,
    }));
    setTouched((prev) => ({ ...prev, creationStrategy: true }));

    if (strategy === 'scratch') {
      setPlanDraft(createScratchPlanDraft(data.displayName, data.language));
    } else if (strategy === 'ai') {
      setPlanDraft(createPlanDraftFromStructure(
        'ai',
        createEmptyPlanStructure(data.displayName, data.language),
        data.displayName,
        data.language,
      ));
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setData((prev) => ({
      ...prev,
      templateId,
      creationStrategy: 'template',
    }));
    setTouched((prev) => ({ ...prev, creationStrategy: true, templateId: true }));
    setTemplateError('');

    try {
      const template = await getCoursePlanTemplate(templateId);
      setPlanDraft(createPlanDraftFromStructure(
        'template',
        template.structure,
        data.displayName,
        data.language,
        { templateId },
      ));
    } catch (error: any) {
      setTemplateError(error?.message || t(
        'wuti.authoring.wizard.templateSelectError',
        'Unable to load this template.',
      ));
      setPlanDraft(createPlanDraftFromStructure(
        'template',
        createEmptyPlanStructure(data.displayName, data.language),
        data.displayName,
        data.language,
        { templateId },
      ));
    }
  };

  const handleThumbnailFile = (file?: File) => {
    if (!file) {
      return;
    }

    if (!THUMBNAIL_MIME_TYPES.includes(file.type)) {
      setThumbnailError(t(
        'wuti.authoring.wizard.thumbnailTypeError',
        'File must be a PNG or JPG image.',
      ));
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setThumbnailError(t(
        'wuti.authoring.wizard.thumbnailSizeError',
        'Maximum allowed size is 2MB.',
      ));
      return;
    }

    setThumbnailError('');
    setThumbnailFile(file);

    if (thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    setThumbnailPreview(URL.createObjectURL(file));
  };

  const getCalendarErrors = useCallback((): CalendarErrors => {
    const nextErrors: CalendarErrors = {};

    const courseStart = parseLocalDateTime(data.courseStart);
    const courseEnd = parseLocalDateTime(data.courseEnd);
    const enrollmentStart = parseLocalDateTime(data.enrollmentStart);
    const enrollmentEnd = parseLocalDateTime(data.enrollmentEnd);

    if ((data.courseStart && !data.courseEnd) || (!data.courseStart && data.courseEnd)) {
      nextErrors.courseRange = t(
        'wuti.authoring.wizard.courseRangeRequired',
        'Enter both course start and end dates.',
      );
    }

    if ((data.enrollmentStart && !data.enrollmentEnd) || (!data.enrollmentStart && data.enrollmentEnd)) {
      nextErrors.enrollmentRange = t(
        'wuti.authoring.wizard.enrollmentRangeRequired',
        'Enter both enrollment start and end dates.',
      );
    }

    if (courseStart && courseEnd && courseStart >= courseEnd) {
      nextErrors.courseRange = t(
        'wuti.authoring.wizard.courseEndAfterStart',
        'Course end date must be after the start date.',
      );
    }

    if (enrollmentStart && enrollmentEnd && enrollmentStart >= enrollmentEnd) {
      nextErrors.enrollmentRange = t(
        'wuti.authoring.wizard.enrollmentEndAfterStart',
        'Enrollment end date must be after the start date.',
      );
    }

    if (courseStart && enrollmentStart && enrollmentStart > courseStart) {
      nextErrors.enrollmentRange = t(
        'wuti.authoring.wizard.enrollmentBeforeCourseStart',
        'Enrollment start date must be before the course starts.',
      );
    }

    if (courseEnd && enrollmentEnd && enrollmentEnd > courseEnd) {
      nextErrors.enrollmentRange = t(
        'wuti.authoring.wizard.enrollmentBeforeCourseEnd',
        'Enrollment end date must be before the course ends.',
      );
    }

    return nextErrors;
  }, [
    data.courseEnd,
    data.courseStart,
    data.enrollmentEnd,
    data.enrollmentStart,
    t,
  ]);

  const validateCalendarStep = () => {
    const nextErrors = getCalendarErrors();
    setCalendarErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const wrapOverviewSelection = (before: string, after: string) => {
    const textarea = overviewTextareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentValue = data.overviewHtml;
    const selectedText = currentValue.slice(start, end) || t('wuti.authoring.wizard.selectedTextFallback', 'text');
    const replacement = `${before}${selectedText}${after}`;

    const updated = `${currentValue.slice(0, start)}${replacement}${currentValue.slice(end)}`;
    setData((prev) => ({ ...prev, overviewHtml: updated }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  };

  const insertListTemplate = () => {
    const textarea = overviewTextareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentValue = data.overviewHtml;
    const selectedText = currentValue.slice(start, end) || t('wuti.authoring.wizard.listItemFallback', 'Item');
    const replacement = `<ul>\n  <li>${selectedText}</li>\n</ul>`;

    const updated = `${currentValue.slice(0, start)}${replacement}${currentValue.slice(end)}`;
    setData((prev) => ({ ...prev, overviewHtml: updated }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  };

  const regenerateOutline = () => {
    setGenerationRound((prev) => {
      const next = prev + 1;
      setOutlineDraft(buildOutlineDraft(data, next));
      return next;
    });
  };

  const generateOutlineAndContinue = () => {
    const nextDraft = buildOutlineDraft(data, generationRound);
    setOutlineDraft(nextDraft);
    goToStep(3);
  };

  const updateModuleTitle = (moduleId: string, title: string) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id === moduleId
        ? { ...moduleItem, title }
        : moduleItem
    )));
  };

  const updateLessonTitle = (moduleId: string, lessonId: string, title: string) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson) => (
            lesson.id === lessonId ? { ...lesson, title } : lesson
          )),
        }
    )));
  };

  const updateActivityTitle = (
    moduleId: string,
    lessonId: string,
    activityId: string,
    title: string,
  ) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson) => (
            lesson.id !== lessonId
              ? lesson
              : {
                ...lesson,
                activities: lesson.activities.map((activity) => (
                  activity.id === activityId ? { ...activity, title } : activity
                )),
              }
          )),
        }
    )));
  };

  const updateActivityRecipe = (
    moduleId: string,
    lessonId: string,
    activityId: string,
    recipe: RecipeType,
  ) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson) => (
            lesson.id !== lessonId
              ? lesson
              : {
                ...lesson,
                activities: lesson.activities.map((activity) => (
                  activity.id === activityId ? { ...activity, recipe } : activity
                )),
              }
          )),
        }
    )));
  };

  const addModuleToDraft = () => {
    setOutlineDraft((prev) => [
      ...prev,
      buildModule(`Module ${prev.length + 1}`, [
        buildLesson(t('wuti.authoring.wizard.defaultFirstLesson', 'Lesson 1')),
      ]),
    ]);
  };

  const removeModuleFromDraft = (moduleId: string) => {
    setOutlineDraft((prev) => prev.filter((moduleItem) => moduleItem.id !== moduleId));
  };

  const addLessonToDraft = (moduleId: string) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: [
            ...moduleItem.lessons,
            buildLesson(t('wuti.authoring.wizard.defaultLessonWithIndex', 'Lesson {index}', {
              index: moduleItem.lessons.length + 1,
            })),
          ],
        }
    )));
  };

  const removeLessonFromDraft = (moduleId: string, lessonId: string) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: moduleItem.lessons.filter((lesson) => lesson.id !== lessonId),
        }
    )));
  };

  const addActivityToDraft = (moduleId: string, lessonId: string) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson) => (
            lesson.id !== lessonId
              ? lesson
              : {
                ...lesson,
                activities: [
                  ...lesson.activities,
                  buildActivity(t('wuti.authoring.wizard.defaultActivityWithIndex', 'Activity {index}', {
                    index: lesson.activities.length + 1,
                  }), 'read'),
                ],
              }
          )),
        }
    )));
  };

  const removeActivityFromDraft = (moduleId: string, lessonId: string, activityId: string) => {
    setOutlineDraft((prev) => prev.map((moduleItem) => (
      moduleItem.id !== moduleId
        ? moduleItem
        : {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson) => (
            lesson.id !== lessonId
              ? lesson
              : {
                ...lesson,
                activities: lesson.activities.filter((activity) => activity.id !== activityId),
              }
          )),
        }
    )));
  };

  const aiPromptSeed = data.topicPrompt.trim() || data.displayName.trim() || data.shortDescription.trim();

  const courseBasicsValid = data.displayName.trim() !== ''
    && data.org.trim() !== ''
    && data.language.trim() !== ''
    && data.shortDescription.trim() !== '';

  const startingPointValid = (
    data.creationStrategy === 'template'
    && data.templateId !== ''
    && planDraft.structure.sections.length > 0
  ) || (
    data.creationStrategy === 'ai'
    && aiPromptSeed !== ''
  ) || (
    data.creationStrategy === 'scratch'
  );

  const outlineReviewValid = data.creationStrategy === 'scratch'
    || data.creationStrategy === 'ai'
    || planDraft.structure.sections.length > 0;
  const mediaAndDescriptionValid = Boolean(thumbnailPreview) && data.overviewHtml.trim().length > 0;
  const calendarValid = useMemo(
    () => Object.keys(getCalendarErrors()).length === 0,
    [getCalendarErrors],
  );

  const pacingValid = data.pacing !== ''
    && (data.prerequisiteMode !== 'required' || data.prerequisiteCourse.trim() !== '');

  const pricingValid = data.priceMode === 'free';
  const submitButtonLabel = useMemo(() => {
    if (!isSubmitting) {
      return t('wuti.authoring.wizard.createCourse', 'Create course');
    }

    return isFinalizing
      ? t('wuti.authoring.wizard.preparingPlan', 'Preparing plan...')
      : t('wuti.authoring.wizard.creatingCourse', 'Creating course...');
  }, [isFinalizing, isSubmitting, t]);
  const referencePreview = data.org ? data.number : '';
  const runPreview = data.run;

  const handleSubmit = () => {
    setTouched((prev) => ({
      ...prev,
      displayName: true,
      org: true,
      shortDescription: true,
      creationStrategy: true,
      templateId: true,
      blueprintType: true,
      topicPrompt: true,
      pacing: true,
      priceMode: true,
      paidPrice: true,
      prerequisiteCourse: true,
    }));

    if (
      !courseBasicsValid
      || !startingPointValid
      || !outlineReviewValid
      || !calendarValid
      || !pacingValid
      || !pricingValid
    ) {
      return;
    }

    setIsSubmitting(true);
    dispatch(updatePostErrors({}));
    dispatch(updateCreateOrRerunCourseQuery({
      displayName: data.displayName.trim(),
      org: data.org,
      number: data.number || generateCourseNumber(data.org),
      run: data.run || currentRun(),
      isCreateNewCourse: true,
    }) as any);
  };

  const hasApiError = !!(postErrors as any)?.errMsg;

  return (
    <div className="ws-wizard">
      <main className="ws-wizard__body">
        <header className="ws-wizard__header">
          <button type="button" className="ws-wizard__back-btn" onClick={handleBack}>
            <Icon src={ArrowLeft} />
            {t('wuti.authoring.wizard.back', 'Back')}
          </button>

          <div className="ws-wizard__progress">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const currentStep = i + 1;
              let modifier = 'future';
              if (currentStep < step) {
                modifier = 'past';
              } else if (currentStep === step) {
                modifier = 'active';
              }
              return (
                <span
                  key={currentStep}
                  className={`ws-wizard__dot ws-wizard__dot--${modifier}`}
                />
              );
            })}
          </div>

          <span className="ws-wizard__step-indicator">
            {t('wuti.authoring.wizard.stepIndicator', 'Step {step} of {total}', {
              step,
              total: TOTAL_STEPS,
            })}
          </span>
        </header>

        <div className="ws-wizard__card">
          <div key={animKey} className="ws-wizard__step-content">
            {step === 1 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.basicsTitle', 'Define the course')}</h1>

                <div className="ws-wizard__field-group">
                  <div className="ws-wizard__field">
                    <label className="ws-wizard__label" htmlFor="ww-name">
                      {t('wuti.authoring.wizard.courseName', 'Course name')}
                    </label>
                    <input
                      id="ww-name"
                      className={`ws-wizard__input${touched.displayName && !data.displayName ? ' ws-wizard__input--error' : ''}`}
                      type="text"
                      placeholder={t('wuti.authoring.wizard.courseNamePlaceholder', 'e.g. Introduction to Machine Learning')}
                      value={data.displayName}
                      onChange={(event) => setField('displayName', event.target.value)}
                    />
                    {touched.displayName && !data.displayName && (
                      <span className="ws-wizard__field-error">
                        {t('wuti.authoring.wizard.courseNameRequired', 'Course name is required.')}
                      </span>
                    )}
                  </div>

                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-org">
                        {t('wuti.authoring.wizard.organization', 'Organization')}
                      </label>
                      <select
                        id="ww-org"
                        className={`ws-wizard__select${touched.org && !data.org ? ' ws-wizard__input--error' : ''}`}
                        value={data.org}
                        onChange={(event) => handleOrgChange(event.target.value)}
                        disabled={organizations.length === 0}
                      >
                        <option value="" disabled>
                          {organizations.length > 0
                            ? t('wuti.authoring.wizard.selectOrganization', 'Select an organization')
                            : t('wuti.authoring.wizard.noOrganizations', 'No organizations available')}
                        </option>
                        {organizations.map((orgValue) => (
                          <option key={orgValue} value={orgValue}>{orgValue}</option>
                        ))}
                      </select>
                      {touched.org && !data.org && (
                        <span className="ws-wizard__field-error">
                          {t('wuti.authoring.wizard.organizationRequired', 'Organization is required.')}
                        </span>
                      )}
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-language">
                        {t('wuti.authoring.wizard.courseLanguage', 'Course language')}
                      </label>
                      <select
                        id="ww-language"
                        className="ws-wizard__select"
                        value={data.language}
                        onChange={(event) => setField('language', event.target.value)}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{getLanguageLabel(option.value)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ws-wizard__field">
                    <label className="ws-wizard__label" htmlFor="ww-short-description">
                      {t('wuti.authoring.wizard.shortDescription', 'Short description')}
                      <span className="ws-wizard__label-hint">
                        {t('wuti.authoring.wizard.maxCharacters', 'Max {count} characters', { count: 150 })}
                      </span>
                    </label>
                    <textarea
                      id="ww-short-description"
                      className={`ws-wizard__textarea${touched.shortDescription && !data.shortDescription ? ' ws-wizard__input--error' : ''}`}
                      placeholder={t('wuti.authoring.wizard.shortDescriptionPlaceholder', 'A clear one-line course description for the catalog.')}
                      value={data.shortDescription}
                      maxLength={150}
                      onChange={(event) => setField('shortDescription', event.target.value)}
                    />
                    {touched.shortDescription && !data.shortDescription && (
                      <span className="ws-wizard__field-error">
                        {t('wuti.authoring.wizard.shortDescriptionRequired', 'Short description is required.')}
                      </span>
                    )}
                  </div>

                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-reference">
                        {t('wuti.authoring.wizard.reference', 'Reference')}
                      </label>
                      <input
                        id="ww-reference"
                        className="ws-wizard__input ws-wizard__input--readonly"
                        type="text"
                        value={referencePreview}
                        placeholder={t('wuti.authoring.wizard.referencePlaceholder', 'Generated after organization selection')}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-run">
                        {t('wuti.authoring.wizard.session', 'Session')}
                      </label>
                      <input
                        id="ww-run"
                        className="ws-wizard__input ws-wizard__input--readonly"
                        type="text"
                        value={runPreview}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>
                  </div>

                </div>

                <div className="ws-wizard__footer">
                  <span />
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    disabled={!courseBasicsValid}
                    onClick={() => {
                      setTouched((prev) => ({
                        ...prev,
                        displayName: true,
                        org: true,
                        shortDescription: true,
                      }));
                      if (courseBasicsValid) {
                        goToStep(2);
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.continue', 'Continue')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 70 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.startingPointTitle', 'Choose a starting point')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.startingPointSubtitle', 'Select how the first course plan should be prepared.')}
                </p>

                <div className="ws-wizard__strategy-grid ws-wizard__strategy-grid--three">
                  {[
                    {
                      value: 'template' as CreationStrategy,
                      title: t('wuti.authoring.wizard.fromTemplateLegacy', 'Start from a template'),
                      description: t('wuti.authoring.wizard.fromTemplateLegacyDescription', 'Use a predefined teaching structure adapted to a use case.'),
                    },
                    {
                      value: 'ai' as CreationStrategy,
                      title: t('wuti.authoring.wizard.generateFromTopic', 'Generate from topic'),
                      description: t('wuti.authoring.wizard.generateFromTopicDescription', 'Produce a draft of modules, lessons, and activities from your context.'),
                    },
                    {
                      value: 'scratch' as CreationStrategy,
                      title: t('wuti.authoring.wizard.startEmpty', 'Start empty'),
                      description: t('wuti.authoring.wizard.startEmptyDescription', 'Create a course without an imposed structure and build it later in the outline.'),
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`ws-wizard__strategy-card${data.creationStrategy === option.value ? ' ws-wizard__strategy-card--selected' : ''}`}
                      onClick={() => handleStrategyChange(option.value)}
                    >
                      <div className="ws-wizard__strategy-header">
                        <p className="ws-wizard__strategy-title">{option.title}</p>
                      </div>
                      <p className="ws-wizard__strategy-description">{option.description}</p>
                    </button>
                  ))}
                </div>

                {data.creationStrategy === 'template' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">
                        {t('wuti.authoring.wizard.choosePedagogicalTemplate', 'Choose a teaching template')}
                      </p>
                      <p className="ws-wizard__nested-panel-copy">
                        {t('wuti.authoring.wizard.choosePedagogicalTemplateCopy', 'The template creates an editable draft before course creation.')}
                      </p>
                    </div>

                    <div className="ws-wizard__blueprint-grid">
                      {BLUEPRINT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`ws-wizard__blueprint-card${data.blueprintType === option.value ? ' ws-wizard__blueprint-card--selected' : ''}`}
                          onClick={() => setField('blueprintType', option.value)}
                        >
                          <p className="ws-wizard__blueprint-title">{t(option.labelId, option.label)}</p>
                          <p className="ws-wizard__blueprint-description">
                            {t(option.descriptionId, option.description)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {data.creationStrategy === 'ai' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">
                        {t('wuti.authoring.wizard.generationIntentTitle', 'Generation topic or intent')}
                      </p>
                      <p className="ws-wizard__nested-panel-copy">
                        {t('wuti.authoring.wizard.generationIntentCopy', 'The proposed draft will remain editable before being applied to the course.')}
                      </p>
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-topic-prompt">
                        {t('wuti.authoring.wizard.initialPrompt', 'Starting prompt')}
                      </label>
                      <textarea
                        id="ww-topic-prompt"
                        className={`ws-wizard__textarea${touched.topicPrompt && !aiPromptSeed ? ' ws-wizard__input--error' : ''}`}
                        placeholder={t('wuti.authoring.wizard.initialPromptPlaceholder', 'e.g. Introduction to Python for beginners with a focus on practice.')}
                        value={data.topicPrompt}
                        onChange={(event) => setField('topicPrompt', event.target.value)}
                      />
                      {touched.topicPrompt && !aiPromptSeed && (
                        <span className="ws-wizard__field-error">
                          {t('wuti.authoring.wizard.promptRequired', 'Add a topic or objective to generate a plan.')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {data.creationStrategy === 'scratch' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">
                        {t('wuti.authoring.wizard.freeCreationTitle', 'Free creation')}
                      </p>
                      <p className="ws-wizard__nested-panel-copy">
                        {t('wuti.authoring.wizard.freeCreationCopy', 'The course will be created with an empty outline. You will then add modules, lessons, and activity pages directly in the authoring interface.')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    {t('wuti.authoring.wizard.previous', 'Previous')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    disabled={!startingPointValid}
                    onClick={() => {
                      setTouched((prev) => ({
                        ...prev,
                        creationStrategy: true,
                        blueprintType: true,
                        topicPrompt: true,
                      }));
                      if (startingPointValid) {
                        generateOutlineAndContinue();
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.createPlan', 'Create plan')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 71 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.reviewInitialPlanTitle', 'Review the initial plan')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.reviewInitialPlanSubtitle', 'Adjust modules, lessons, and activity pages before creating the course.')}
                </p>

                {outlineDraft.length > 0 ? (
                  <div className="ws-wizard__proposal-board">
                    {outlineDraft.map((moduleItem, moduleIndex) => (
                      <section key={moduleItem.id} className="ws-wizard__proposal-module">
                        <div className="ws-wizard__proposal-header">
                          <span className="ws-wizard__proposal-kicker">
                            {t('wuti.authoring.wizard.moduleKicker', 'Module {index}', { index: moduleIndex + 1 })}
                          </span>
                          <button
                            type="button"
                            className="ws-wizard__mini-action"
                            onClick={() => removeModuleFromDraft(moduleItem.id)}
                          >
                            {t('wuti.authoring.wizard.remove', 'Remove')}
                          </button>
                        </div>

                        <input
                          className="ws-wizard__proposal-input ws-wizard__proposal-input--module"
                          value={moduleItem.title}
                          onChange={(event) => updateModuleTitle(moduleItem.id, event.target.value)}
                        />

                        <div className="ws-wizard__proposal-lessons">
                          {moduleItem.lessons.map((lessonItem, lessonIndex) => (
                            <article key={lessonItem.id} className="ws-wizard__proposal-lesson">
                              <div className="ws-wizard__proposal-header">
                                <span className="ws-wizard__proposal-kicker">
                                  {t('wuti.authoring.wizard.lessonKicker', 'Lesson {index}', { index: lessonIndex + 1 })}
                                </span>
                                <button
                                  type="button"
                                  className="ws-wizard__mini-action"
                                  onClick={() => removeLessonFromDraft(moduleItem.id, lessonItem.id)}
                                >
                                  {t('wuti.authoring.wizard.remove', 'Remove')}
                                </button>
                              </div>

                              <input
                                className="ws-wizard__proposal-input"
                                value={lessonItem.title}
                                onChange={(event) => updateLessonTitle(
                                  moduleItem.id,
                                  lessonItem.id,
                                  event.target.value,
                                )}
                              />

                              {lessonItem.activities.length > 0 ? (
                                <div className="ws-wizard__proposal-activities">
                                  {lessonItem.activities.map((activityItem) => (
                                    <div key={activityItem.id} className="ws-wizard__proposal-activity">
                                      <input
                                        className="ws-wizard__proposal-input ws-wizard__proposal-input--activity"
                                        value={activityItem.title}
                                        onChange={(event) => updateActivityTitle(
                                          moduleItem.id,
                                          lessonItem.id,
                                          activityItem.id,
                                          event.target.value,
                                        )}
                                      />
                                      <select
                                        className="ws-wizard__proposal-select"
                                        value={activityItem.recipe}
                                        onChange={(event) => updateActivityRecipe(
                                          moduleItem.id,
                                          lessonItem.id,
                                          activityItem.id,
                                          event.target.value as RecipeType,
                                        )}
                                      >
                                        {RECIPE_OPTIONS.map((recipeOption) => (
                                          <option key={recipeOption.value} value={recipeOption.value}>
                                            {t(recipeOption.labelId, recipeOption.label)}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        className="ws-wizard__mini-action"
                                        onClick={() => removeActivityFromDraft(
                                          moduleItem.id,
                                          lessonItem.id,
                                          activityItem.id,
                                        )}
                                      >
                                        {t('wuti.authoring.wizard.remove', 'Remove')}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="ws-wizard__proposal-empty">
                                  {t('wuti.authoring.wizard.lessonWithoutActivity', 'This lesson will be created without an activity page. You can launch the lesson builder from the outline later.')}
                                </div>
                              )}

                              <button
                                type="button"
                                className="ws-wizard__link-btn"
                                onClick={() => addActivityToDraft(moduleItem.id, lessonItem.id)}
                              >
                                {t('wuti.authoring.wizard.addActivityPage', 'Add activity page')}
                              </button>
                            </article>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="ws-wizard__link-btn"
                          onClick={() => addLessonToDraft(moduleItem.id)}
                        >
                          {t('wuti.authoring.wizard.addLesson', 'Add lesson')}
                        </button>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="ws-wizard__proposal-empty-state">
                    <p className="ws-wizard__proposal-empty-title">
                      {t('wuti.authoring.wizard.emptyOutlineTitle', 'The course will start with an empty outline.')}
                    </p>
                    <p className="ws-wizard__proposal-empty-copy">
                      {t('wuti.authoring.wizard.emptyOutlineCopy', 'Add a first module now, or continue to build the path directly from the outline.')}
                    </p>
                  </div>
                )}

                <div className="ws-wizard__proposal-actions">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={addModuleToDraft}
                  >
                    {t('wuti.authoring.wizard.addModule', 'Add module')}
                  </button>
                  {data.creationStrategy !== 'scratch' && (
                    <button
                      type="button"
                      className="ws-wizard__btn ws-wizard__btn--secondary"
                      onClick={regenerateOutline}
                    >
                      {t('wuti.authoring.wizard.regenerate', 'Regenerate')}
                    </button>
                  )}
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    {t('wuti.authoring.wizard.previous', 'Previous')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    disabled={!outlineReviewValid}
                    onClick={() => {
                      if (outlineReviewValid) {
                        goToStep(4);
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.confirmPlan', 'Confirm plan')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="ws-wizard__step-title">
                  {t('wuti.authoring.wizard.mediaTitle', 'Course media and description')}
                </h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.mediaSubtitle', 'Add the course thumbnail and long description. You can skip this step if needed.')}
                </p>

                <div className="ws-wizard__content-grid">
                  <section className="ws-wizard__content-panel">
                    <div
                      className="ws-wizard__thumbnail-dropzone"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleThumbnailFile(event.dataTransfer.files?.[0]);
                      }}
                    >
                      {thumbnailPreview ? (
                        <div className="ws-wizard__thumbnail-preview-wrap">
                          <img
                            src={thumbnailPreview}
                            alt={t('wuti.authoring.wizard.thumbnailAlt', 'Course thumbnail')}
                            className="ws-wizard__thumbnail-preview"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="ws-wizard__thumbnail-icon">IMG</div>
                          <p className="ws-wizard__thumbnail-title">
                            {t('wuti.authoring.wizard.dropImage', 'Drop an image here')}
                          </p>
                          <p className="ws-wizard__thumbnail-hint">
                            {t('wuti.authoring.wizard.thumbnailHint', 'PNG, JPG, or WEBP. Maximum 2MB. Recommended 16:9 ratio.')}
                          </p>
                        </>
                      )}

                      <button
                        type="button"
                        className="ws-wizard__btn ws-wizard__btn--secondary ws-wizard__thumbnail-upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {t('wuti.authoring.wizard.browseFiles', 'Browse files')}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="ws-wizard__hidden-input"
                        onChange={(event) => handleThumbnailFile(event.target.files?.[0])}
                      />

                      {thumbnailError && <span className="ws-wizard__field-error">{thumbnailError}</span>}
                    </div>
                  </section>

                  <section className="ws-wizard__content-panel">
                    <div className="ws-wizard__editor">
                      <div className="ws-wizard__editor-toolbar">
                        <div className="ws-wizard__editor-actions">
                          <button type="button" onClick={() => wrapOverviewSelection('<strong>', '</strong>')}>B</button>
                          <button type="button" onClick={() => wrapOverviewSelection('<em>', '</em>')}>I</button>
                          <button type="button" onClick={() => wrapOverviewSelection('<u>', '</u>')}>U</button>
                          <button type="button" onClick={insertListTemplate}>List</button>
                          <button type="button" onClick={() => wrapOverviewSelection('<a href="https://">', '</a>')}>Link</button>
                        </div>
                        <button
                          type="button"
                          className="ws-wizard__editor-preview-toggle"
                          onClick={() => setOverviewPreviewMode((prev) => !prev)}
                        >
                          {overviewPreviewMode
                            ? t('wuti.authoring.wizard.editing', 'Editing')
                            : t('wuti.authoring.wizard.preview', 'Preview')}
                        </button>
                      </div>

                      {overviewPreviewMode ? (
                        <div
                          className="ws-wizard__editor-preview"
                          dangerouslySetInnerHTML={{
                            __html: data.overviewHtml
                              || `<p>${t('wuti.authoring.wizard.noContentYet', 'No content yet.')}</p>`,
                          }}
                        />
                      ) : (
                        <textarea
                          ref={overviewTextareaRef}
                          className="ws-wizard__editor-input"
                          value={data.overviewHtml}
                          onChange={(event) => setField('overviewHtml', event.target.value)}
                          placeholder={t('wuti.authoring.wizard.overviewPlaceholder', 'Present the course, flow, expectations, and learner value.')}
                        />
                      )}
                    </div>
                  </section>
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--ghost"
                    onClick={() => goToStep(3)}
                  >
                    {t('wuti.authoring.wizard.skipForNow', 'Skip for now')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    disabled={!mediaAndDescriptionValid}
                    onClick={() => {
                      if (mediaAndDescriptionValid) {
                        goToStep(3);
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.nextStep', 'Next step')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.calendarTitle', 'Course calendar')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.calendarSubtitle', 'Define the course period and enrollment period. This step can be skipped.')}
                </p>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">{t('wuti.authoring.wizard.coursePeriod', 'Course period')}</h2>
                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-course-start">
                        {t('wuti.authoring.wizard.courseStartUtc', 'Start date and time (UTC)')}
                      </label>
                      <input
                        id="ww-course-start"
                        type="datetime-local"
                        lang={intl.locale.startsWith('fr') ? 'fr-FR' : intl.locale}
                        className="ws-wizard__input"
                        value={data.courseStart}
                        onChange={(event) => {
                          setField('courseStart', event.target.value);
                          setCalendarErrors({});
                        }}
                      />
                    </div>
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-course-end">
                        {t('wuti.authoring.wizard.courseEndUtc', 'End date and time (UTC)')}
                      </label>
                      <input
                        id="ww-course-end"
                        type="datetime-local"
                        lang={intl.locale.startsWith('fr') ? 'fr-FR' : intl.locale}
                        className="ws-wizard__input"
                        value={data.courseEnd}
                        onChange={(event) => {
                          setField('courseEnd', event.target.value);
                          setCalendarErrors({});
                        }}
                      />
                    </div>
                  </div>
                  {calendarErrors.courseRange && (
                    <span className="ws-wizard__field-error">{calendarErrors.courseRange}</span>
                  )}
                </div>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">
                    {t('wuti.authoring.wizard.enrollmentPeriod', 'Enrollment period')}
                  </h2>
                  <p className="ws-wizard__field-hint">
                    {t(
                      'wuti.authoring.wizard.enrollmentPeriodHint',
                      'Enrollment must start on or before the course start date and end on or before the course end date.',
                    )}
                  </p>
                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-enrollment-start">
                        {t('wuti.authoring.wizard.enrollmentStartUtc', 'Enrollment start (UTC)')}
                      </label>
                      <input
                        id="ww-enrollment-start"
                        type="datetime-local"
                        lang={intl.locale.startsWith('fr') ? 'fr-FR' : intl.locale}
                        className="ws-wizard__input"
                        value={data.enrollmentStart}
                        onChange={(event) => {
                          setField('enrollmentStart', event.target.value);
                          setCalendarErrors({});
                        }}
                      />
                    </div>
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-enrollment-end">
                        {t('wuti.authoring.wizard.enrollmentEndUtc', 'Enrollment end (UTC)')}
                      </label>
                      <input
                        id="ww-enrollment-end"
                        type="datetime-local"
                        lang={intl.locale.startsWith('fr') ? 'fr-FR' : intl.locale}
                        className="ws-wizard__input"
                        value={data.enrollmentEnd}
                        onChange={(event) => {
                          setField('enrollmentEnd', event.target.value);
                          setCalendarErrors({});
                        }}
                      />
                    </div>
                  </div>
                  {calendarErrors.enrollmentRange && (
                    <span className="ws-wizard__field-error">{calendarErrors.enrollmentRange}</span>
                  )}
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--ghost"
                    onClick={() => goToStep(4)}
                  >
                    {t('wuti.authoring.wizard.skip', 'Skip')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    onClick={() => {
                      if (validateCalendarStep()) {
                        goToStep(4);
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.nextStep', 'Next step')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.pacingTitle', 'Pacing and prerequisites')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.pacingSubtitle', 'Define the course pace and enrollment requirements.')}
                </p>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">{t('wuti.authoring.wizard.coursePacing', 'Course pacing')}</h2>
                  <div className="ws-wizard__pacing-grid">
                    {[
                      {
                        value: 'instructor' as PacingType,
                        icon: People,
                        title: t('wuti.authoring.wizard.instructorPaced', 'Instructor-paced'),
                        description: t('wuti.authoring.wizard.instructorPacedDescription', 'Dates and deadlines are defined by the course team.'),
                      },
                      {
                        value: 'self' as PacingType,
                        icon: Settings,
                        title: t('wuti.authoring.wizard.selfPaced', 'Self-paced'),
                        description: t('wuti.authoring.wizard.selfPacedDescription', 'Each learner progresses at their own pace with more flexibility.'),
                      },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`ws-wizard__pacing-card${data.pacing === option.value ? ' ws-wizard__pacing-card--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="course-pacing"
                          checked={data.pacing === option.value}
                          onChange={() => setField('pacing', option.value)}
                        />
                        <span className="ws-wizard__pacing-radio-dot" />
                        <span className="ws-wizard__pacing-content">
                          <span className="ws-wizard__pacing-title-row">
                            <span className="ws-wizard__pacing-icon" aria-hidden="true">
                              <Icon src={option.icon} />
                            </span>
                            <span className="ws-wizard__pacing-title-copy">
                              <span className="ws-wizard__pacing-title">{option.title}</span>
                              <span className="ws-wizard__pacing-desc">{option.description}</span>
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {touched.pacing && !data.pacing && (
                    <span className="ws-wizard__field-error">
                      {t('wuti.authoring.wizard.pacingRequired', 'Select a course pacing.')}
                    </span>
                  )}
                </div>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">{t('wuti.authoring.wizard.prerequisiteCourse', 'Prerequisite course')}</h2>
                  <div className="ws-wizard__field">
                    <label className="ws-wizard__label" htmlFor="ww-prerequisite-mode">
                      {t('wuti.authoring.wizard.requirePrerequisite', 'Require another course before enrollment?')}
                    </label>
                    <select
                      id="ww-prerequisite-mode"
                      className="ws-wizard__select"
                      value={data.prerequisiteMode}
                      onChange={(event) => setField('prerequisiteMode', event.target.value as PrerequisiteMode)}
                    >
                      <option value="none">{t('wuti.authoring.wizard.noPrerequisite', 'No prerequisite')}</option>
                      <option value="required">{t('wuti.authoring.wizard.prerequisiteRequiredOption', 'Yes, a course is required')}</option>
                    </select>
                  </div>

                  {data.prerequisiteMode === 'required' && (
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-prerequisite-course">
                        {t('wuti.authoring.wizard.prerequisiteCourseId', 'Prerequisite course ID')}
                      </label>
                      <input
                        id="ww-prerequisite-course"
                        type="text"
                        className={`ws-wizard__input${touched.prerequisiteCourse && !data.prerequisiteCourse ? ' ws-wizard__input--error' : ''}`}
                        placeholder="ex. course-v1:WutiSkill+ML01+2026"
                        value={data.prerequisiteCourse}
                        onChange={(event) => setField('prerequisiteCourse', event.target.value)}
                      />
                      {touched.prerequisiteCourse && !data.prerequisiteCourse && (
                        <span className="ws-wizard__field-error">
                          {t('wuti.authoring.wizard.prerequisiteCourseIdRequired', 'Prerequisite course ID is required.')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    {t('wuti.authoring.wizard.previous', 'Previous')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    disabled={!pacingValid}
                    onClick={() => {
                      setTouched((prev) => ({ ...prev, pacing: true, prerequisiteCourse: true }));
                      if (pacingValid) {
                        goToStep(5);
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.nextStep', 'Next step')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.priceTitle', 'Course price')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.priceSubtitle', 'Define whether this course is free or requires purchase.')}
                </p>

                {hasApiError && (
                  <div className="ws-wizard__error-banner">
                    <span>{(postErrors as any).errMsg}</span>
                  </div>
                )}

                <div className="ws-wizard__price-grid">
                  {[
                    {
                      value: 'free' as PriceMode,
                      title: t('wuti.authoring.wizard.free', 'Free'),
                      description: t('wuti.authoring.wizard.freeDescription', 'The course is open to all learners at no cost.'),
                      icon: MoneyOff,
                      disabled: false,
                    },
                    {
                      value: 'paid' as PriceMode,
                      title: t('wuti.authoring.wizard.paid', 'Paid'),
                      description: t('wuti.authoring.wizard.paidUnavailableDescription', 'Paid course sales will be available soon.'),
                      icon: CreditCard,
                      disabled: true,
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`ws-wizard__price-card${data.priceMode === option.value ? ' ws-wizard__price-card--selected' : ''}${option.disabled ? ' ws-wizard__price-card--disabled' : ''}`}
                      disabled={option.disabled}
                      onClick={() => {
                        if (!option.disabled) {
                          setField('priceMode', option.value);
                        }
                      }}
                    >
                      <span className="ws-wizard__price-card-header">
                        <span className={`ws-wizard__price-card-emblem ws-wizard__price-card-emblem--${option.value}`} aria-hidden="true">
                          <Icon src={option.icon} />
                        </span>
                        <span
                          className={`ws-wizard__price-card-state${data.priceMode === option.value ? ' ws-wizard__price-card-state--selected' : ''}`}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="ws-wizard__price-card-body">
                        <span className="ws-wizard__price-card-title">{option.title}</span>
                        <span className="ws-wizard__price-card-description">{option.description}</span>
                        {option.disabled && (
                          <span className="ws-wizard__price-card-soon">
                            {t('wuti.authoring.wizard.availableSoon', 'Available soon')}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                {data.priceMode === 'paid' && (
                  <div className="ws-wizard__price-fields-panel">
                    <div className="ws-wizard__field-row ws-wizard__price-fields">
                      <div className="ws-wizard__field">
                        <label className="ws-wizard__label" htmlFor="ww-price-amount">
                          {t('wuti.authoring.wizard.price', 'Price')}
                        </label>
                        <input
                          id="ww-price-amount"
                          type="number"
                          min="0"
                          step="100"
                          className={`ws-wizard__input${touched.paidPrice && Number(data.paidPrice) <= 0 ? ' ws-wizard__input--error' : ''}`}
                          placeholder="0.00"
                          value={data.paidPrice}
                          onChange={(event) => setField('paidPrice', event.target.value)}
                        />
                        {touched.paidPrice && Number(data.paidPrice) <= 0 && (
                          <span className="ws-wizard__field-error">
                            {t('wuti.authoring.wizard.priceGreaterThanZero', 'Price must be greater than 0.')}
                          </span>
                        )}
                      </div>
                      <div className="ws-wizard__field">
                        <label className="ws-wizard__label" htmlFor="ww-price-currency">
                          {t('wuti.authoring.wizard.currency', 'Currency')}
                        </label>
                        <select
                          id="ww-price-currency"
                          className="ws-wizard__select"
                          value={data.currency}
                          onChange={(event) => setField('currency', event.target.value)}
                        >
                          <option value="XOF">FCFA (XOF)</option>
                          <option value="USD">Dollar US (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ws-wizard__course-mode-note">
                  {t('wuti.authoring.wizard.accessModeNote', 'The selected access mode will be applied when the course is created.')}
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    {t('wuti.authoring.wizard.previous', 'Previous')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--gold"
                    disabled={!pricingValid}
                    onClick={() => {
                      setTouched((prev) => ({ ...prev, priceMode: true, paidPrice: true }));
                      if (pricingValid) {
                        goToStep(6);
                      }
                    }}
                  >
                    {t('wuti.authoring.wizard.nextStep', 'Next step')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.reviewSettingsTitle', 'Review settings')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.reviewSettingsSubtitle', 'Review the main information before choosing how to start the course plan.')}
                </p>

                {hasApiError && (
                  <div className="ws-wizard__error-banner">
                    <span>{(postErrors as any).errMsg}</span>
                  </div>
                )}

                <div className="ws-wizard__review-grid">
                  {[
                    [
                      t('wuti.authoring.wizard.reviewCourseName', 'Course name'),
                      data.displayName || t('wuti.authoring.wizard.notProvided', 'Not provided'),
                    ],
                    [
                      t('wuti.authoring.wizard.reviewOrganization', 'Organization'),
                      data.org || t('wuti.authoring.wizard.notProvidedFeminine', 'Not provided'),
                    ],
                    [
                      t('wuti.authoring.wizard.reviewLanguage', 'Language'),
                      getLanguageLabel(data.language),
                    ],
                    [
                      t('wuti.authoring.wizard.reviewReference', 'Reference'),
                      referencePreview || t('wuti.authoring.wizard.generatedAfterCreation', 'Generated after creation'),
                    ],
                    [t('wuti.authoring.wizard.reviewSession', 'Session'), runPreview],
                    [
                      t('wuti.authoring.wizard.reviewPacing', 'Pacing'),
                      data.pacing === 'self'
                        ? t('wuti.authoring.wizard.selfPaced', 'Self-paced')
                        : t('wuti.authoring.wizard.instructorPaced', 'Instructor-paced'),
                    ],
                    [
                      t('wuti.authoring.wizard.reviewAccess', 'Access'),
                      data.priceMode === 'paid'
                        ? `${t('wuti.authoring.wizard.paid', 'Paid')} · ${data.paidPrice} ${data.currency}`
                        : t('wuti.authoring.wizard.free', 'Free'),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="ws-wizard__review-item">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    {t('wuti.authoring.wizard.previous', 'Previous')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    onClick={() => goToStep(7)}
                  >
                    {t('wuti.authoring.wizard.chooseStartingPoint', 'Choose starting point')}
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <h1 className="ws-wizard__step-title">{t('wuti.authoring.wizard.finalStartTitle', 'How do you want to start?')}</h1>
                <p className="ws-wizard__step-subtitle">
                  {t('wuti.authoring.wizard.finalStartSubtitle', 'Select the method for creating your course plan.')}
                </p>

                {hasApiError && (
                  <div className="ws-wizard__error-banner">
                    <span>{(postErrors as any).errMsg}</span>
                  </div>
                )}

                {templateError && (
                  <div className="ws-wizard__error-banner">
                    <span>{templateError}</span>
                  </div>
                )}

                <div className="ws-wizard__method-list">
                  {[
                    {
                      value: 'template' as CreationStrategy,
                      icon: LibraryBooks,
                      title: t('wuti.authoring.wizard.fromTemplateMethodTitle', 'From a template'),
                      description: t('wuti.authoring.wizard.templateMethodDescription', 'Use a predefined course structure adapted to your domain.'),
                    },
                    {
                      value: 'ai' as CreationStrategy,
                      icon: AutoAwesome,
                      title: t('wuti.authoring.wizard.aiCourseCreationTitle', 'Generate with AI'),
                      description: t('wuti.authoring.wizard.aiMethodDescription', 'Let the assistant create the course plan from your topic and context.'),
                    },
                    {
                      value: 'scratch' as CreationStrategy,
                      icon: EditNote,
                      title: t('wuti.authoring.wizard.scratchMethodTitle', 'Start from scratch'),
                      description: t('wuti.authoring.wizard.scratchMethodDescription', 'Create your own course plan by manually adding each section.'),
                    },
                  ].map((option) => (
                    <React.Fragment key={option.value}>
                      <button
                        type="button"
                        className={`ws-wizard__method-card${data.creationStrategy === option.value ? ' ws-wizard__method-card--selected' : ''}`}
                        onClick={() => handleStrategyChange(option.value)}
                      >
                        <span className="ws-wizard__method-emblem" aria-hidden="true">
                          <Icon src={option.icon} />
                        </span>
                        <span className="ws-wizard__method-copy">
                          <span className="ws-wizard__method-title-row">
                            <span className="ws-wizard__method-title">{option.title}</span>
                          </span>
                          <span className="ws-wizard__method-description">{option.description}</span>
                        </span>
                      </button>

                      {option.value === 'template' && data.creationStrategy === 'template' && (
                        <div className="ws-wizard__nested-panel">
                          <div className="ws-wizard__nested-panel-header">
                            <p className="ws-wizard__nested-panel-title">
                              {t('wuti.authoring.wizard.chooseTemplate', 'Choose template')}
                            </p>
                            <p className="ws-wizard__nested-panel-copy">
                              {t('wuti.authoring.wizard.chooseTemplateCopy', 'Global templates and templates for the selected organization are available here.')}
                            </p>
                          </div>

                          <div className="ws-wizard__field">
                            <label className="ws-wizard__label" htmlFor="ww-template-id">
                              {t('wuti.authoring.wizard.courseTemplate', 'Course template')}
                            </label>
                            <select
                              id="ww-template-id"
                              className={`ws-wizard__select${touched.templateId && !data.templateId ? ' ws-wizard__input--error' : ''}`}
                              value={data.templateId}
                              disabled={isLoadingTemplates || coursePlanTemplates.length === 0}
                              onChange={(event) => handleTemplateSelect(event.target.value)}
                            >
                              <option value="" disabled>
                                {isLoadingTemplates
                                  ? t('wuti.authoring.wizard.loadingTemplates', 'Loading templates...')
                                  : t('wuti.authoring.wizard.selectTemplate', 'Select a template')}
                              </option>
                              {coursePlanTemplates.map((template) => (
                                <option key={template.id} value={template.id}>
                                  {template.name}
                                  {template.visibility === 'default'
                                    ? ` · ${t('wuti.authoring.wizard.globalTemplateOption', 'Global')}`
                                    : ` · ${template.org}`}
                                </option>
                              ))}
                            </select>
                            {touched.templateId && !data.templateId && (
                              <span className="ws-wizard__field-error">
                                {t('wuti.authoring.wizard.selectTemplateRequired', 'Select a template.')}
                              </span>
                            )}
                          </div>

                          {data.templateId && planDraft.structure.sections.length > 0 && (
                            <div className="ws-wizard__plan-builder-wrap">
                              <CoursePlanBuilder
                                structure={planDraft.structure}
                                onChange={(nextStructure) => setPlanDraft((prev) => ({
                                  ...prev,
                                  structure: nextStructure,
                                }))}
                                sourceLabel={t('wuti.authoring.wizard.selectedTemplate', 'Selected template')}
                                title={coursePlanTemplates.find((template) => template.id === data.templateId)?.name
                                  || t('wuti.authoring.wizard.coursePlan', 'Course plan')}
                                description={t('wuti.authoring.wizard.adjustTemplatePlan', 'Adjust this plan before creating the course. Changes do not modify the source template.')}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {option.value === 'ai' && data.creationStrategy === 'ai' && (
                        <div className="ws-wizard__nested-panel">
                          <div className="ws-wizard__nested-panel-header">
                            <p className="ws-wizard__nested-panel-title">
                              {t('wuti.authoring.wizard.generationIntentTitle', 'Generation topic or intent')}
                            </p>
                            <p className="ws-wizard__nested-panel-copy">
                              {t('wuti.authoring.wizard.aiAssistantCopy', 'The course will be created, then the AI assistant will generate its initial structure from this context.')}
                            </p>
                          </div>

                          <div className="ws-wizard__field">
                            <label className="ws-wizard__label" htmlFor="ww-final-ai-prompt">
                              {t('wuti.authoring.wizard.generationPrompt', 'Generation prompt')}
                            </label>
                            <textarea
                              id="ww-final-ai-prompt"
                              className={`ws-wizard__textarea${touched.topicPrompt && !aiPromptSeed ? ' ws-wizard__input--error' : ''}`}
                              placeholder={t('wuti.authoring.wizard.generationPromptPlaceholder', 'e.g. Generate a beginner Python course plan with practical exercises and short quizzes.')}
                              value={data.topicPrompt}
                              onChange={(event) => setField('topicPrompt', event.target.value)}
                            />
                            {touched.topicPrompt && !aiPromptSeed && (
                              <span className="ws-wizard__field-error">
                                {t('wuti.authoring.wizard.promptRequired', 'Add a topic or objective to generate a plan.')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    {t('wuti.authoring.wizard.previous', 'Previous')}
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--gold"
                    disabled={
                      !courseBasicsValid
                      || !calendarValid
                      || !pacingValid
                      || !pricingValid
                      || !startingPointValid
                      || !outlineReviewValid
                      || isSubmitting
                      || isFinalizing
                    }
                    onClick={handleSubmit}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting
                      ? <span className="ws-wizard__btn-spinner" aria-hidden="true" />
                      : <Icon src={Check} />}
                    {submitButtonLabel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCourseWizard;
