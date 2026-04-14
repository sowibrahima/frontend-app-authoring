import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import {
  CoursePlanStructure,
  CoursePlanTemplate,
  CoursePlanTemplateSummary,
} from '../../course-plan-builder';

const getApiRoot = () => new URL('/api/wutiskill-ai', getConfig().STUDIO_BASE_URL).href.replace(/\/$/, '');

const normalizeTemplateSummary = (template: any): CoursePlanTemplateSummary => ({
  id: template.id,
  slug: template.slug,
  name: template.name,
  description: template.description || '',
  org: template.org || null,
  visibility: template.visibility,
  language: template.language || 'fr',
  status: template.status,
  metadata: template.metadata || {},
  createdAt: template.created_at,
  updatedAt: template.updated_at,
});

const normalizeTemplate = (template: any): CoursePlanTemplate => ({
  ...normalizeTemplateSummary(template),
  structure: template.structure || { sections: [] },
});

export async function getCoursePlanTemplates({
  org,
  includeStructure = false,
  includeAll = false,
}: {
  org?: string;
  includeStructure?: boolean;
  includeAll?: boolean;
} = {}): Promise<CoursePlanTemplateSummary[]> {
  const params = new URLSearchParams();
  if (org) {
    params.set('org', org);
  }
  if (includeStructure) {
    params.set('include_structure', 'true');
  }
  if (includeAll) {
    params.set('include_all', 'true');
  }

  const query = params.toString();
  const { data } = await getAuthenticatedHttpClient().get(
    `${getApiRoot()}/course-plan-templates/${query ? `?${query}` : ''}`,
  );

  return (data.templates || []).map(normalizeTemplateSummary);
}

export async function getCoursePlanTemplate(templateId: string): Promise<CoursePlanTemplate> {
  const { data } = await getAuthenticatedHttpClient().get(
    `${getApiRoot()}/course-plan-templates/${templateId}/`,
  );

  return normalizeTemplate(data);
}

export async function createCoursePlanTemplate(payload: {
  name: string;
  description?: string;
  org?: string | null;
  visibility?: 'default' | 'org';
  language?: string;
  status?: 'draft' | 'published' | 'archived';
  structure: CoursePlanStructure;
}): Promise<CoursePlanTemplate> {
  const { data } = await getAuthenticatedHttpClient().post(
    `${getApiRoot()}/course-plan-templates/`,
    payload,
  );

  return normalizeTemplate(data);
}

export async function updateCoursePlanTemplate(
  templateId: string,
  payload: Partial<{
    name: string;
    description: string;
    org: string | null;
    visibility: 'default' | 'org';
    language: string;
    status: 'draft' | 'published' | 'archived';
    structure: CoursePlanStructure;
    changelog: string;
  }>,
): Promise<CoursePlanTemplate> {
  const { data } = await getAuthenticatedHttpClient().patch(
    `${getApiRoot()}/course-plan-templates/${templateId}/`,
    payload,
  );

  return normalizeTemplate(data);
}

export async function duplicateCoursePlanTemplate(
  templateId: string,
  payload: {
    name?: string;
    org?: string | null;
    visibility?: 'default' | 'org';
    status?: 'draft' | 'published';
  } = {},
): Promise<CoursePlanTemplate> {
  const { data } = await getAuthenticatedHttpClient().post(
    `${getApiRoot()}/course-plan-templates/${templateId}/duplicate/`,
    payload,
  );

  return normalizeTemplate(data);
}

export async function archiveCoursePlanTemplate(templateId: string): Promise<CoursePlanTemplate> {
  const { data } = await getAuthenticatedHttpClient().delete(
    `${getApiRoot()}/course-plan-templates/${templateId}/`,
  );

  return normalizeTemplate(data);
}

export async function applyCoursePlanToCourse(
  courseId: string,
  structure: CoursePlanStructure,
  mode: 'append' | 'replace' = 'append',
): Promise<any> {
  const { data } = await getAuthenticatedHttpClient().post(
    `${getApiRoot()}/courses/${courseId}/plans/apply/`,
    {
      structure,
      mode,
    },
  );

  return data;
}

export async function uploadCourseGenerationFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await getAuthenticatedHttpClient().post(
    `${getApiRoot()}/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}

export async function createCourseGenerationJob(courseId: string, payload: {
  instructions?: string;
  sourceText?: string;
  filePaths?: string[];
}): Promise<any> {
  const { data } = await getAuthenticatedHttpClient().post(
    `${getApiRoot()}/courses/${courseId}/generate/`,
    {
      instructions: payload.instructions || '',
      source_text: payload.sourceText || '',
      file_paths: payload.filePaths || [],
      source_urls: [],
      auto_import: false,
    },
  );

  return data;
}

export async function getCourseGenerationJob(jobId: string): Promise<any> {
  const { data } = await getAuthenticatedHttpClient().get(`${getApiRoot()}/jobs/${jobId}/`);
  return data;
}
