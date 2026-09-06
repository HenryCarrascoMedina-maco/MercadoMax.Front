export type DashboardRoleKey = 'admin' | 'supplier' | 'carrier' | 'merchant' | 'generic';

export type DashboardValueFormat = 'number' | 'currency' | 'text';

export interface DashboardMetric {
  key: string;
  labelKey: string;
  value: number | string;
  format?: DashboardValueFormat;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
}

export interface DashboardInsight {
  labelKey: string;
  value: number | string;
  format?: DashboardValueFormat;
}

export interface DashboardTableColumn {
  key: string;
  labelKey: string;
  format?: DashboardValueFormat;
}

export interface DashboardTable {
  titleKey: string;
  emptyKey: string;
  columns: DashboardTableColumn[];
  rows: Array<Record<string, string | number | null | undefined>>;
}

export interface DashboardSection {
  roleKey: DashboardRoleKey;
  titleKey: string;
  subtitleKey: string;
  metrics: DashboardMetric[];
  insights: DashboardInsight[];
  table?: DashboardTable;
}

export interface DashboardBundle {
  generatedAt: string;
  sections: DashboardSection[];
}
