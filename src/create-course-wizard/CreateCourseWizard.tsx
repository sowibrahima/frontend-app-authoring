import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@openedx/paragon';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
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
import { addNewCourseItem, getCourseOutlineIndex } from '../course-outline/data/api';
import { createCourseXblock } from '../course-unit/data/api';
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
const COURSE_SETUP_STORAGE_PREFIX = 'wutiskill.course-setup.';

const LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'wo', label: 'Wolof' },
  { value: 'ar', label: 'Arabe' },
];

const BLUEPRINT_OPTIONS: Array<{
  value: BlueprintType;
  label: string;
  description: string;
}> = [
  {
    value: 'videoQuiz',
    label: 'Video + quiz',
    description: 'Un parcours guide par des videos courtes suivies de verifications rapides.',
  },
  {
    value: 'reading',
    label: 'Lecture guidee',
    description: 'Une progression centree sur la lecture, la synthese et la discussion.',
  },
  {
    value: 'project',
    label: 'Projet accompagne',
    description: 'Un chemin d apprentissage qui mene vers une production concrete.',
  },
  {
    value: 'assessment',
    label: 'Preparation a l evaluation',
    description: 'Une structure orientee revision, questions types et pratique ciblee.',
  },
  {
    value: 'corporate',
    label: 'Formation interne',
    description: 'Un format court et cadenced pour la montee en competence en entreprise.',
  },
];

const RECIPE_OPTIONS: Array<{
  value: RecipeType;
  label: string;
  description: string;
}> = [
  {
    value: 'read',
    label: 'Lire',
    description: 'Expliquer un concept avec du texte, des exemples et des visuels.',
  },
  {
    value: 'watch',
    label: 'Regarder',
    description: 'Introduire le sujet avec une video ou une demonstration.',
  },
  {
    value: 'practice',
    label: 'Pratiquer',
    description: 'Faire appliquer la notion dans un exercice ou une manipulation.',
  },
  {
    value: 'answer',
    label: 'Repondre',
    description: 'Verifier la comprehension avec un quiz ou une question ouverte.',
  },
  {
    value: 'discuss',
    label: 'Discuter',
    description: 'Faire reflechir ensemble les apprenants autour d un point cle.',
  },
  {
    value: 'submit',
    label: 'Rendre un travail',
    description: 'Collecter un devoir, un projet ou une production finale.',
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
    return 'ce sujet';
  }
  return trimmed;
}

function buildTemplateOutline(blueprintType: BlueprintType, courseTitle: string): OutlineModule[] {
  const subject = extractTopicSeed(courseTitle);

  switch (blueprintType) {
    case 'videoQuiz':
      return [
        buildModule(`Decouvrir ${subject}`, [
          buildLesson('Bienvenue et repere initial', [
            buildActivity('Video d introduction', 'watch'),
            buildActivity('Verifier les notions clefs', 'answer'),
          ]),
          buildLesson('Bases a retenir', [
            buildActivity('Lecture de reference', 'read'),
            buildActivity('Questionnaire rapide', 'answer'),
          ]),
        ]),
        buildModule(`Passer a l action avec ${subject}`, [
          buildLesson('Demonstration guidee', [
            buildActivity('Video pas a pas', 'watch'),
            buildActivity('Mise en pratique', 'practice'),
          ]),
          buildLesson('Consolider les acquis', [
            buildActivity('Discussion de synthese', 'discuss'),
          ]),
        ]),
      ];
    case 'reading':
      return [
        buildModule(`Comprendre ${subject}`, [
          buildLesson('Contexte et definitions', [
            buildActivity('Lecture principale', 'read'),
          ]),
          buildLesson('Points de vigilance', [
            buildActivity('Lecture annotee', 'read'),
            buildActivity('Discussion d interpretation', 'discuss'),
          ]),
        ]),
        buildModule(`Approfondir ${subject}`, [
          buildLesson('Etude de cas', [
            buildActivity('Lecture guidee', 'read'),
            buildActivity('Question de synthese', 'answer'),
          ]),
        ]),
      ];
    case 'project':
      return [
        buildModule(`Lancer le projet ${subject}`, [
          buildLesson('Objectif et livrable', [
            buildActivity('Cadrage du projet', 'read'),
            buildActivity('Exemple de reference', 'watch'),
          ]),
        ]),
        buildModule('Construire progressivement', [
          buildLesson('Premiere iteration', [
            buildActivity('Atelier pratique', 'practice'),
          ]),
          buildLesson('Feedback et ajustements', [
            buildActivity('Echange de groupe', 'discuss'),
          ]),
        ]),
        buildModule('Livrer et evaluer', [
          buildLesson('Rendu final', [
            buildActivity('Depot du projet', 'submit'),
          ]),
        ]),
      ];
    case 'assessment':
      return [
        buildModule(`Reviser ${subject}`, [
          buildLesson('Rappels essentiels', [
            buildActivity('Synthese des notions', 'read'),
            buildActivity('Questions types', 'answer'),
          ]),
        ]),
        buildModule('S entrainer', [
          buildLesson('Serie d exercices', [
            buildActivity('Mise en pratique chronometree', 'practice'),
          ]),
          buildLesson('Correction commente', [
            buildActivity('Debrief collectif', 'discuss'),
          ]),
        ]),
      ];
    case 'corporate':
      return [
        buildModule(`Pourquoi ${subject} compte`, [
          buildLesson('Contexte metier', [
            buildActivity('Capsule video', 'watch'),
            buildActivity('Lecture de politique interne', 'read'),
          ]),
        ]),
        buildModule('Appliquer la bonne pratique', [
          buildLesson('Mise en situation', [
            buildActivity('Exercice de validation', 'practice'),
            buildActivity('Attestation de comprehension', 'answer'),
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
      buildModule(`Fondamentaux de ${topic}`, [
        buildLesson('Comprendre les bases', [
          buildActivity('Lecture de cadrage', 'read'),
          buildActivity('Questionnaire de positionnement', 'answer'),
        ]),
      ]),
      buildModule(`Utiliser ${topic} dans un cas simple`, [
        buildLesson('Demonstration guidee', [
          buildActivity('Video d exemple', 'watch'),
          buildActivity('Exercice d application', 'practice'),
        ]),
      ]),
      buildModule(`Consolider ${topic}`, [
        buildLesson('Synthese et projection', [
          buildActivity('Discussion de cloture', 'discuss'),
        ]),
      ]),
    ];
  }

  if (variantIndex === 1) {
    return [
      buildModule(`Prendre en main ${topic}`, [
        buildLesson('Vocabulaire et reperes', [
          buildActivity('Lecture d introduction', 'read'),
        ]),
        buildLesson('Premier test de comprehension', [
          buildActivity('Quiz diagnostique', 'answer'),
        ]),
      ]),
      buildModule(`Mettre ${topic} en pratique`, [
        buildLesson('Scenario accompagne', [
          buildActivity('Atelier pratique', 'practice'),
          buildActivity('Debrief en groupe', 'discuss'),
        ]),
      ]),
    ];
  }

  return [
    buildModule(`Explorer ${topic}`, [
      buildLesson('Panorama du sujet', [
        buildActivity('Video de contexte', 'watch'),
        buildActivity('Lecture complementaire', 'read'),
      ]),
    ]),
    buildModule(`Passer a l action`, [
      buildLesson('Premiere mise en oeuvre', [
        buildActivity('Cas pratique', 'practice'),
      ]),
      buildLesson('Evaluation finale', [
        buildActivity('Travail a rendre', 'submit'),
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

async function resolveCourseUsageKey(courseId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const outlineIndex: any = await getCourseOutlineIndex(courseId);
      if (outlineIndex?.courseStructure?.id) {
        return outlineIndex.courseStructure.id;
      }
    } catch (error) {
      // Retry below; course shell can take a short moment to become queryable.
    }

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

async function scaffoldActivityPage(unitLocator: string, activity: OutlineActivity) {
  switch (activity.recipe) {
    case 'read':
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.html,
        boilerplate: COMPONENT_TYPES.html,
        displayName: 'Texte principal',
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
        displayName: 'Consigne',
        parentLocator: unitLocator,
      });
      await safeCreateCourseXblock({
        type: COMPONENT_TYPES.problem,
        displayName: 'Exercice',
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
        displayName: 'Travail a rendre',
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
    return;
  }

  for (const moduleItem of outlineDraft) {
    const sectionResult: any = await addNewCourseItem(
      courseUsageKey,
      'chapter',
      cleanTitle(moduleItem.title, 'Nouveau module'),
    );
    const sectionLocator = sectionResult?.locator;

    if (!sectionLocator) {
      continue;
    }

    for (const lessonItem of moduleItem.lessons) {
      const subsectionResult: any = await addNewCourseItem(
        sectionLocator,
        'sequential',
        cleanTitle(lessonItem.title, 'Nouvelle lecon'),
      );
      const subsectionLocator = subsectionResult?.locator;

      if (!subsectionLocator) {
        continue;
      }

      for (const activityItem of lessonItem.activities) {
        const unitResult: any = await addNewCourseItem(
          subsectionLocator,
          'vertical',
          cleanTitle(activityItem.title, 'Nouvelle page d activite'),
        );
        const unitLocator = unitResult?.locator;

        if (unitLocator) {
          await scaffoldActivityPage(unitLocator, activityItem);
        }
      }
    }
  }
}

async function pollGenerationStructure(jobId: string): Promise<CoursePlanStructure | null> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const job = await getCourseGenerationJob(jobId);

    if (job?.status === 'completed') {
      return job.structure || job.structure_summary || null;
    }

    if (job?.status === 'failed' || job?.status === 'cancelled') {
      throw new Error(job.error_message || 'La génération IA a échoué.');
    }

    await wait(1500);
  }

  throw new Error('La génération IA prend trop de temps. Le cours a été créé, mais le plan IA n’a pas encore été appliqué.');
}

const CreateCourseWizard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      return;
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
          setTemplateError(error?.message || 'Impossible de charger les modèles de plan.');
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
  }, [data.org]);

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
        fileData.append('files[]', thumbnailFile);
        const uploadResponse: any = await uploadAssets(courseId, fileData);
        const uploadedAssetUrl = uploadResponse?.asset?.url;

        if (uploadedAssetUrl) {
          uploadedCourseImagePath = uploadedAssetUrl;
          uploadedCourseImageName = uploadedAssetUrl.split('block@').pop() || thumbnailFile.name;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unable to upload thumbnail:', error);
      }
    }

    try {
      const currentCourseDetails: any = await getCourseDetails(courseId);

      const mergedCourseDetails = {
        ...currentCourseDetails,
        shortDescription: data.shortDescription.trim(),
        language: data.language,
        overview: data.overviewHtml.trim() || currentCourseDetails?.overview,
        selfPaced: data.pacing === 'self',
        preRequisiteCourses: data.prerequisiteMode === 'required' && data.prerequisiteCourse.trim()
          ? [data.prerequisiteCourse.trim()]
          : [],
        startDate: toIsoOrNull(data.courseStart),
        endDate: toIsoOrNull(data.courseEnd),
        enrollmentStart: toIsoOrNull(data.enrollmentStart),
        enrollmentEnd: toIsoOrNull(data.enrollmentEnd),
        ...(uploadedCourseImagePath ? {
          courseImageAssetPath: uploadedCourseImagePath,
          courseImageName: uploadedCourseImageName,
        } : {}),
      };

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
          await applyCoursePlanToCourse(
            courseId,
            hydratePlanStructure(generatedStructure, data.displayName.trim(), data.language),
            'append',
          );
        }
      } else if (data.creationStrategy === 'template' && planDraft.structure.sections.length > 0) {
        await applyCoursePlanToCourse(
          courseId,
          hydratePlanStructure(planDraft.structure, data.displayName.trim(), data.language),
          'append',
        );
      } else {
        await provisionOutlineDraft(courseId, outlineDraft);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to provision the initial course plan:', error);
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
      dispatch(updateSavingStatus({ status: '' }));

      if (!url) {
        setIsSubmitting(false);
        setIsFinalizing(false);
        return;
      }

      const destination = destinationCourseKey ? `${url}${destinationCourseKey}` : url;

      const finalizeSetupAndNavigate = async () => {
        setIsFinalizing(true);
        if (destinationCourseKey) {
          await persistCourseSetup(destinationCourseKey);
        }
        setIsFinalizing(false);
        setIsSubmitting(false);
        navigate(destination);
      };

      finalizeSetupAndNavigate();
    } else if (savingStatus === RequestStatus.FAILED) {
      dispatch(updateSavingStatus({ status: '' }));
      setIsSubmitting(false);
      setIsFinalizing(false);
    }
  }, [dispatch, navigate, persistCourseSetup, redirectUrlObj, savingStatus]);

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
      setTemplateError(error?.message || 'Impossible de charger ce modèle.');
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

    if (!file.type.startsWith('image/')) {
      setThumbnailError('Le fichier doit etre une image PNG, JPG ou WEBP.');
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      setThumbnailError('La taille maximale autorisee est de 2MB.');
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
      nextErrors.courseRange = 'Veuillez renseigner a la fois la date de debut et de fin du cours.';
    }

    if ((data.enrollmentStart && !data.enrollmentEnd) || (!data.enrollmentStart && data.enrollmentEnd)) {
      nextErrors.enrollmentRange = 'Veuillez renseigner a la fois la date de debut et de fin des inscriptions.';
    }

    if (courseStart && courseEnd && courseStart >= courseEnd) {
      nextErrors.courseRange = 'La date de fin du cours doit etre apres la date de debut.';
    }

    if (enrollmentStart && enrollmentEnd && enrollmentStart >= enrollmentEnd) {
      nextErrors.enrollmentRange = 'La fin des inscriptions doit etre apres le debut des inscriptions.';
    }

    if (courseStart && enrollmentStart && enrollmentStart > courseStart) {
      nextErrors.enrollmentRange = 'Le debut des inscriptions doit etre avant le debut du cours.';
    }

    if (courseEnd && enrollmentEnd && enrollmentEnd > courseEnd) {
      nextErrors.enrollmentRange = 'La fin des inscriptions doit etre avant la fin du cours.';
    }

    return nextErrors;
  }, [
    data.courseEnd,
    data.courseStart,
    data.enrollmentEnd,
    data.enrollmentStart,
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
    const selectedText = currentValue.slice(start, end) || 'texte';
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
    const selectedText = currentValue.slice(start, end) || 'Element';
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
        buildLesson('Lecon 1'),
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
            buildLesson(`Lecon ${moduleItem.lessons.length + 1}`),
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
                  buildActivity(`Activite ${lesson.activities.length + 1}`, 'read'),
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
    data.creationStrategy === 'ai' && aiPromptSeed !== ''
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

  const pricingValid = data.priceMode === 'free'
    || (data.priceMode === 'paid' && Number(data.paidPrice) > 0);
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

    if (!courseBasicsValid || !startingPointValid || !outlineReviewValid || !calendarValid || !pacingValid || !pricingValid) {
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
            Retour
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

          <span className="ws-wizard__step-indicator">Étape {step} sur {TOTAL_STEPS}</span>
        </header>

        <div className="ws-wizard__card">
          <div key={animKey} className="ws-wizard__step-content">
            {step === 1 && (
              <>
                <h1 className="ws-wizard__step-title">Définir le cours</h1>

                <div className="ws-wizard__field-group">
                  <div className="ws-wizard__field">
                    <label className="ws-wizard__label" htmlFor="ww-name">Nom du cours</label>
                    <input
                      id="ww-name"
                      className={`ws-wizard__input${touched.displayName && !data.displayName ? ' ws-wizard__input--error' : ''}`}
                      type="text"
                      placeholder="ex. Introduction au Machine Learning"
                      value={data.displayName}
                      onChange={(event) => setField('displayName', event.target.value)}
                    />
                    {touched.displayName && !data.displayName && (
                      <span className="ws-wizard__field-error">Le nom du cours est requis.</span>
                    )}
                  </div>

                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-org">Organisation</label>
                      <select
                        id="ww-org"
                        className={`ws-wizard__select${touched.org && !data.org ? ' ws-wizard__input--error' : ''}`}
                        value={data.org}
                        onChange={(event) => handleOrgChange(event.target.value)}
                        disabled={organizations.length === 0}
                      >
                        <option value="" disabled>
                          {organizations.length > 0 ? 'Sélectionner une organisation' : 'Aucune organisation disponible'}
                        </option>
                        {organizations.map((orgValue) => (
                          <option key={orgValue} value={orgValue}>{orgValue}</option>
                        ))}
                      </select>
                      {touched.org && !data.org && (
                        <span className="ws-wizard__field-error">L'organisation est requise.</span>
                      )}
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-language">Langue du cours</label>
                      <select
                        id="ww-language"
                        className="ws-wizard__select"
                        value={data.language}
                        onChange={(event) => setField('language', event.target.value)}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ws-wizard__field">
                    <label className="ws-wizard__label" htmlFor="ww-short-description">
                      Brève description
                      <span className="ws-wizard__label-hint">Max 150 caractères</span>
                    </label>
                    <textarea
                      id="ww-short-description"
                      className={`ws-wizard__textarea${touched.shortDescription && !data.shortDescription ? ' ws-wizard__input--error' : ''}`}
                      placeholder="Une ligne claire pour décrire le cours dans le catalogue."
                      value={data.shortDescription}
                      maxLength={150}
                      onChange={(event) => setField('shortDescription', event.target.value)}
                    />
                    {touched.shortDescription && !data.shortDescription && (
                      <span className="ws-wizard__field-error">La brève description est requise.</span>
                    )}
                  </div>

                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-reference">Référence</label>
                      <input
                        id="ww-reference"
                        className="ws-wizard__input ws-wizard__input--readonly"
                        type="text"
                        value={referencePreview}
                        placeholder="Générée après sélection de l'organisation"
                        readOnly
                        aria-readonly="true"
                      />
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-run">Session</label>
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
                    Continuer
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 70 && (
              <>
                <h1 className="ws-wizard__step-title">Choisir un point de départ</h1>
                <p className="ws-wizard__step-subtitle">
                  Sélectionnez comment le premier plan de cours doit être préparé.
                </p>

                <div className="ws-wizard__strategy-grid ws-wizard__strategy-grid--three">
                  {[
                    {
                      value: 'template' as CreationStrategy,
                      title: "Partir d'un modèle",
                      description: "Utiliser une structure pédagogique prédéfinie adaptée à un cas d'usage.",
                    },
                    {
                      value: 'ai' as CreationStrategy,
                      title: 'Générer à partir du sujet',
                      description: 'Produire un brouillon de modules, leçons et activités à partir de votre contexte.',
                    },
                    {
                      value: 'scratch' as CreationStrategy,
                      title: 'Commencer à vide',
                      description: "Créer un cours sans structure imposée et construire ensuite dans l'outline.",
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
                      <p className="ws-wizard__nested-panel-title">Choisir un modèle pédagogique</p>
                      <p className="ws-wizard__nested-panel-copy">
                        Le modèle crée un brouillon modifiable avant la création du cours.
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
                          <p className="ws-wizard__blueprint-title">{option.label}</p>
                          <p className="ws-wizard__blueprint-description">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {data.creationStrategy === 'ai' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">Sujet ou intention de génération</p>
                      <p className="ws-wizard__nested-panel-copy">
                        Le brouillon proposé restera modifiable avant d'être appliqué au cours.
                      </p>
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-topic-prompt">Prompt de départ</label>
                      <textarea
                        id="ww-topic-prompt"
                        className={`ws-wizard__textarea${touched.topicPrompt && !aiPromptSeed ? ' ws-wizard__input--error' : ''}`}
                        placeholder="ex. Introduction à Python pour débutants avec un accent sur la pratique."
                        value={data.topicPrompt}
                        onChange={(event) => setField('topicPrompt', event.target.value)}
                      />
                      {touched.topicPrompt && !aiPromptSeed && (
                        <span className="ws-wizard__field-error">Ajoutez un sujet ou un objectif pour générer un plan.</span>
                      )}
                    </div>
                  </div>
                )}

                {data.creationStrategy === 'scratch' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">Création libre</p>
                      <p className="ws-wizard__nested-panel-copy">
                        Le cours sera créé avec un outline vide. Vous ajouterez ensuite modules, leçons et pages d'activité directement dans l'interface d'auteur.
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
                    Précédent
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
                    Créer le plan
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 71 && (
              <>
                <h1 className="ws-wizard__step-title">Réviser le plan initial</h1>
                <p className="ws-wizard__step-subtitle">
                  Ajustez les modules, les leçons et les pages d'activité avant de créer le cours.
                </p>

                {outlineDraft.length > 0 ? (
                  <div className="ws-wizard__proposal-board">
                    {outlineDraft.map((moduleItem, moduleIndex) => (
                      <section key={moduleItem.id} className="ws-wizard__proposal-module">
                        <div className="ws-wizard__proposal-header">
                          <span className="ws-wizard__proposal-kicker">Module {moduleIndex + 1}</span>
                          <button
                            type="button"
                            className="ws-wizard__mini-action"
                            onClick={() => removeModuleFromDraft(moduleItem.id)}
                          >
                            Retirer
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
                                <span className="ws-wizard__proposal-kicker">Leçon {lessonIndex + 1}</span>
                                <button
                                  type="button"
                                  className="ws-wizard__mini-action"
                                  onClick={() => removeLessonFromDraft(moduleItem.id, lessonItem.id)}
                                >
                                  Retirer
                                </button>
                              </div>

                              <input
                                className="ws-wizard__proposal-input"
                                value={lessonItem.title}
                                onChange={(event) => updateLessonTitle(moduleItem.id, lessonItem.id, event.target.value)}
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
                                            {recipeOption.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        className="ws-wizard__mini-action"
                                        onClick={() => removeActivityFromDraft(moduleItem.id, lessonItem.id, activityItem.id)}
                                      >
                                        Retirer
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="ws-wizard__proposal-empty">
                                  Cette leçon sera créée sans page d'activité. Vous pourrez lancer le lesson builder dans l'outline ensuite.
                                </div>
                              )}

                              <button
                                type="button"
                                className="ws-wizard__link-btn"
                                onClick={() => addActivityToDraft(moduleItem.id, lessonItem.id)}
                              >
                                Ajouter une page d'activité
                              </button>
                            </article>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="ws-wizard__link-btn"
                          onClick={() => addLessonToDraft(moduleItem.id)}
                        >
                          Ajouter une leçon
                        </button>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="ws-wizard__proposal-empty-state">
                    <p className="ws-wizard__proposal-empty-title">Le cours démarrera avec un outline vide.</p>
                    <p className="ws-wizard__proposal-empty-copy">
                      Ajoutez un premier module maintenant, ou continuez pour construire le parcours directement depuis l'outline.
                    </p>
                  </div>
                )}

                <div className="ws-wizard__proposal-actions">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={addModuleToDraft}
                  >
                    Ajouter un module
                  </button>
                  {data.creationStrategy !== 'scratch' && (
                    <button
                      type="button"
                      className="ws-wizard__btn ws-wizard__btn--secondary"
                      onClick={regenerateOutline}
                    >
                      Régénérer
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
                    Précédent
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
                    Confirmer le plan
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="ws-wizard__step-title">Média et description du cours</h1>
                <p className="ws-wizard__step-subtitle">
                  Ajoutez la miniature et la présentation longue du cours. Vous pouvez ignorer cette étape si nécessaire.
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
                            alt="Miniature du cours"
                            className="ws-wizard__thumbnail-preview"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="ws-wizard__thumbnail-icon">IMG</div>
                          <p className="ws-wizard__thumbnail-title">Glissez une image ici</p>
                          <p className="ws-wizard__thumbnail-hint">PNG, JPG ou WEBP. Maximum 2MB. Ratio 16:9 recommandé.</p>
                        </>
                      )}

                      <button
                        type="button"
                        className="ws-wizard__btn ws-wizard__btn--secondary ws-wizard__thumbnail-upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Parcourir les fichiers
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
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
                          <button type="button" onClick={() => wrapOverviewSelection('<a href=\"https://\">', '</a>')}>Link</button>
                        </div>
                        <button
                          type="button"
                          className="ws-wizard__editor-preview-toggle"
                          onClick={() => setOverviewPreviewMode((prev) => !prev)}
                        >
                          {overviewPreviewMode ? 'Édition' : 'Aperçu'}
                        </button>
                      </div>

                      {overviewPreviewMode ? (
                        <div className="ws-wizard__editor-preview" dangerouslySetInnerHTML={{ __html: data.overviewHtml || '<p>Aucun contenu pour le moment.</p>' }} />
                      ) : (
                        <textarea
                          ref={overviewTextareaRef}
                          className="ws-wizard__editor-input"
                          value={data.overviewHtml}
                          onChange={(event) => setField('overviewHtml', event.target.value)}
                          placeholder="Présentez le cours, le déroulé, les attentes et la valeur pour l'apprenant."
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
                    Ignorer pour le moment
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
                    Étape suivante
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="ws-wizard__step-title">Calendrier du cours</h1>
                <p className="ws-wizard__step-subtitle">
                  Définissez la période du cours et la période d'inscription. Cette étape peut être ignorée.
                </p>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">Période du cours</h2>
                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-course-start">Date et heure de début (UTC)</label>
                      <input
                        id="ww-course-start"
                        type="datetime-local"
                        className="ws-wizard__input"
                        value={data.courseStart}
                        onChange={(event) => {
                          setField('courseStart', event.target.value);
                          setCalendarErrors({});
                        }}
                      />
                    </div>
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-course-end">Date et heure de fin (UTC)</label>
                      <input
                        id="ww-course-end"
                        type="datetime-local"
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
                  <h2 className="ws-wizard__section-title">Période d'inscription</h2>
                  <div className="ws-wizard__field-row">
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-enrollment-start">Début des inscriptions (UTC)</label>
                      <input
                        id="ww-enrollment-start"
                        type="datetime-local"
                        className="ws-wizard__input"
                        value={data.enrollmentStart}
                        onChange={(event) => {
                          setField('enrollmentStart', event.target.value);
                          setCalendarErrors({});
                        }}
                      />
                    </div>
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-enrollment-end">Fin des inscriptions (UTC)</label>
                      <input
                        id="ww-enrollment-end"
                        type="datetime-local"
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
                    Ignorer
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    disabled={!calendarValid}
                    onClick={() => {
                      if (validateCalendarStep()) {
                        goToStep(4);
                      }
                    }}
                  >
                    Étape suivante
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="ws-wizard__step-title">Rythme et Prérequis</h1>
                <p className="ws-wizard__step-subtitle">
                  Définissez la cadence du cours et les conditions requises pour s'inscrire.
                </p>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">Rythme du cours</h2>
                  <div className="ws-wizard__pacing-grid">
                    {[
                      {
                        value: 'instructor' as PacingType,
                        icon: People,
                        title: "Au rythme de l'instructeur",
                        description: "Les dates et les échéances sont définies par l'équipe pédagogique.",
                      },
                      {
                        value: 'self' as PacingType,
                        icon: Settings,
                        title: 'En autonomie',
                        description: 'Chaque apprenant avance à son rythme avec une plus grande flexibilité.',
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
                    <span className="ws-wizard__field-error">Veuillez sélectionner un rythme de cours.</span>
                  )}
                </div>

                <div className="ws-wizard__calendar-section">
                  <h2 className="ws-wizard__section-title">Cours Prérequis</h2>
                  <div className="ws-wizard__field">
                    <label className="ws-wizard__label" htmlFor="ww-prerequisite-mode">Exiger un autre cours avant inscription ?</label>
                    <select
                      id="ww-prerequisite-mode"
                      className="ws-wizard__select"
                      value={data.prerequisiteMode}
                      onChange={(event) => setField('prerequisiteMode', event.target.value as PrerequisiteMode)}
                    >
                      <option value="none">Aucun prérequis</option>
                      <option value="required">Oui, un cours est requis</option>
                    </select>
                  </div>

                  {data.prerequisiteMode === 'required' && (
                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-prerequisite-course">Identifiant du cours prérequis</label>
                      <input
                        id="ww-prerequisite-course"
                        type="text"
                        className={`ws-wizard__input${touched.prerequisiteCourse && !data.prerequisiteCourse ? ' ws-wizard__input--error' : ''}`}
                        placeholder="ex. course-v1:WutiSkill+ML01+2026"
                        value={data.prerequisiteCourse}
                        onChange={(event) => setField('prerequisiteCourse', event.target.value)}
                      />
                      {touched.prerequisiteCourse && !data.prerequisiteCourse && (
                        <span className="ws-wizard__field-error">L'identifiant du cours prérequis est requis.</span>
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
                    Précédent
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
                    Étape suivante
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="ws-wizard__step-title">Prix du cours</h1>
                <p className="ws-wizard__step-subtitle">
                  Définissez si ce cours est gratuit ou s'il nécessite un achat.
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
                      title: 'Gratuit',
                      description: 'Le cours est ouvert à tous les apprenants sans frais.',
                      icon: Check,
                    },
                    {
                      value: 'paid' as PriceMode,
                      title: 'Payant',
                      description: "Définissez un prix de vente pour l'accès au cours.",
                      icon: CreditCard,
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`ws-wizard__price-card${data.priceMode === option.value ? ' ws-wizard__price-card--selected' : ''}`}
                      onClick={() => setField('priceMode', option.value)}
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
                      </span>
                    </button>
                  ))}
                </div>

                {data.priceMode === 'paid' && (
                  <div className="ws-wizard__price-fields-panel">
                    <div className="ws-wizard__field-row ws-wizard__price-fields">
                      <div className="ws-wizard__field">
                        <label className="ws-wizard__label" htmlFor="ww-price-amount">Prix</label>
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
                          <span className="ws-wizard__field-error">Le prix doit être supérieur à 0.</span>
                        )}
                      </div>
                      <div className="ws-wizard__field">
                        <label className="ws-wizard__label" htmlFor="ww-price-currency">Devise</label>
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
                  Le mode d'accès choisi sera appliqué dès la création du cours.
                </div>

                <div className="ws-wizard__footer">
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--secondary"
                    onClick={handleBack}
                  >
                    <Icon src={ArrowLeft} />
                    Précédent
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
                    Étape suivante
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <h1 className="ws-wizard__step-title">Vérifier les réglages</h1>
                <p className="ws-wizard__step-subtitle">
                  Relisez les informations principales avant de choisir comment démarrer le plan du cours.
                </p>

                {hasApiError && (
                  <div className="ws-wizard__error-banner">
                    <span>{(postErrors as any).errMsg}</span>
                  </div>
                )}

                <div className="ws-wizard__review-grid">
                  {[
                    ['Nom du cours', data.displayName || 'Non renseigné'],
                    ['Organisation', data.org || 'Non renseignée'],
                    ['Langue', LANGUAGE_OPTIONS.find((option) => option.value === data.language)?.label || data.language],
                    ['Référence', referencePreview || 'Générée après création'],
                    ['Session', runPreview],
                    ['Rythme', data.pacing === 'self' ? 'En autonomie' : "Au rythme de l'instructeur"],
                    ['Accès', data.priceMode === 'paid' ? `Payant · ${data.paidPrice} ${data.currency}` : 'Gratuit'],
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
                    Précédent
                  </button>
                  <button
                    type="button"
                    className="ws-wizard__btn ws-wizard__btn--primary"
                    onClick={() => goToStep(7)}
                  >
                    Choisir le point de départ
                    <Icon src={ArrowRight} />
                  </button>
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <h1 className="ws-wizard__step-title">Comment voulez-vous commencer ?</h1>
                <p className="ws-wizard__step-subtitle">
                  Sélectionnez la méthode de création de votre plan de cours.
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
                      emblem: 'M',
                      title: "From a template",
                      description: 'Utilisez une structure de cours prédéfinie adaptée à votre domaine.',
                    },
                    {
                      value: 'ai' as CreationStrategy,
                      emblem: 'IA',
                      title: 'Generate with AI',
                      description: "Laissez notre assistant créer le plan de cours à partir de vos documents ou d'un prompt.",
                      badge: 'Nouveau',
                    },
                    {
                      value: 'scratch' as CreationStrategy,
                      emblem: '0',
                      title: 'Start from scratch',
                      description: 'Créez votre propre plan de cours en ajoutant manuellement chaque section.',
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`ws-wizard__method-card${data.creationStrategy === option.value ? ' ws-wizard__method-card--selected' : ''}`}
                      onClick={() => handleStrategyChange(option.value)}
                    >
                      <span className="ws-wizard__method-emblem">{option.emblem}</span>
                      <span className="ws-wizard__method-copy">
                        <span className="ws-wizard__method-title-row">
                          <span className="ws-wizard__method-title">{option.title}</span>
                          {option.badge && <span className="ws-wizard__strategy-badge">{option.badge}</span>}
                        </span>
                        <span className="ws-wizard__method-description">{option.description}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {data.creationStrategy === 'template' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">Choisir le modèle</p>
                      <p className="ws-wizard__nested-panel-copy">
                        Les modèles globaux et ceux de l'organisation sélectionnée sont disponibles ici.
                      </p>
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-template-id">Modèle de cours</label>
                      <select
                        id="ww-template-id"
                        className={`ws-wizard__select${touched.templateId && !data.templateId ? ' ws-wizard__input--error' : ''}`}
                        value={data.templateId}
                        disabled={isLoadingTemplates || coursePlanTemplates.length === 0}
                        onChange={(event) => handleTemplateSelect(event.target.value)}
                      >
                        <option value="" disabled>
                          {isLoadingTemplates ? 'Chargement des modèles...' : 'Sélectionner un modèle'}
                        </option>
                        {coursePlanTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                            {template.visibility === 'default' ? ' · Global' : ` · ${template.org}`}
                          </option>
                        ))}
                      </select>
                      {touched.templateId && !data.templateId && (
                        <span className="ws-wizard__field-error">Sélectionnez un modèle.</span>
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
                          sourceLabel="Modèle sélectionné"
                          title={coursePlanTemplates.find((template) => template.id === data.templateId)?.name || 'Plan du cours'}
                          description="Ajustez ce plan avant de créer le cours. Les changements ne modifient pas le modèle source."
                        />
                      </div>
                    )}
                  </div>
                )}

                {data.creationStrategy === 'ai' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">Assistant de création IA</p>
                      <p className="ws-wizard__nested-panel-copy">
                        Le cours sera créé, puis le plugin IA générera une structure initiale à partir de ce contexte.
                      </p>
                    </div>

                    <div className="ws-wizard__field">
                      <label className="ws-wizard__label" htmlFor="ww-topic-prompt-final">Prompt de génération</label>
                      <textarea
                        id="ww-topic-prompt-final"
                        className={`ws-wizard__textarea${touched.topicPrompt && !aiPromptSeed ? ' ws-wizard__input--error' : ''}`}
                        placeholder="ex. Génère un plan de cours sur Python pour débutants, avec des exercices pratiques et des quiz courts."
                        value={data.topicPrompt}
                        onChange={(event) => setField('topicPrompt', event.target.value)}
                      />
                      {touched.topicPrompt && !aiPromptSeed && (
                        <span className="ws-wizard__field-error">Ajoutez un sujet ou un objectif pour générer un plan.</span>
                      )}
                    </div>

                    <div className="ws-wizard__course-mode-note">
                      La génération IA utilise le plugin WutiSkill AI. Le plan généré sera appliqué après la création du shell du cours. L'édition fine du plan IA dans le builder partagé sera branchée sur cette même structure.
                    </div>
                  </div>
                )}

                {data.creationStrategy === 'scratch' && (
                  <div className="ws-wizard__nested-panel">
                    <div className="ws-wizard__nested-panel-header">
                      <p className="ws-wizard__nested-panel-title">Création libre</p>
                      <p className="ws-wizard__nested-panel-copy">
                        Le cours sera créé sans structure initiale. Vous arriverez directement dans l'éditeur d'outline pour construire le plan manuellement.
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
                    Précédent
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
                  >
                    <Icon src={Check} />
                    {isSubmitting
                      ? (isFinalizing ? 'Préparation du plan...' : 'Création du cours...')
                      : 'Créer le cours'}
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
