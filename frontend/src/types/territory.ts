export interface Territory {
  id: number;
  name: string;
  wilaya_code?: string;
  population?: number;
  area_km2?: number;
}

export interface Indicator {
  key: string;
  value: number;
  unit: string;
}
