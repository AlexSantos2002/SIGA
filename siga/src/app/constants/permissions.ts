export const PERMISSIONS = {
  usersView: 'users.view',
  usersCreate: 'users.create',
  usersUpdate: 'users.update',
  usersDeactivate: 'users.deactivate',

  animalsCreate: 'animals.create',
  animalsUpdate: 'animals.update',
  animalsDelete: 'animals.delete',
  animalsExport: 'animals.export',

  adoptersCreate: 'adopters.create',
  adoptersUpdate: 'adopters.update',
  adoptersDelete: 'adopters.delete',

  adoptionsManage: 'adoptions.manage',
  careManage: 'care.manage',
  statisticsView: 'statistics.view',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionOption {
  key: PermissionKey;
  label: string;
  description: string;
  group: string;
}

export type PermissionMap = Partial<Record<PermissionKey, boolean>>;

export const PERMISSION_OPTIONS: PermissionOption[] = [
  {
    key: PERMISSIONS.usersView,
    label: 'Ver utilizadores',
    description: 'Pode consultar os perfis da organizacao.',
    group: 'Equipa',
  },
  {
    key: PERMISSIONS.usersCreate,
    label: 'Criar utilizadores',
    description: 'Pode criar novos acessos para a organizacao.',
    group: 'Equipa',
  },
  {
    key: PERMISSIONS.usersUpdate,
    label: 'Editar permissoes',
    description: 'Pode alterar nome, estado e permissoes de outros utilizadores.',
    group: 'Equipa',
  },
  {
    key: PERMISSIONS.usersDeactivate,
    label: 'Desativar utilizadores',
    description: 'Pode bloquear o acesso de membros da equipa.',
    group: 'Equipa',
  },
  {
    key: PERMISSIONS.animalsCreate,
    label: 'Criar animais',
    description: 'Pode adicionar novos animais.',
    group: 'Animais',
  },
  {
    key: PERMISSIONS.animalsUpdate,
    label: 'Editar animais',
    description: 'Pode alterar informacao dos animais.',
    group: 'Animais',
  },
  {
    key: PERMISSIONS.animalsDelete,
    label: 'Eliminar animais',
    description: 'Pode remover animais da organizacao.',
    group: 'Animais',
  },
  {
    key: PERMISSIONS.animalsExport,
    label: 'Exportar relatorios',
    description: 'Pode gerar PDFs dos animais.',
    group: 'Animais',
  },
  {
    key: PERMISSIONS.adoptersCreate,
    label: 'Criar adotantes',
    description: 'Pode registar novos adotantes.',
    group: 'Adotantes',
  },
  {
    key: PERMISSIONS.adoptersUpdate,
    label: 'Editar adotantes',
    description: 'Pode alterar dados de adotantes.',
    group: 'Adotantes',
  },
  {
    key: PERMISSIONS.adoptersDelete,
    label: 'Eliminar adotantes',
    description: 'Pode remover adotantes.',
    group: 'Adotantes',
  },
  {
    key: PERMISSIONS.adoptionsManage,
    label: 'Gerir adocoes',
    description: 'Pode criar e atualizar processos de adocao.',
    group: 'Adocoes',
  },
  {
    key: PERMISSIONS.careManage,
    label: 'Gerir cuidados',
    description: 'Pode criar, concluir e remover vacinas, desparasitacoes e consultas.',
    group: 'Cuidados',
  },
  {
    key: PERMISSIONS.statisticsView,
    label: 'Ver estatisticas',
    description: 'Pode consultar estatisticas da organizacao.',
    group: 'Estatisticas',
  },
];

export const ALL_PERMISSIONS = PERMISSION_OPTIONS.map((permission) => permission.key);

export function buildFullPermissionMap(): PermissionMap {
  return ALL_PERMISSIONS.reduce<PermissionMap>((permissions, permission) => {
    permissions[permission] = true;
    return permissions;
  }, {});
}
