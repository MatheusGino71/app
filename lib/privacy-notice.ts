export function privacyNoticeConfig() {
  const config = {
    controller: process.env.ATELIER_PRIVACY_CONTROLLER ?? "",
    address: process.env.ATELIER_PRIVACY_ADDRESS ?? "",
    country: process.env.ATELIER_PRIVACY_COUNTRY ?? "",
    contact: process.env.ATELIER_PRIVACY_EMAIL ?? "",
    legalBasis: process.env.ATELIER_PRIVACY_LEGAL_BASIS ?? "",
    retention: process.env.ATELIER_PRIVACY_RETENTION_NOTICE ?? "",
    locations: process.env.ATELIER_PRIVACY_DATA_LOCATIONS ?? "",
    transfers: process.env.ATELIER_PRIVACY_TRANSFERS ?? "",
    authority: process.env.ATELIER_PRIVACY_AUTHORITY_URL ?? "",
  };
  return { ...config, ready: Object.values(config).every(s => s.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact) && /^https:\/\//.test(config.authority) && process.env.ATELIER_PRIVACY_APPROVED === "true" };
}
