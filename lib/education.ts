import educationData from './education.json';

export interface EducationEntry {
  name: string;
  description: string;
  keyGrapes: string[];
  style: string;
}

const index = educationData as Record<string, EducationEntry>;

export function getEducation(nodeId: string): EducationEntry | undefined {
  return index[nodeId];
}

/** Build a var:{slug} education ID from a grape name. Matches Python slugify in draft-grape-education.py. */
export function grapeEducationId(grape: string): string {
  return `var:${grape
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip combining marks (É→E, ô→o)
    .replace(/['\u2019\u02bc\u00b7]/g, '-') // apostrophes + middle dot → hyphen (Nero d'Avola → nero-d-avola)
    .replace(/\s+/g, '-')                   // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '')             // strip remaining non-alphanumeric
    .replace(/-{2,}/g, '-')                 // collapse consecutive hyphens
    .replace(/^-|-$/g, '')}`;               // trim leading/trailing hyphens
}
