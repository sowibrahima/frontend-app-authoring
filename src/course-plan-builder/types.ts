export type CoursePlanSource = 'template' | 'ai' | 'scratch';

export type CoursePlanComponentType = 'html' | 'video' | 'problem' | 'discussion';

export interface CoursePlanComponent {
  id?: string;
  component_type: CoursePlanComponentType;
  display_name: string;
  content?: Record<string, unknown>;
}

export interface CoursePlanUnit {
  id?: string;
  display_name: string;
  components: CoursePlanComponent[];
}

export interface CoursePlanSubsection {
  id?: string;
  display_name: string;
  graded?: boolean;
  grade_format?: string;
  units: CoursePlanUnit[];
}

export interface CoursePlanSection {
  id?: string;
  display_name: string;
  subsections: CoursePlanSubsection[];
}

export interface CoursePlanStructure {
  display_name?: string;
  language?: string;
  sections: CoursePlanSection[];
  metadata?: Record<string, unknown>;
}

export interface CoursePlanDraft {
  id?: string;
  source: CoursePlanSource;
  templateId?: string;
  generationJobId?: string;
  structure: CoursePlanStructure;
}

export interface CoursePlanTemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  org: string | null;
  visibility: 'default' | 'org';
  language: string;
  status: 'draft' | 'published' | 'archived';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoursePlanTemplate extends CoursePlanTemplateSummary {
  structure: CoursePlanStructure;
}
