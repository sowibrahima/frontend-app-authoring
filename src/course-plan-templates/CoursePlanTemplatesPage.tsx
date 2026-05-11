import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@openedx/paragon';
import { ArrowBack, Add, Check, Delete } from '@openedx/paragon/icons';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';

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

const messages = defineMessages({
  loadError: {
    id: 'wuti.authoring.templates.loadError',
    defaultMessage: 'Unable to load templates.',
    description: 'Fallback error when loading course plan templates fails',
  },
  selectError: {
    id: 'wuti.authoring.templates.selectError',
    defaultMessage: 'Unable to load this template.',
    description: 'Fallback error when loading one course plan template fails',
  },
  saveError: {
    id: 'wuti.authoring.templates.saveError',
    defaultMessage: 'Unable to save template.',
    description: 'Fallback error when saving a course plan template fails',
  },
  archiveError: {
    id: 'wuti.authoring.templates.archiveError',
    defaultMessage: 'Unable to archive template.',
    description: 'Fallback error when archiving a course plan template fails',
  },
  nameRequired: {
    id: 'wuti.authoring.templates.nameRequired',
    defaultMessage: 'Template name is required.',
    description: 'Validation error for missing template name',
  },
  newTemplateName: {
    id: 'wuti.authoring.templates.newTemplateName',
    defaultMessage: 'New template',
    description: 'Default name for a new course plan template',
  },
  backToDashboard: {
    id: 'wuti.authoring.templates.backToDashboard',
    defaultMessage: 'Back to dashboard',
    description: 'Back link to Studio dashboard',
  },
  eyebrow: {
    id: 'wuti.authoring.templates.eyebrow',
    defaultMessage: 'Plan templates',
    description: 'Eyebrow for the course plan templates page',
  },
  pageTitle: {
    id: 'wuti.authoring.templates.pageTitle',
    defaultMessage: 'Manage course templates',
    description: 'Page title for course plan templates management',
  },
  pageSubtitle: {
    id: 'wuti.authoring.templates.pageSubtitle',
    defaultMessage: 'Create global or organization-specific templates, then reuse them in the creation wizard.',
    description: 'Page subtitle for course plan templates management',
  },
  newTemplate: {
    id: 'wuti.authoring.templates.newTemplate',
    defaultMessage: 'New template',
    description: 'Button label to create a new template',
  },
  organization: {
    id: 'wuti.authoring.templates.organization',
    defaultMessage: 'Organization',
    description: 'Organization label',
  },
  all: {
    id: 'wuti.authoring.templates.all',
    defaultMessage: 'All',
    description: 'All organizations filter option',
  },
  loading: {
    id: 'wuti.authoring.templates.loading',
    defaultMessage: 'Loading templates...',
    description: 'Loading state for templates',
  },
  templateName: {
    id: 'wuti.authoring.templates.templateName',
    defaultMessage: 'Template name',
    description: 'Template name field label',
  },
  templateNamePlaceholder: {
    id: 'wuti.authoring.templates.templateNamePlaceholder',
    defaultMessage: 'e.g. Practical bootcamp',
    description: 'Template name placeholder',
  },
  status: {
    id: 'wuti.authoring.templates.status',
    defaultMessage: 'Status',
    description: 'Template status field label',
  },
  statusDraft: {
    id: 'wuti.authoring.templates.status.draft',
    defaultMessage: 'Draft',
    description: 'Draft template status',
  },
  statusPublished: {
    id: 'wuti.authoring.templates.status.published',
    defaultMessage: 'Published',
    description: 'Published template status',
  },
  statusArchived: {
    id: 'wuti.authoring.templates.status.archived',
    defaultMessage: 'Archived',
    description: 'Archived template status',
  },
  scope: {
    id: 'wuti.authoring.templates.scope',
    defaultMessage: 'Scope',
    description: 'Template visibility scope field label',
  },
  global: {
    id: 'wuti.authoring.templates.global',
    defaultMessage: 'Global',
    description: 'Global template visibility label',
  },
  organizationScope: {
    id: 'wuti.authoring.templates.organizationScope',
    defaultMessage: 'Organization',
    description: 'Organization template visibility label',
  },
  select: {
    id: 'wuti.authoring.templates.select',
    defaultMessage: 'Select',
    description: 'Generic select option',
  },
  description: {
    id: 'wuti.authoring.templates.description',
    defaultMessage: 'Description',
    description: 'Template description field label',
  },
  descriptionPlaceholder: {
    id: 'wuti.authoring.templates.descriptionPlaceholder',
    defaultMessage: 'Explain when to use this template.',
    description: 'Template description placeholder',
  },
  globalTemplateSource: {
    id: 'wuti.authoring.templates.globalTemplateSource',
    defaultMessage: 'Global template',
    description: 'Source label for global template plan builder',
  },
  orgTemplateSource: {
    id: 'wuti.authoring.templates.orgTemplateSource',
    defaultMessage: 'Organization template',
    description: 'Source label for org template plan builder',
  },
  templatePlanTitle: {
    id: 'wuti.authoring.templates.templatePlanTitle',
    defaultMessage: 'Template plan',
    description: 'Fallback title for the template plan builder',
  },
  templatePlanDescription: {
    id: 'wuti.authoring.templates.templatePlanDescription',
    defaultMessage: 'This plan will be offered as a starting point in the creation wizard.',
    description: 'Template plan builder description',
  },
  archive: {
    id: 'wuti.authoring.templates.archive',
    defaultMessage: 'Archive',
    description: 'Button label to archive a template',
  },
  saving: {
    id: 'wuti.authoring.templates.saving',
    defaultMessage: 'Saving...',
    description: 'Saving state for template save button',
  },
  save: {
    id: 'wuti.authoring.templates.save',
    defaultMessage: 'Save',
    description: 'Button label to save a template',
  },
});

const CoursePlanTemplatesPage = () => {
  const intl = useIntl();
  const formatMessage = intl.formatMessage;
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
  const statusLabels = {
    draft: messages.statusDraft,
    published: messages.statusPublished,
    archived: messages.statusArchived,
  };

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
      setError(loadError?.message || formatMessage(messages.loadError));
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
      setError(selectError?.message || formatMessage(messages.selectError));
    }
  };

  const createNewTemplate = () => {
    const draftName = formatMessage(messages.newTemplateName);
    setSelectedTemplate(null);
    setName(draftName);
    setDescription('');
    setVisibility(selectedOrg ? 'org' : 'default');
    setStatusValue('draft');
    setStructure(createEmptyPlanStructure(draftName, 'fr'));
  };

  const saveTemplate = async () => {
    if (!name.trim()) {
      setError(formatMessage(messages.nameRequired));
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
      setError(saveError?.message || formatMessage(messages.saveError));
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
      setError(archiveError?.message || formatMessage(messages.archiveError));
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
          {formatMessage(messages.backToDashboard)}
        </button>

        <div className="ws-template-page__header">
          <div>
            <p className="ws-template-page__eyebrow">{formatMessage(messages.eyebrow)}</p>
            <h1 className="ws-template-page__title">{formatMessage(messages.pageTitle)}</h1>
            <p className="ws-template-page__subtitle">
              {formatMessage(messages.pageSubtitle)}
            </p>
          </div>
          <button
            type="button"
            className="ws-template-page__primary"
            onClick={createNewTemplate}
          >
            <Icon src={Add} />
            {formatMessage(messages.newTemplate)}
          </button>
        </div>

        {error && <div className="ws-template-page__error">{error}</div>}

        <div className="ws-template-page__layout">
          <aside className="ws-template-page__sidebar">
            <div className="ws-template-page__filter">
              <label htmlFor="template-org-filter">{formatMessage(messages.organization)}</label>
              <select
                id="template-org-filter"
                value={selectedOrg}
                onChange={(event) => setSelectedOrg(event.target.value)}
              >
                <option value="">{formatMessage(messages.all)}</option>
                {orgOptions.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="ws-template-page__empty">{formatMessage(messages.loading)}</div>
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
                        {template.visibility === 'default' ? formatMessage(messages.global) : template.org}
                        {' · '}
                        {formatMessage(statusLabels[template.status] || messages.statusDraft)}
                      </small>
                    </button>
                  ))}
              </div>
            )}
          </aside>

          <section className="ws-template-page__editor">
            <div className="ws-template-page__form-grid">
              <div className="ws-template-page__field">
                <label htmlFor="template-name">{formatMessage(messages.templateName)}</label>
                <input
                  id="template-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setStructure((prev) => ({ ...prev, display_name: event.target.value }));
                  }}
                  placeholder={formatMessage(messages.templateNamePlaceholder)}
                />
              </div>
              <div className="ws-template-page__field">
                <label htmlFor="template-status">{formatMessage(messages.status)}</label>
                <select
                  id="template-status"
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value as typeof statusValue)}
                >
                  <option value="draft">{formatMessage(messages.statusDraft)}</option>
                  <option value="published">{formatMessage(messages.statusPublished)}</option>
                  <option value="archived">{formatMessage(messages.statusArchived)}</option>
                </select>
              </div>
              <div className="ws-template-page__field">
                <label htmlFor="template-visibility">{formatMessage(messages.scope)}</label>
                <select
                  id="template-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as typeof visibility)}
                >
                  <option value="default">{formatMessage(messages.global)}</option>
                  <option value="org">{formatMessage(messages.organizationScope)}</option>
                </select>
              </div>
              <div className="ws-template-page__field">
                <label htmlFor="template-org">{formatMessage(messages.organization)}</label>
                <select
                  id="template-org"
                  value={selectedOrg}
                  disabled={visibility === 'default'}
                  onChange={(event) => setSelectedOrg(event.target.value)}
                >
                  <option value="">{formatMessage(messages.select)}</option>
                  {orgOptions.map((org) => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>
              <div className="ws-template-page__field ws-template-page__field--wide">
                <label htmlFor="template-description">{formatMessage(messages.description)}</label>
                <textarea
                  id="template-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={formatMessage(messages.descriptionPlaceholder)}
                />
              </div>
            </div>

            <CoursePlanBuilder
              structure={structure}
              onChange={setStructure}
              sourceLabel={visibility === 'default'
                ? formatMessage(messages.globalTemplateSource)
                : formatMessage(messages.orgTemplateSource)}
              title={name || formatMessage(messages.templatePlanTitle)}
              description={formatMessage(messages.templatePlanDescription)}
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
                  {formatMessage(messages.archive)}
                </button>
              )}
              <button
                type="button"
                className="ws-template-page__primary"
                onClick={saveTemplate}
                disabled={isSaving}
              >
                <Icon src={Check} />
                {isSaving ? formatMessage(messages.saving) : formatMessage(messages.save)}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CoursePlanTemplatesPage;
