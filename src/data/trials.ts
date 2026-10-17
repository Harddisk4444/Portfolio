/**
 * Projects, presented as Soul Trials. Clearing a trial grants Soul Power (XP).
 */

export interface Trial {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  tech: string[];
}

export const TRIALS: Trial[] = [
  {
    id: 'quest_1',
    title: 'Zero-Trust Gatekeeper',
    description: 'Engineered a highly resilient Go microservices API gateway integrated with HashiCorp Vault. Enforces strict zero-trust token checking with sub-millisecond overhead.',
    rewardXP: 300,
    tech: ['Go', 'HashiCorp Vault', 'Docker', 'Kubernetes']
  },
  {
    id: 'quest_2',
    title: 'Spirit Forge SecOps Pipeline',
    description: 'Constructed an automated DevSecOps build and audit conveyor utilising GitHub Actions. Performs static analysis (SAST), software composition analysis (SCA) and dependency checks.',
    rewardXP: 300,
    tech: ['GitHub Actions', 'Trivy', 'SonarQube', 'Docker']
  },
  {
    id: 'quest_3',
    title: 'Jade Vault Cache Ledger',
    description: 'Configured a high-throughput transaction storage system using Python, Redis connection pools and distributed token-bucket rate limiters. Holds system stability under heavy concurrent load.',
    rewardXP: 300,
    tech: ['Python', 'gRPC', 'Redis', 'Kubernetes']
  }
];
