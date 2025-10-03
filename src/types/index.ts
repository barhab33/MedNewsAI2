export interface MedicalNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  source_url: string;
  original_source: string;
  image_url: string;
  published_at: string;
  created_at: string;
  updated_at?: string;
  processing_status?: string;
  raw_content?: string;
  fetch_error?: string;
}

export interface AISummary {
  id: string;
  article_id: string;
  model_provider: string;
  model_name: string;
  summary_text: string;
  content_text?: string;
  generation_time_ms?: number;
  tokens_used?: number;
  error_message?: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  email: string;
  name?: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type MedicalCategory =
  | 'All'
  | 'Diagnostics'
  | 'Surgery'
  | 'Drug Discovery'
  | 'Medical Imaging'
  | 'Genomics'
  | 'Patient Care'
  | 'Clinical Trials'
  | 'Telemedicine'
  | 'Research';