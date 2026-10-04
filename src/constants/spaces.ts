import { ChatSpaceInfo } from '../types';

export interface DepartmentConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  accentColor: string;
  description: string;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'microbiology',
    name: 'Microbiology',
    shortName: 'MCB',
    icon: 'Microscope',
    accentColor: 'emerald',
    description: 'Bacteriology, virology, mycology, lab protocols, and MCB course gists.',
  },
  {
    id: 'biochemistry',
    name: 'Biochemistry',
    shortName: 'BCH',
    icon: 'FlaskConical',
    accentColor: 'cyan',
    description: 'Enzymology, metabolism pathways, molecular genetics, and biochemical calculations.',
  },
  {
    id: 'biological-sciences',
    name: 'Biological Sciences',
    shortName: 'BIO',
    icon: 'Leaf',
    accentColor: 'green',
    description: 'Ecology, botany, zoology, field trips, biodiversity, and general biology studies.',
  },
  {
    id: 'molecular-biology',
    name: 'Molecular Biology',
    shortName: 'MOL',
    icon: 'Dna',
    accentColor: 'indigo',
    description: 'Recombinant DNA, genomics, proteomics, PCR techniques, and cell biology.',
  },
];

export const LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: '100', label: '100 Level' },
  { id: '200', label: '200 Level' },
  { id: '300', label: '300 Level' },
  { id: '400', label: '400 Level' },
];

export const SPECIAL_SPACES: ChatSpaceInfo[] = [
  {
    id: 'announcements',
    name: 'NABIOSOS Announcement',
    category: 'general',
    description: 'Official association circulars, executive updates, exam schedules, and department news.',
    icon: 'Megaphone',
    badgeColor: 'amber',
  },
  {
    id: 'market-update',
    name: 'NABIOSOS Market Update',
    category: 'general',
    description: 'Student marketplace for textbooks, lab coats, dissection kits, scientific calculators, and services.',
    icon: 'ShoppingBag',
    badgeColor: 'purple',
  },
  {
    id: 'sport-space',
    name: 'NABIOSOS Sport Space',
    category: 'general',
    description: "Dean's Cup live updates, inter-departmental football leagues, basketball, and athletics banter.",
    icon: 'Trophy',
    badgeColor: 'rose',
  },
];

export function getSpaceDetails(spaceId: string): ChatSpaceInfo {
  // Check special spaces
  const special = SPECIAL_SPACES.find((s) => s.id === spaceId);
  if (special) return special;

  // Check department spaces format: "deptId-level"
  const parts = spaceId.split('-');
  const deptId = parts.slice(0, -1).join('-');
  const levelId = parts[parts.length - 1];

  const dept = DEPARTMENTS.find((d) => d.id === deptId || d.id === spaceId);
  if (dept) {
    const levelObj = LEVELS.find((l) => l.id === levelId);
    const levelText = levelObj ? levelObj.label : 'General Hub';
    return {
      id: spaceId,
      name: `${dept.name} — ${levelText}`,
      category: 'department',
      department: dept.name,
      level: levelText,
      description: `${dept.description} (${levelText})`,
      icon: dept.icon,
      badgeColor: dept.accentColor,
    };
  }

  return {
    id: spaceId,
    name: 'Community Space',
    category: 'general',
    description: 'Live community conversation.',
    icon: 'MessageSquare',
    badgeColor: 'emerald',
  };
}

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];
