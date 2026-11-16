"use client";
import Link from "next/link";
import { useI18n } from "./i18n/language-provider";
import LanguageSelector from "./i18n/language-selector";
import type { privacyNoticeConfig } from "../../lib/privacy-notice";
export default function PrivacyNotice({ config }: { config: ReturnType<typeof privacyNoticeConfig> }) {
  const { t } = useI18n();
  return <main className="privacy-notice"><LanguageSelector /><h1>{t("Privacy notice")}</h1><p>GRACE PRO · {t("Version")}: 2026-11-16</p>
    {!config.ready ? <><p role="status">{t("The organisation is finalising its privacy notice. The approved notice must be available before processing real personal data.")}</p><p>{t("For information or a data request, contact the organisation that provided your access.")}</p>{config.contact && <p><a href={`mailto:${config.contact}`}>{config.contact}</a></p>}</> : <>
      <h2>{t("Who is responsible for your data")}</h2><p>{config.controller} · {config.country}<br />{config.address}<br /><a href={`mailto:${config.contact}`}>{config.contact}</a></p>
      <h2>{t("What we process and why")}</h2><p>{t("The platform supports the organisation’s commercial relationship with professional salons. It processes business contacts, visits, purchase information, campaign participation and supporting documents provided by authorised staff.")}</p><p>{t("Staff account details, security records and data requests are also processed to operate and protect the service.")}</p><p>{t("Provide only necessary information. Do not upload health information, identity documents or other sensitive information unrelated to this purpose.")}</p>
      <h2>{t("Legal basis")}</h2><p>{config.legalBasis}</p>
      <h2>{t("Recipients and data locations")}</h2><p>{t("Authorised staff access records according to their responsibilities. Vercel hosts the application and Turso provides the database; configured backup and email providers may also process data under the organisation’s instructions.")}</p><p>{config.locations}</p><p>{config.transfers}</p>
      <h2>{t("Retention")}</h2><p>{config.retention}</p>
      <h2>{t("Your rights")}</h2><p>{t("Depending on the applicable legal basis, you may request access, correction, erasure, restriction, portability or object to processing. Contact the organisation using the address above. Verification of identity or authority may be necessary.")}</p><p>{t("Requests are normally answered within one month. Where an extension is permitted, the organisation must explain it within that first month.")}</p><p><a href={config.authority} rel="noreferrer">{t("Contact the competent data protection authority")}</a></p>
      <h2>{t("Cookies and device storage")}</h2><p>{t("The platform uses a necessary session cookie and local storage for your selected language. The demonstration stores fictitious records in your browser. This application does not include advertising or analytics trackers.")}</p>
      <h2>{t("Commercial classifications")}</h2><p>{t("Purchase categories are calculated from purchase values. Qualitative assessments are made by staff. These classifications support commercial work and are subject to human review.")}</p>
    </>}
    <p><Link href="/conta">{t("Manage personal data requests")}</Link></p><p><Link href="/entrar">{t("Back to sign in")}</Link></p>
  </main>;
}
