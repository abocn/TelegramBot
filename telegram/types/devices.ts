interface Device {
  brand: string;
  codename: string;
  model: string;
  name: string;
}

// ====== GSMARENA ======
interface PhoneSearchResult {
  name: string;
  url: string;
}

interface PhoneDetails {
  specs: Record<string, Record<string, string>>;
  name?: string;
  url?: string;
  picture?: string;
}
// =====================

export type {
  Device,
  PhoneSearchResult,
  PhoneDetails
}
