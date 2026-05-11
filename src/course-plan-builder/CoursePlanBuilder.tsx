import React from 'react';
import { Icon } from '@openedx/paragon';
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  Delete,
  Refresh,
} from '@openedx/paragon/icons';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';

import {
  CoursePlanComponent,
  CoursePlanComponentType,
  CoursePlanSection,
  CoursePlanStructure,
  CoursePlanSubsection,
  CoursePlanUnit,
} from './types';
import {
  countPlanItems,
  createPlanComponent,
  createPlanSection,
  createPlanSubsection,
  createPlanUnit,
  hydratePlanStructure,
} from './utils';
import './CoursePlanBuilder.scss';

interface CoursePlanBuilderProps {
  structure: CoursePlanStructure;
  onChange: (structure: CoursePlanStructure) => void;
  title?: string;
  description?: string;
  sourceLabel?: string;
  allowRegenerate?: boolean;
  onRegenerate?: () => void;
}

const messages = defineMessages({
  defaultTitle: {
    id: 'wuti.authoring.planBuilder.defaultTitle',
    defaultMessage: 'Course plan',
    description: 'Default title for the reusable course plan builder',
  },
  defaultDescription: {
    id: 'wuti.authoring.planBuilder.defaultDescription',
    defaultMessage: 'Adjust modules, lessons, units, and content before creating the course.',
    description: 'Default description for the reusable course plan builder',
  },
  statsAria: {
    id: 'wuti.authoring.planBuilder.statsAria',
    defaultMessage: 'Plan summary',
    description: 'Accessible label for course plan summary stats',
  },
  modulesStat: {
    id: 'wuti.authoring.planBuilder.stats.modules',
    defaultMessage: '{count, plural, one {# module} other {# modules}}',
    description: 'Module count in the plan builder',
  },
  lessonsStat: {
    id: 'wuti.authoring.planBuilder.stats.lessons',
    defaultMessage: '{count, plural, one {# lesson} other {# lessons}}',
    description: 'Lesson count in the plan builder',
  },
  unitsStat: {
    id: 'wuti.authoring.planBuilder.stats.units',
    defaultMessage: '{count, plural, one {# unit} other {# units}}',
    description: 'Unit count in the plan builder',
  },
  moduleKicker: {
    id: 'wuti.authoring.planBuilder.moduleKicker',
    defaultMessage: 'Module {index}',
    description: 'Kicker shown above a module in the plan builder',
  },
  lessonKicker: {
    id: 'wuti.authoring.planBuilder.lessonKicker',
    defaultMessage: 'Lesson {index}',
    description: 'Kicker shown above a lesson in the plan builder',
  },
  moveModuleUp: {
    id: 'wuti.authoring.planBuilder.moveModuleUp',
    defaultMessage: 'Move module up',
    description: 'Accessible label for moving a module up',
  },
  moveModuleDown: {
    id: 'wuti.authoring.planBuilder.moveModuleDown',
    defaultMessage: 'Move module down',
    description: 'Accessible label for moving a module down',
  },
  deleteModule: {
    id: 'wuti.authoring.planBuilder.deleteModule',
    defaultMessage: 'Delete module',
    description: 'Accessible label for deleting a module',
  },
  moveLessonUp: {
    id: 'wuti.authoring.planBuilder.moveLessonUp',
    defaultMessage: 'Move lesson up',
    description: 'Accessible label for moving a lesson up',
  },
  moveLessonDown: {
    id: 'wuti.authoring.planBuilder.moveLessonDown',
    defaultMessage: 'Move lesson down',
    description: 'Accessible label for moving a lesson down',
  },
  deleteLesson: {
    id: 'wuti.authoring.planBuilder.deleteLesson',
    defaultMessage: 'Delete lesson',
    description: 'Accessible label for deleting a lesson',
  },
  moveUnitUp: {
    id: 'wuti.authoring.planBuilder.moveUnitUp',
    defaultMessage: 'Move unit up',
    description: 'Accessible label for moving a unit up',
  },
  moveUnitDown: {
    id: 'wuti.authoring.planBuilder.moveUnitDown',
    defaultMessage: 'Move unit down',
    description: 'Accessible label for moving a unit down',
  },
  deleteUnit: {
    id: 'wuti.authoring.planBuilder.deleteUnit',
    defaultMessage: 'Delete unit',
    description: 'Accessible label for deleting a unit',
  },
  deleteContent: {
    id: 'wuti.authoring.planBuilder.deleteContent',
    defaultMessage: 'Delete content',
    description: 'Accessible label for deleting content',
  },
  addContent: {
    id: 'wuti.authoring.planBuilder.addContent',
    defaultMessage: 'Add content',
    description: 'Button label to add content in the plan builder',
  },
  addUnit: {
    id: 'wuti.authoring.planBuilder.addUnit',
    defaultMessage: 'Add unit',
    description: 'Button label to add a unit in the plan builder',
  },
  addLesson: {
    id: 'wuti.authoring.planBuilder.addLesson',
    defaultMessage: 'Add lesson',
    description: 'Button label to add a lesson in the plan builder',
  },
  addModule: {
    id: 'wuti.authoring.planBuilder.addModule',
    defaultMessage: 'Add module',
    description: 'Button label to add a module in the plan builder',
  },
  regeneratePlan: {
    id: 'wuti.authoring.planBuilder.regeneratePlan',
    defaultMessage: 'Regenerate plan',
    description: 'Button label to regenerate the plan',
  },
  emptyTitle: {
    id: 'wuti.authoring.planBuilder.emptyTitle',
    defaultMessage: 'The course will start with an empty plan.',
    description: 'Empty state title for the plan builder',
  },
  emptyCopy: {
    id: 'wuti.authoring.planBuilder.emptyCopy',
    defaultMessage: 'Add a first module now, or continue to build the course in the outline.',
    description: 'Empty state copy for the plan builder',
  },
  defaultModuleName: {
    id: 'wuti.authoring.planBuilder.defaultModuleName',
    defaultMessage: 'Module {index}',
    description: 'Default name for a new module',
  },
  defaultLessonName: {
    id: 'wuti.authoring.planBuilder.defaultLessonName',
    defaultMessage: 'Lesson {index}',
    description: 'Default name for a new lesson',
  },
  defaultUnitName: {
    id: 'wuti.authoring.planBuilder.defaultUnitName',
    defaultMessage: 'Unit {index}',
    description: 'Default name for a new unit',
  },
  defaultContentName: {
    id: 'wuti.authoring.planBuilder.defaultContentName',
    defaultMessage: 'Content',
    description: 'Default name for new content',
  },
  componentHtml: {
    id: 'wuti.authoring.planBuilder.component.html',
    defaultMessage: 'Text',
    description: 'HTML component label in the plan builder',
  },
  componentVideo: {
    id: 'wuti.authoring.planBuilder.component.video',
    defaultMessage: 'Video',
    description: 'Video component label in the plan builder',
  },
  componentProblem: {
    id: 'wuti.authoring.planBuilder.component.problem',
    defaultMessage: 'Quiz',
    description: 'Problem component label in the plan builder',
  },
  componentDiscussion: {
    id: 'wuti.authoring.planBuilder.component.discussion',
    defaultMessage: 'Discussion',
    description: 'Discussion component label in the plan builder',
  },
});

const COMPONENT_OPTIONS: Array<{ value: CoursePlanComponentType; message: any }> = [
  { value: 'html', message: messages.componentHtml },
  { value: 'video', message: messages.componentVideo },
  { value: 'problem', message: messages.componentProblem },
  { value: 'discussion', message: messages.componentDiscussion },
];

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

const CoursePlanBuilder = ({
  structure,
  onChange,
  title,
  description,
  sourceLabel,
  allowRegenerate = false,
  onRegenerate,
}: CoursePlanBuilderProps) => {
  const intl = useIntl();
  const formatMessage = intl.formatMessage;
  const hydratedStructure = hydratePlanStructure(structure);
  const counts = countPlanItems(hydratedStructure);
  const renderedTitle = title || formatMessage(messages.defaultTitle);
  const renderedDescription = description || formatMessage(messages.defaultDescription);

  const updateStructure = (nextSections: CoursePlanSection[]) => {
    onChange({
      ...hydratedStructure,
      sections: nextSections,
    });
  };

  const updateSection = (sectionIndex: number, nextSection: CoursePlanSection) => {
    const nextSections = [...hydratedStructure.sections];
    nextSections[sectionIndex] = nextSection;
    updateStructure(nextSections);
  };

  const updateSubsections = (sectionIndex: number, nextSubsections: CoursePlanSubsection[]) => {
    updateSection(sectionIndex, {
      ...hydratedStructure.sections[sectionIndex],
      subsections: nextSubsections,
    });
  };

  const updateUnits = (
    sectionIndex: number,
    subsectionIndex: number,
    nextUnits: CoursePlanUnit[],
  ) => {
    const section = hydratedStructure.sections[sectionIndex];
    const nextSubsections = [...section.subsections];
    nextSubsections[subsectionIndex] = {
      ...nextSubsections[subsectionIndex],
      units: nextUnits,
    };
    updateSubsections(sectionIndex, nextSubsections);
  };

  const updateComponents = (
    sectionIndex: number,
    subsectionIndex: number,
    unitIndex: number,
    nextComponents: CoursePlanComponent[],
  ) => {
    const subsection = hydratedStructure.sections[sectionIndex].subsections[subsectionIndex];
    const nextUnits = [...subsection.units];
    nextUnits[unitIndex] = {
      ...nextUnits[unitIndex],
      components: nextComponents,
    };
    updateUnits(sectionIndex, subsectionIndex, nextUnits);
  };

  return (
    <section className="ws-plan-builder">
      <div className="ws-plan-builder__header">
        <div>
          {sourceLabel && <p className="ws-plan-builder__eyebrow">{sourceLabel}</p>}
          <h2 className="ws-plan-builder__title">{renderedTitle}</h2>
          <p className="ws-plan-builder__description">{renderedDescription}</p>
        </div>

        <div className="ws-plan-builder__stats" aria-label={formatMessage(messages.statsAria)}>
          <span>{formatMessage(messages.modulesStat, { count: counts.sections })}</span>
          <span>{formatMessage(messages.lessonsStat, { count: counts.subsections })}</span>
          <span>{formatMessage(messages.unitsStat, { count: counts.units })}</span>
        </div>
      </div>

      {hydratedStructure.sections.length > 0 ? (
        <div className="ws-plan-builder__sections">
          {hydratedStructure.sections.map((section, sectionIndex) => (
            <article key={section.id || sectionIndex} className="ws-plan-builder__section">
              <div className="ws-plan-builder__item-head">
                <span className="ws-plan-builder__kicker">
                  {formatMessage(messages.moduleKicker, { index: sectionIndex + 1 })}
                </span>
                <div className="ws-plan-builder__actions">
                  <button
                    type="button"
                    className="ws-plan-builder__icon-btn"
                    onClick={() => updateStructure(moveItem(hydratedStructure.sections, sectionIndex, sectionIndex - 1))}
                    disabled={sectionIndex === 0}
                    aria-label={formatMessage(messages.moveModuleUp)}
                  >
                    <Icon src={ArrowUpward} />
                  </button>
                  <button
                    type="button"
                    className="ws-plan-builder__icon-btn"
                    onClick={() => updateStructure(moveItem(hydratedStructure.sections, sectionIndex, sectionIndex + 1))}
                    disabled={sectionIndex === hydratedStructure.sections.length - 1}
                    aria-label={formatMessage(messages.moveModuleDown)}
                  >
                    <Icon src={ArrowDownward} />
                  </button>
                  <button
                    type="button"
                    className="ws-plan-builder__icon-btn ws-plan-builder__icon-btn--danger"
                    onClick={() => updateStructure(hydratedStructure.sections.filter((_, index) => index !== sectionIndex))}
                    aria-label={formatMessage(messages.deleteModule)}
                  >
                    <Icon src={Delete} />
                  </button>
                </div>
              </div>

              <input
                className="ws-plan-builder__input ws-plan-builder__input--section"
                value={section.display_name}
                onChange={(event) => updateSection(sectionIndex, {
                  ...section,
                  display_name: event.target.value,
                })}
              />

              <div className="ws-plan-builder__subsections">
                {section.subsections.map((subsection, subsectionIndex) => (
                  <div key={subsection.id || subsectionIndex} className="ws-plan-builder__subsection">
                    <div className="ws-plan-builder__item-head">
                      <span className="ws-plan-builder__kicker">
                        {formatMessage(messages.lessonKicker, { index: subsectionIndex + 1 })}
                      </span>
                      <div className="ws-plan-builder__actions">
                        <button
                          type="button"
                          className="ws-plan-builder__icon-btn"
                          onClick={() => updateSubsections(
                            sectionIndex,
                            moveItem(section.subsections, subsectionIndex, subsectionIndex - 1),
                          )}
                          disabled={subsectionIndex === 0}
                          aria-label={formatMessage(messages.moveLessonUp)}
                        >
                          <Icon src={ArrowUpward} />
                        </button>
                        <button
                          type="button"
                          className="ws-plan-builder__icon-btn"
                          onClick={() => updateSubsections(
                            sectionIndex,
                            moveItem(section.subsections, subsectionIndex, subsectionIndex + 1),
                          )}
                          disabled={subsectionIndex === section.subsections.length - 1}
                          aria-label={formatMessage(messages.moveLessonDown)}
                        >
                          <Icon src={ArrowDownward} />
                        </button>
                        <button
                          type="button"
                          className="ws-plan-builder__icon-btn ws-plan-builder__icon-btn--danger"
                          onClick={() => updateSubsections(
                            sectionIndex,
                            section.subsections.filter((_, index) => index !== subsectionIndex),
                          )}
                          aria-label={formatMessage(messages.deleteLesson)}
                        >
                          <Icon src={Delete} />
                        </button>
                      </div>
                    </div>

                    <input
                      className="ws-plan-builder__input"
                      value={subsection.display_name}
                      onChange={(event) => {
                        const nextSubsections = [...section.subsections];
                        nextSubsections[subsectionIndex] = {
                          ...subsection,
                          display_name: event.target.value,
                        };
                        updateSubsections(sectionIndex, nextSubsections);
                      }}
                    />

                    <div className="ws-plan-builder__units">
                      {subsection.units.map((unit, unitIndex) => (
                        <div key={unit.id || unitIndex} className="ws-plan-builder__unit">
                          <div className="ws-plan-builder__unit-main">
                            <input
                              className="ws-plan-builder__input ws-plan-builder__input--unit"
                              value={unit.display_name}
                              onChange={(event) => {
                                const nextUnits = [...subsection.units];
                                nextUnits[unitIndex] = {
                                  ...unit,
                                  display_name: event.target.value,
                                };
                                updateUnits(sectionIndex, subsectionIndex, nextUnits);
                              }}
                            />
                            <div className="ws-plan-builder__unit-actions">
                              <button
                                type="button"
                                className="ws-plan-builder__icon-btn"
                                onClick={() => updateUnits(
                                  sectionIndex,
                                  subsectionIndex,
                                  moveItem(subsection.units, unitIndex, unitIndex - 1),
                                )}
                                disabled={unitIndex === 0}
                                aria-label={formatMessage(messages.moveUnitUp)}
                              >
                                <Icon src={ArrowUpward} />
                              </button>
                              <button
                                type="button"
                                className="ws-plan-builder__icon-btn"
                                onClick={() => updateUnits(
                                  sectionIndex,
                                  subsectionIndex,
                                  moveItem(subsection.units, unitIndex, unitIndex + 1),
                                )}
                                disabled={unitIndex === subsection.units.length - 1}
                                aria-label={formatMessage(messages.moveUnitDown)}
                              >
                                <Icon src={ArrowDownward} />
                              </button>
                              <button
                                type="button"
                                className="ws-plan-builder__icon-btn ws-plan-builder__icon-btn--danger"
                                onClick={() => updateUnits(
                                  sectionIndex,
                                  subsectionIndex,
                                  subsection.units.filter((_, index) => index !== unitIndex),
                                )}
                                aria-label={formatMessage(messages.deleteUnit)}
                              >
                                <Icon src={Delete} />
                              </button>
                            </div>
                          </div>

                          <div className="ws-plan-builder__components">
                            {unit.components.map((component, componentIndex) => (
                              <div key={component.id || componentIndex} className="ws-plan-builder__component">
                                <input
                                  className="ws-plan-builder__input ws-plan-builder__input--component"
                                  value={component.display_name}
                                  onChange={(event) => {
                                    const nextComponents = [...unit.components];
                                    nextComponents[componentIndex] = {
                                      ...component,
                                      display_name: event.target.value,
                                    };
                                    updateComponents(sectionIndex, subsectionIndex, unitIndex, nextComponents);
                                  }}
                                />
                                <select
                                  className="ws-plan-builder__select"
                                  value={component.component_type}
                                  onChange={(event) => {
                                    const nextComponents = [...unit.components];
                                    nextComponents[componentIndex] = createPlanComponent(
                                      component.display_name,
                                      event.target.value as CoursePlanComponentType,
                                    );
                                    updateComponents(sectionIndex, subsectionIndex, unitIndex, nextComponents);
                                  }}
                                >
                                  {COMPONENT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {formatMessage(option.message)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="ws-plan-builder__icon-btn ws-plan-builder__icon-btn--danger"
                                  onClick={() => updateComponents(
                                    sectionIndex,
                                    subsectionIndex,
                                    unitIndex,
                                    unit.components.filter((_, index) => index !== componentIndex),
                                  )}
                                  aria-label={formatMessage(messages.deleteContent)}
                                >
                                  <Icon src={Delete} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="ws-plan-builder__link"
                              onClick={() => updateComponents(
                                sectionIndex,
                                subsectionIndex,
                                unitIndex,
                                [...unit.components, createPlanComponent(formatMessage(messages.defaultContentName))],
                              )}
                            >
                              <Icon src={Add} />
                              {formatMessage(messages.addContent)}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="ws-plan-builder__link"
                      onClick={() => updateUnits(
                        sectionIndex,
                        subsectionIndex,
                        [...subsection.units, createPlanUnit(formatMessage(messages.defaultUnitName, { index: subsection.units.length + 1 }))],
                      )}
                    >
                      <Icon src={Add} />
                      {formatMessage(messages.addUnit)}
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="ws-plan-builder__link"
                onClick={() => updateSubsections(
                  sectionIndex,
                  [...section.subsections, createPlanSubsection(formatMessage(messages.defaultLessonName, { index: section.subsections.length + 1 }))],
                )}
              >
                <Icon src={Add} />
                {formatMessage(messages.addLesson)}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="ws-plan-builder__empty">
          <p className="ws-plan-builder__empty-title">{formatMessage(messages.emptyTitle)}</p>
          <p className="ws-plan-builder__empty-copy">
            {formatMessage(messages.emptyCopy)}
          </p>
        </div>
      )}

      <div className="ws-plan-builder__footer">
        <button
          type="button"
          className="ws-plan-builder__secondary"
          onClick={() => updateStructure([
            ...hydratedStructure.sections,
            createPlanSection(formatMessage(messages.defaultModuleName, {
              index: hydratedStructure.sections.length + 1,
            })),
          ])}
        >
          <Icon src={Add} />
          {formatMessage(messages.addModule)}
        </button>

        {allowRegenerate && onRegenerate && (
          <button
            type="button"
            className="ws-plan-builder__secondary"
            onClick={onRegenerate}
          >
            <Icon src={Refresh} />
            {formatMessage(messages.regeneratePlan)}
          </button>
        )}
      </div>
    </section>
  );
};

export default CoursePlanBuilder;
