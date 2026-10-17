/**
 * Core skills, presented as Spirit Rings of the operator's Martial Soul.
 * The level decides the ring rank: 95–94 crimson, 92–90 black, 88 purple.
 */

import type { RingTier } from './rings';

export interface Skill {
  id: string;
  /** Plain-language discipline — what a recruiter searches for. */
  discipline: string;
  /** Soul Skill name (flavour). */
  name: string;
  level: number;
  ring: RingTier;
  kind: string;
  icon: SkillIcon;
  stats: string[];
  techniques: string[];
  description: string;
}

export type SkillIcon = 'eye' | 'bow' | 'mirror' | 'barrier' | 'scroll';

export const SKILLS: Skill[] = [
  {
    id: 'threat_intel',
    discipline: 'Threat Intelligence',
    name: 'Heaven-Piercing Eye',
    level: 95,
    ring: 'r100k',
    kind: 'Insight Soul Skill',
    icon: 'eye',
    stats: ['+95% IoC Detection Rate', '+93% Threat Feed Integration'],
    techniques: ['Active Surveillance V', 'Adversary Profiling IV'],
    description: 'A crimson-ringed spirit eye that scans global threat feeds, identifying adversary campaigns and indicators before intrusion attempts reach the perimeter.'
  },
  {
    id: 'threat_hunting',
    discipline: 'Threat Hunting',
    name: 'Shadow-Tracking Spirit Bow',
    level: 92,
    ring: 'r10k',
    kind: 'Pursuit Soul Skill',
    icon: 'bow',
    stats: ['+92% Stealth Threat Tracking', '+90% Post-Breach Detection'],
    techniques: ['MITRE ATT&CK Alignment V', 'Anomaly Identification IV'],
    description: 'Fires tracking sigils into system processes, isolating stealthy persistent threats that slip past perimeter walls and evade signature-based detection.'
  },
  {
    id: 'threat_analysis',
    discipline: 'Threat Analysis',
    name: 'Jade Mirror Dissection',
    level: 94,
    ring: 'r100k',
    kind: 'Analysis Soul Skill',
    icon: 'mirror',
    stats: ['+94% Malware Behaviour Extraction', '+95% Attack Vector Profiling'],
    techniques: ['Reverse Engineering V', 'Secure Sandbox IV'],
    description: 'A jade spirit mirror that extracts behavioural vectors and reverse-engineers binary payloads inside a sealed sandbox without risking live system integrity.'
  },
  {
    id: 'networks',
    discipline: 'Secure Networks & Infrastructure',
    name: 'Aegis Barrier Formation',
    level: 90,
    ring: 'r10k',
    kind: 'Defence Soul Skill',
    icon: 'barrier',
    stats: ['+90% Perimeter Defence Coverage', '+95% Encrypted Flow Tracking'],
    techniques: ['Stateful Packet Inspection V', 'DNSSEC Fortification IV'],
    description: 'A spirit barrier formation that inspects stateful packets in real time, blocks anomalous traffic and enforces secure network topologies across every subnet.'
  },
  {
    id: 'ai_prompt',
    discipline: 'AI Prompt Engineering',
    name: 'Oracle Weaving Scroll',
    level: 88,
    ring: 'r1k',
    kind: 'Command Soul Skill',
    icon: 'scroll',
    stats: ['+88% Dynamic LLM Prompting Accuracy', '+92% Context Extraction'],
    techniques: ['Few-Shot Orchestration V', 'System Role Guardrails IV'],
    description: 'A spirit scroll that commands large language models, weaving optimised prompt frames, context flows and guardrail boundaries for secure AI-assisted operations.'
  }
];
