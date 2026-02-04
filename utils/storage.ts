
import { AppData } from '../types';

const STORAGE_KEY = 'warehouse_data_v1';

export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const loadData = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      
      // Data Migration & Safety Checks
      if (!Array.isArray(parsed.categories) || (parsed.categories.length > 0 && typeof parsed.categories[0] === 'string')) {
        parsed.categories = (parsed.categories || []).map((name: any) => 
          typeof name === 'string' ? { id: generateId(), name } : name
        );
      }
      
      if (!Array.isArray(parsed.units) || (parsed.units.length > 0 && typeof parsed.units[0] === 'string')) {
        parsed.units = (parsed.units || []).map((name: any) => 
          typeof name === 'string' ? { id: generateId(), name } : name
        );
      }

      if (!parsed.manufacturers) parsed.manufacturers = [];
      if (!parsed.productTemplates) parsed.productTemplates = [];
      if (!parsed.products) parsed.products = [];
      if (!parsed.imports) parsed.imports = [];
      if (!parsed.sales) parsed.sales = [];
      
      return parsed;
    } catch (e) {
      console.error('Error parsing saved data', e);
    }
  }
  
  // Default Initial Data
  const cat1Id = generateId();
  const cat2Id = generateId();
  const unit1Id = generateId();
  const unit2Id = generateId();

  return {
    products: [],
    productTemplates: [],
    imports: [],
    sales: [],
    categories: [
      { id: cat1Id, name: 'Thiết bị Điện' },
      { id: cat2Id, name: 'Vật tư Nước' }
    ],
    manufacturers: [
      { id: generateId(), name: 'Panasonic', categoryId: cat1Id },
      { id: generateId(), name: 'Sino', categoryId: cat1Id },
      { id: generateId(), name: 'Tiền Phong', categoryId: cat2Id }
    ],
    units: [
      { id: unit1Id, name: 'Cái' },
      { id: unit2Id, name: 'Mét' },
      { id: generateId(), name: 'Cuộn' }
    ]
  };
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

declare const JSZip: any;

export const backupData = async (data: AppData) => {
  const zip = new JSZip();
  const json = JSON.stringify(data, null, 2);
  zip.file('warehouse_backup.json', json);
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_${new Date().toISOString().split('T')[0]}.zip`;
  link.click();
};

export const restoreData = async (file: File): Promise<AppData | null> => {
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const jsonFile = Object.values(loadedZip.files).find((f: any) => f.name.endsWith('.json'));
    if (!jsonFile) return null;
    const content = await (jsonFile as any).async('string');
    return JSON.parse(content);
  } catch (e) {
    console.error('Restore failed', e);
    return null;
  }
};
