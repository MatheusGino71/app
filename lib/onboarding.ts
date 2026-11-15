import { emptyDiagnostic, emptySalon, parseDraft, type Draft, type OnboardingProfile, type User } from "./domain";
export const ONBOARDING_DEMO_KEY = "atelier-personal-demo-v1";
export function initialOnboardingDraft(user: User, profile: OnboardingProfile | null, saved: Draft | null): Draft {
  if (saved && (saved.salonId === "" && !profile || saved.salonId === profile?.salon.id)) return parseDraft(saved);
  const diagnostic = profile ? structuredClone(profile.visit.diagnostic) : emptyDiagnostic();
  diagnostic.annualPurchase = null; diagnostic.orders = null; diagnostic.cutoff = new Date().toISOString().slice(0, 10);
  diagnostic.source = "Informado pelo responsável do salão"; diagnostic.assessments = emptyDiagnostic().assessments;
  diagnostic.agreement = { title: "", responsible: "", due: "" }; diagnostic.note = "";
  diagnostic.brands = diagnostic.brands.map(b => ({ ...b, purchased: null, references: null }));
  return { salonId: profile?.salon.id ?? "", version: profile?.salon.version ?? 0, step: 0, salon: profile?.salon ?? { ...emptySalon(), contact: user.name }, diagnostic };
}
