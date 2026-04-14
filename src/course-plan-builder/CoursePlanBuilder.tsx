import React from 'react';
import { Icon } from '@openedx/paragon';
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  Delete,
  Refresh,
} from '@openedx/paragon/icons';

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

const COMPONENT_OPTIONS: Array<{ value: CoursePlanComponentType; label: string }> = [
  { value: 'html', label: 'Texte' },
  { value: 'video', label: 'Video' },
  { value: 'problem', label: 'Quiz' },
  { value: 'discussion', label: 'Discussion' },
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
  title = 'Plan du cours',
  description = 'Ajustez les modules, les lecons, les unites et les contenus avant de creer le cours.',
  sourceLabel,
  allowRegenerate = false,
  onRegenerate,
}: CoursePlanBuilderProps) => {
  const hydratedStructure = hydratePlanStructure(structure);
  const counts = countPlanItems(hydratedStructure);

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
          <h2 className="ws-plan-builder__title">{title}</h2>
          <p className="ws-plan-builder__description">{description}</p>
        </div>

        <div className="ws-plan-builder__stats" aria-label="Resume du plan">
          <span>{counts.sections} modules</span>
          <span>{counts.subsections} lecons</span>
          <span>{counts.units} unites</span>
        </div>
      </div>

      {hydratedStructure.sections.length > 0 ? (
        <div className="ws-plan-builder__sections">
          {hydratedStructure.sections.map((section, sectionIndex) => (
            <article key={section.id || sectionIndex} className="ws-plan-builder__section">
              <div className="ws-plan-builder__item-head">
                <span className="ws-plan-builder__kicker">Module {sectionIndex + 1}</span>
                <div className="ws-plan-builder__actions">
                  <button
                    type="button"
                    className="ws-plan-builder__icon-btn"
                    onClick={() => updateStructure(moveItem(hydratedStructure.sections, sectionIndex, sectionIndex - 1))}
                    disabled={sectionIndex === 0}
                    aria-label="Monter le module"
                  >
                    <Icon src={ArrowUpward} />
                  </button>
                  <button
                    type="button"
                    className="ws-plan-builder__icon-btn"
                    onClick={() => updateStructure(moveItem(hydratedStructure.sections, sectionIndex, sectionIndex + 1))}
                    disabled={sectionIndex === hydratedStructure.sections.length - 1}
                    aria-label="Descendre le module"
                  >
                    <Icon src={ArrowDownward} />
                  </button>
                  <button
                    type="button"
                    className="ws-plan-builder__icon-btn ws-plan-builder__icon-btn--danger"
                    onClick={() => updateStructure(hydratedStructure.sections.filter((_, index) => index !== sectionIndex))}
                    aria-label="Supprimer le module"
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
                      <span className="ws-plan-builder__kicker">Lecon {subsectionIndex + 1}</span>
                      <div className="ws-plan-builder__actions">
                        <button
                          type="button"
                          className="ws-plan-builder__icon-btn"
                          onClick={() => updateSubsections(
                            sectionIndex,
                            moveItem(section.subsections, subsectionIndex, subsectionIndex - 1),
                          )}
                          disabled={subsectionIndex === 0}
                          aria-label="Monter la lecon"
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
                          aria-label="Descendre la lecon"
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
                          aria-label="Supprimer la lecon"
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
                                aria-label="Monter l'unite"
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
                                aria-label="Descendre l'unite"
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
                                aria-label="Supprimer l'unite"
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
                                    <option key={option.value} value={option.value}>{option.label}</option>
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
                                  aria-label="Supprimer le contenu"
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
                                [...unit.components, createPlanComponent()],
                              )}
                            >
                              <Icon src={Add} />
                              Ajouter un contenu
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
                        [...subsection.units, createPlanUnit(`Unite ${subsection.units.length + 1}`)],
                      )}
                    >
                      <Icon src={Add} />
                      Ajouter une unite
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="ws-plan-builder__link"
                onClick={() => updateSubsections(
                  sectionIndex,
                  [...section.subsections, createPlanSubsection(`Lecon ${section.subsections.length + 1}`)],
                )}
              >
                <Icon src={Add} />
                Ajouter une lecon
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="ws-plan-builder__empty">
          <p className="ws-plan-builder__empty-title">Le cours demarrera avec un plan vide.</p>
          <p className="ws-plan-builder__empty-copy">
            Ajoutez un premier module maintenant, ou continuez pour construire le cours dans l'outline.
          </p>
        </div>
      )}

      <div className="ws-plan-builder__footer">
        <button
          type="button"
          className="ws-plan-builder__secondary"
          onClick={() => updateStructure([...hydratedStructure.sections, createPlanSection(`Module ${hydratedStructure.sections.length + 1}`)])}
        >
          <Icon src={Add} />
          Ajouter un module
        </button>

        {allowRegenerate && onRegenerate && (
          <button
            type="button"
            className="ws-plan-builder__secondary"
            onClick={onRegenerate}
          >
            <Icon src={Refresh} />
            Regenerer le plan
          </button>
        )}
      </div>
    </section>
  );
};

export default CoursePlanBuilder;
