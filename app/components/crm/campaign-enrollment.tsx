"use client";

import { Award, Building2, Check, ClipboardList, Plus, Trash2, TrendingUp, Trophy, Users } from "lucide-react";
import type { CampaignEntry } from "../../../lib/campaigns";
import { CAMPAIGN_STATUSES, campaignRanking } from "../../../lib/campaigns";
import { CAMPAIGN_COPY, type CampaignLocaleKey } from "../../../lib/campaigns-i18n";
import type { Salon } from "../../../lib/domain";
import { useI18n } from "../i18n/language-provider";
import { Field, Modal } from "./ui";

export type EnrollmentDraft = Omit<CampaignEntry, "updatedAt" | "updatedBy">;

export default function CampaignEnrollment({ draft, onChange, campaignName, salons, entries, saving, error, onSave, onClose }: {
  draft: EnrollmentDraft;
  onChange: (value: EnrollmentDraft) => void;
  campaignName: string;
  salons: Salon[];
  entries: CampaignEntry[];
  saving: boolean;
  error: string;
  onSave: () => Promise<void>;
  onClose: () => void;
}) {
  const { t, money } = useI18n();
  const ct = (key: CampaignLocaleKey) => t(CAMPAIGN_COPY[key]);
  const competition = draft.campaignId === "salon-sales";
  const salon = salons.find(s => s.id === draft.salonId);
  const total = draft.professionals.reduce((sum, professional) => sum + professional.units, 0);
  const ranking = campaignRanking(draft.professionals.filter(p => p.name.trim() && p.units > 0));
  const places = [ct("first_place"), ct("second_place"), ct("third_place")];
  const status = (value: typeof draft.status) => ct(`status_${value}`);
  const updateProfessional = (index: number, value: Partial<EnrollmentDraft["professionals"][number]>) => {
    onChange({ ...draft, professionals: draft.professionals.map((professional, i) => i === index ? { ...professional, ...value } : professional) });
  };
  return <Modal wide title={draft.version ? ct("edit_enrollment") : ct("modal_enroll_title")} subtitle={campaignName} onClose={onClose} className="crm-enrollment-dialog">
    <form onSubmit={event => { event.preventDefault(); if (!saving) void onSave(); }} className="crm-enrollment-form" aria-busy={saving}>
      <fieldset disabled={saving} className="crm-enrollment-layout">
        <legend className="crm-sr">{ct("modal_enroll_title")}</legend>
        <div className="crm-enrollment-main">
          {error && <p className="crm-error" role="alert">{t(error)}</p>}
          <section className="crm-enrollment-section" aria-labelledby="enrollment-details">
            <div className="crm-enrollment-section-head"><span className="crm-section-icon"><Building2 size={19} /></span><div><h3 id="enrollment-details">{t("Detalhes da participação")}</h3><p>{t("Defina o salão, o status e a data de início.")}</p></div><span className="crm-section-number">01</span></div>
            <div className="crm-enrollment-fields">
              <Field label={ct("field_salon")}>
                <select value={draft.salonId} disabled={draft.version > 0} onChange={event => onChange({ ...draft, salonId: event.target.value })} required>
                  <option value="" disabled>{t("Selecione um salão")}</option>
                  {salons.map(s => <option key={s.id} value={s.id} disabled={draft.version === 0 && entries.some(e => e.salonId === s.id)}>{s.name} · {s.city}</option>)}
                </select>
              </Field>
              <div className="crm-form-grid">
                <Field label={ct("field_status")}><select value={draft.status} onChange={event => onChange({ ...draft, status: event.target.value as EnrollmentDraft["status"] })}>{CAMPAIGN_STATUSES.map(value => <option key={value} value={value}>{status(value)}</option>)}</select></Field>
                <Field label={ct("field_start_date")}><input type="date" value={draft.startDate} onChange={event => onChange({ ...draft, startDate: event.target.value })} /></Field>
              </div>
            </div>
          </section>

          <section className="crm-enrollment-section" aria-labelledby="enrollment-results">
            <div className="crm-enrollment-section-head"><span className="crm-section-icon">{competition ? <Users size={19} /> : <ClipboardList size={19} />}</span><div><h3 id="enrollment-results">{competition ? ct("prof_section_title") : t("Dados do pedido")}</h3><p>{competition ? ct("prof_section_desc") : t("Registre os pacotes e a referência para acompanhar a ativação.")}</p></div><span className="crm-section-number">02</span></div>
            {competition ? <>
              <div className="crm-professional-cards">
                {draft.professionals.map((professional, index) => <div className="crm-professional-row" key={index}>
                  <span className="crm-professional-index">{String(index + 1).padStart(2, "0")}</span>
                  <Field label={t("Nome do profissional {number}", { number: index + 1 })}><input type="text" autoComplete="off" placeholder={ct("prof_name_placeholder")} minLength={2} maxLength={120} value={professional.name} onChange={event => updateProfessional(index, { name: event.target.value })} required /></Field>
                  <Field label={ct("prof_units_label")}><input type="number" min={0} max={1000000} step={1} value={professional.units} onChange={event => updateProfessional(index, { units: Number(event.target.value) })} required /></Field>
                  <button className="crm-icon crm-remove-professional" type="button" aria-label={t("Remover profissional {number}", { number: index + 1 })} onClick={() => onChange({ ...draft, professionals: draft.professionals.filter((_, i) => i !== index) })}><Trash2 size={17} /></button>
                </div>)}
                {!draft.professionals.length && <div className="crm-enrollment-empty"><Users size={24} /><strong>{t("Sem profissionais cadastrados")}</strong><p>{t("Adicione a equipe que participa da competição.")}</p></div>}
              </div>
              <button type="button" className="crm-add-professional" disabled={draft.professionals.length >= 100} onClick={() => onChange({ ...draft, professionals: [...draft.professionals, { name: "", units: 0 }] })}><Plus size={17} />{ct("btn_add_professional")}</button>
            </> : <div className="crm-form-grid">
              <Field label={ct("field_packages")}><input type="number" min={0} max={10000} step={1} value={draft.packages} onChange={event => onChange({ ...draft, packages: Number(event.target.value) })} required /></Field>
              <Field label={ct("field_order_ref")}><input placeholder={ct("field_order_ref_placeholder")} maxLength={200} value={draft.orderReference} onChange={event => onChange({ ...draft, orderReference: event.target.value })} required={draft.packages > 0} /></Field>
            </div>}
          </section>

          <section className="crm-enrollment-section" aria-labelledby="enrollment-followup">
            <div className="crm-enrollment-section-head"><span className="crm-section-icon"><ClipboardList size={19} /></span><div><h3 id="enrollment-followup">{t("Acompanhamento")}</h3><p>{t("Informações adicionais para a equipe comercial.")}</p></div><span className="crm-section-number">03</span></div>
            <Field label={ct("field_notes")}><textarea rows={3} maxLength={4000} placeholder={ct("field_notes_placeholder")} value={draft.note} onChange={event => onChange({ ...draft, note: event.target.value })} /></Field>
          </section>
        </div>

        <aside className="crm-enrollment-summary" aria-label={t("Resumo da inscrição")}>
          <span className="crm-overline">{t("Resumo da inscrição")}</span>
          <div className="crm-enrollment-salon-mark"><Building2 size={25} /></div>
          <h3>{salon?.name || t("Selecione um salão")}</h3>
          {salon && <p>{salon.city} · {salon.country}</p>}
          <span className={`crm-enrollment-status status-${draft.status}`}>{status(draft.status)}</span>
          <div className="crm-enrollment-goal"><TrendingUp size={17} /><span>{competition ? t("Meta de vendas") : ct("field_packages")}</span><strong>{competition ? `150 ${ct("units")}` : draft.packages}</strong></div>
          {competition && <>
            <div className="crm-enrollment-progress"><div><span>{t("Progresso da equipe")}</span><strong>{total} / 150</strong></div><progress value={Math.min(total, 150)} max={150} aria-label={t("Progresso da equipe")} /></div>
            <div className="crm-enrollment-ranking"><h4><Trophy size={16} />{ct("podium_preview")}</h4>
              {ranking.length ? ranking.slice(0, 3).map((professional, index) => <div className="crm-enrollment-rank" key={professional.name + index}><span><Award size={16} />{professional.rank}</span><div><strong>{professional.name}</strong><small>{professional.tied ? t("Empate") : places[index]} · {professional.units} {ct("units")}</small></div>{!professional.tied && <b>{money([150, 100, 50][index])}</b>}</div>) : <p>{t("Preencha os nomes para visualizar o ranking.")}</p>}
            </div>
          </>}
        </aside>
      </fieldset>
      <footer className="crm-enrollment-footer"><span><Check size={15} />{t("Dados salvos por salão e campanha.")}</span><div><button type="button" className="crm-btn quiet" disabled={saving} onClick={onClose}>{ct("btn_cancel")}</button><button type="submit" className="crm-btn primary" disabled={saving || !draft.salonId}>{saving ? ct("btn_saving") : ct("btn_save")}<Check size={16} /></button></div></footer>
    </form>
  </Modal>;
}
