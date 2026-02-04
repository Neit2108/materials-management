
export interface Category {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  categoryId: string;
}

export interface ProductTemplate {
  id: string;
  name: string;
  categoryId: string;
  manufacturerId: string;
  unitId: string;
  // Metadata for display
  categoryName: string;
  manufacturerName: string;
  unitName: string;
}

export interface ProductDefinition {
  id: string;
  code: string;
  templateId: string;
  name: string;
  category: string;
  manufacturer: string;
  unit: string;
}

export interface ImportRecord {
  id: string;
  productId: string;
  quantity: number;
  importPrice: number;
  sellingPrice: number;
  year: number;
  invoiceNumber: string;
  invoiceImage?: string;
  date: string;
}

export interface SaleRecord {
  id: string;
  productId: string;
  importRecordId: string;
  quantity: number;
  price: number;
  date: string;
}

export interface AppData {
  products: ProductDefinition[];
  productTemplates: ProductTemplate[];
  imports: ImportRecord[];
  sales: SaleRecord[];
  categories: Category[];
  manufacturers: Manufacturer[];
  units: Unit[];
}

export type Tab = 'admin' | 'import' | 'sales' | 'stats' | 'inventory' | 'guide';
