import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@openedx/paragon';
import { ArrowBack, Add, Check, Delete } from '@openedx/paragon/icons';

import WutiskillStudioHomeHeader from '../header/WutiskillStudioHomeHeader';
import { CoursePlanBuilder, CoursePlanStructure, CoursePlanTemplate } from '../course-plan-builder';
import { createEmptyPlanStructure, hydratePlanStructure } from '../course-plan-builder/utils';
import { getOrganizations } from '../generic/data/api';
import {
  archiveCoursePlanTemplate,
  createCoursePlanTemplate,
  getCoursePlanTemplate,
  getCoursePlanTemplates,
  updateCoursePlanTemplate,
} from './data/api';
import './CoursePlanTemplatesPage.scss';

const CoursePlanTemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CoursePlanTemplate[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CoursePlanTemplate | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'default' | 'org'>('org');
  const [statusValue, setStatusValue] = useState<'draft' | 'published' | 'archived'>('draft');
  const [structure, setStructure] = useState<CoursePlanStructure>(createEmptyPlanStructure('', 'fr'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const orgOptions = useMemo(() => Array.from(new Set(organizations.filter(Boolean))).sort(), [organizations]);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [templateList, orgs] = await Promise.all([
        getCoursePlanTemplates({ includeAll: true }),
        getOrganizations().catch(() => []),
      ]);
      setTemplates(templateList as CoursePlanTemplate[]);
      setOrganizations(orgs);
      if (!selectedOrg && orgs.length === 1) {
        setSelectedOrg(orgs[0]);
      }
    } catch (loadError: any) {
      setError(loadError?.message || 'Impossible de charger les modèles.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTemplate = async (templateId: string) => {
    setError('');
    try {
      const template = await getCoursePlanTemplate(templateId);
      setSelectedTemplate(template);
      setName(template.name);
      setDescription(template.description || '');
      setVisibility(template.visibility);
      setStatusValue(template.status);
      setSelectedOrg(template.org || selectedOrg);
      setStructure(hydratePlanStructure(template.structure, template.name, template.language));
    } catch (selectError: any) {
      setError(selectError?.message || 'Impossible de charger ce modèle.');
    }
  };

  const createNewTemplate = () => {
    const draftName = 'Nouveau modèle';
    setSelectedTemplate(null);
    setName(draftName);
    setDescription('');
    setVisibility(selectedOrg ? 'org' : 'default');
    setStatusValue('draft');
    setStructure(createEmptyPlanStructure(draftName, 'fr'));
  };

  const saveTemplate = async () => {
    if (!name.trim()) {
      setError('Le nom du modèle est requis.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        description,
        visibility,
        org: visibility === 'org' ? selectedOrg : null,
        language: structure.language || 'fr',
        status: statusValue,
        structure: {
          ...structure,
          display_name: structure.display_name || name.trim(),
        },
      };

      const saved = selectedTemplate
        ? await updateCoursePlanTemplate(selectedTemplate.id, payload)
        : await createCoursePlanTemplate(payload);

      setSelectedTemplate(saved);
      await loadTemplates();
      await selectTemplate(saved.id);
    } catch (saveError: any) {
      setError(saveError?.message || 'Impossible d’enregistrer le modèle.');
    } finally {
      setIsSaving(false);
    }
  };

  const archiveSelectedTemplate = async () => {
    if (!selectedTemplate) {
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await archiveCoursePlanTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (archiveError: any) {
      setError(archiveError?.message || 'Impossible d’archiver le modèle.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ws-template-page">
      <WutiskillStudioHomeHeader />
      <main className="ws-template-page__body">
        <button
          type="button"
          className="ws-template-page__back"
          onClick={() => navigate('/home')}
        >
          <Icon src={ArrowBack} />
          Retour au tableau de bord
        </button>

        <div className="ws-template-page__header">
          <div>
            <p className="ws-template-page__eyebrow">Modèles de plan</p>
            <h1 className="ws-template-page__title">Gérer les modèles de cours</h1>
            <p className="ws-template-page__subtitle">
              Créez des modèles globaux ou spécifiques à une organisation, puis réutilisez-les dans l’assistant de création.
            </p>
          </div>
          <button
            type="button"
            className="ws-template-page__primary"
            onClick={createNewTemplate}
          >
            <Icon src={Add} />
            Nouveau modèle
          </button>
        </div>

        {error && <div className="ws-template-page__error">{error}</div>}

        <div className="ws-template-page__layout">
          <aside className="ws-template-page__sidebar">
            <div className="ws-template-page__filter">
              <label htmlFor="template-org-filter">Organisation</label>
              <select
                id="template-org-filter"
                value={selectedOrg}
                onChange={(event) => setSelectedOrg(event.target.value)}
              >
                <option value="">Toutes</option>
                {orgOptions.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="ws-template-page__empty">Chargement des modèles...</div>
            ) : (
              <div className="ws-template-page__list">
                {templates
                  .filter((template) => (
                    !selectedOrg
                    || template.visibility === 'default'
                    || template.org === selectedOrg
                  ))
                  .map((template) => (
                    <button
                      type="button"
                      key={template.id}
                      className={`ws-template-page__list-item${selectedTemplate?.id === template.id ? ' ws-template-page__list-item--active' : ''}`}
                      onClick={() => selectTemplate(template.id)}
                    >
                      <span>{template.name}</span>
                      <small>
                        {template.visibility === 'default' ? 'Global' : template.org}
                        {' · '}
                        {template.status}
                      </small>
                    </button>
                  ))}
              </div>
            )}
          </aside>

          <section className="ws-template-page__editor">
            <div className="ws-template-page__form-grid">
              <div className="ws-template-page__field">
                <label htmlFor="template-name">Nom du modèle</label>
                <input
                  id="template-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setStructure((prev) => ({ ...prev, display_name: event.target.value }));
                  }}
                  placeholder="ex. Bootcamp pratique"
                />
              </div>
              <div className="ws-template-page__field">
                <label htmlFor="template-status">Statut</label>
                <select
                  id="template-status"
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value as typeof statusValue)}
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
              <div className="ws-template-page__field">
                <label htmlFor="template-visibility">Portée</label>
                <select
                  id="template-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as typeof visibility)}
                >
                  <option value="default">Global</option>
                  <option value="org">Organisation</option>
                </select>
              </div>
              <div className="ws-template-page__field">
                <label htmlFor="template-org">Organisation</label>
                <select
                  id="template-org"
                  value={selectedOrg}
                  disabled={visibility === 'default'}
                  onChange={(event) => setSelectedOrg(event.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {orgOptions.map((org) => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>
              <div className="ws-template-page__field ws-template-page__field--wide">
                <label htmlFor="template-description">Description</label>
                <textarea
                  id="template-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Expliquez quand utiliser ce modèle."
                />
              </div>
            </div>

            <CoursePlanBuilder
              structure={structure}
              onChange={setStructure}
              sourceLabel={visibility === 'default' ? 'Modèle global' : 'Modèle organisation'}
              title={name || 'Plan du modèle'}
              description="Ce plan sera proposé comme point de départ dans l'assistant de création."
            />

            <div className="ws-template-page__editor-actions">
              {selectedTemplate && (
                <button
                  type="button"
                  className="ws-template-page__secondary ws-template-page__secondary--danger"
                  onClick={archiveSelectedTemplate}
                  disabled={isSaving}
                >
                  <Icon src={Delete} />
                  Archiver
                </button>
              )}
              <button
                type="button"
                className="ws-template-page__primary"
                onClick={saveTemplate}
                disabled={isSaving}
              >
                <Icon src={Check} />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CoursePlanTemplatesPage;
