import {
  CoursePlanComponent,
  CoursePlanComponentType,
  CoursePlanDraft,
  CoursePlanSection,
  CoursePlanStructure,
  CoursePlanSubsection,
  CoursePlanUnit,
} from './types';

const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const DEFAULT_COMPONENT_TYPE: CoursePlanComponentType = 'html';

export const createPlanComponent = (
  displayName = 'Content',
  componentType: CoursePlanComponentType = DEFAULT_COMPONENT_TYPE,
): CoursePlanComponent => {
  const baseContent: Record<CoursePlanComponentType, Record<string, unknown>> = {
    html: { html: '<p>Content to customize.</p>' },
    video: { description: 'Video to add.' },
    problem: {
      problem_type: 'multiple_choice',
      question: 'Question to customize.',
      options: ['Option A', 'Option B'],
      correct_index: 0,
      explanation: '',
    },
    discussion: { topic: 'Discussion topic to customize.' },
  };

  return {
    id: makeId('component'),
    component_type: componentType,
    display_name: displayName,
    content: baseContent[componentType],
  };
};

export const createPlanUnit = (displayName = 'New unit'): CoursePlanUnit => ({
  id: makeId('unit'),
  display_name: displayName,
  components: [createPlanComponent()],
});

export const createPlanSubsection = (displayName = 'New lesson'): CoursePlanSubsection => ({
  id: makeId('subsection'),
  display_name: displayName,
  graded: false,
  grade_format: '',
  units: [createPlanUnit()],
});

export const createPlanSection = (displayName = 'New module'): CoursePlanSection => ({
  id: makeId('section'),
  display_name: displayName,
  subsections: [createPlanSubsection()],
});

export const createEmptyPlanStructure = (
  displayName = '',
  language = 'fr',
): CoursePlanStructure => ({
  display_name: displayName,
  language,
  sections: [],
});

const hydrateComponent = (component: CoursePlanComponent): CoursePlanComponent => ({
  ...component,
  id: component.id || makeId('component'),
  component_type: component.component_type || DEFAULT_COMPONENT_TYPE,
  display_name: component.display_name || 'Content',
  content: component.content || {},
});

const hydrateUnit = (unit: CoursePlanUnit): CoursePlanUnit => ({
  ...unit,
  id: unit.id || makeId('unit'),
  display_name: unit.display_name || 'New unit',
  components: (unit.components || []).map(hydrateComponent),
});

const hydrateSubsection = (subsection: CoursePlanSubsection): CoursePlanSubsection => ({
  ...subsection,
  id: subsection.id || makeId('subsection'),
  display_name: subsection.display_name || 'New lesson',
  graded: Boolean(subsection.graded),
  grade_format: subsection.grade_format || '',
  units: (subsection.units || []).map(hydrateUnit),
});

const hydrateSection = (section: CoursePlanSection): CoursePlanSection => ({
  ...section,
  id: section.id || makeId('section'),
  display_name: section.display_name || 'New module',
  subsections: (section.subsections || []).map(hydrateSubsection),
});

export const hydratePlanStructure = (
  structure: Partial<CoursePlanStructure> | null | undefined,
  fallbackTitle = '',
  fallbackLanguage = 'fr',
): CoursePlanStructure => ({
  display_name: structure?.display_name || fallbackTitle,
  language: structure?.language || fallbackLanguage,
  metadata: structure?.metadata || {},
  sections: (structure?.sections || []).map(hydrateSection),
});

export const createScratchPlanDraft = (
  displayName: string,
  language: string,
): CoursePlanDraft => ({
  source: 'scratch',
  structure: createEmptyPlanStructure(displayName, language),
});

export const createPlanDraftFromStructure = (
  source: CoursePlanDraft['source'],
  structure: Partial<CoursePlanStructure>,
  displayName: string,
  language: string,
  ids: Pick<CoursePlanDraft, 'templateId' | 'generationJobId'> = {},
): CoursePlanDraft => ({
  source,
  ...ids,
  structure: hydratePlanStructure(structure, displayName, language),
});

export const countPlanItems = (structure: CoursePlanStructure) => {
  const sections = structure.sections.length;
  const subsections = structure.sections.reduce((total, section) => total + section.subsections.length, 0);
  const units = structure.sections.reduce(
    (sectionTotal, section) => sectionTotal + section.subsections.reduce(
      (subsectionTotal, subsection) => subsectionTotal + subsection.units.length,
      0,
    ),
    0,
  );
  const components = structure.sections.reduce(
    (sectionTotal, section) => sectionTotal + section.subsections.reduce(
      (subsectionTotal, subsection) => subsectionTotal + subsection.units.reduce(
        (unitTotal, unit) => unitTotal + unit.components.length,
        0,
      ),
      0,
    ),
    0,
  );

  return {
    sections,
    subsections,
    units,
    components,
  };
};
