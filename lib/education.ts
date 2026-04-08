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
