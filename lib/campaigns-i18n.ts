export type CampaignLocaleKey =
  | "activation_flow" | "actual_purchase_value" | "badge_trade_marketing" | "bleaching_powder"
  | "bonus_product_value" | "btn_add_professional" | "btn_cancel" | "btn_save" | "btn_saving"
  | "budget_ceiling" | "cash_prize" | "col_actions" | "col_order_ref" | "col_packages"
  | "col_professionals" | "col_salon" | "col_sell_out" | "col_start_date" | "col_status"
  | "col_top_performer" | "combined_price_list_value" | "commercial_scenarios" | "composition_title"
  | "conservative" | "day_activation" | "days" | "delivered_without_cost" | "edit_enrollment"
  | "effective_saving" | "enroll_first_salon" | "enroll_salon" | "enrolled_salons_title"
  | "execution_plan" | "expected_sell_out" | "field_notes" | "field_notes_placeholder"
  | "field_order_ref" | "field_order_ref_placeholder" | "field_packages" | "field_salon"
  | "field_start_date" | "field_status" | "first_place" | "free_bonus" | "free_product_value"
  | "growth_pillar_1_desc" | "growth_pillar_1_title" | "growth_pillar_2_desc" | "growth_pillar_2_title"
  | "growth_pillar_3_desc" | "growth_pillar_3_title" | "growth_pillar_4_desc" | "growth_pillar_4_title"
  | "hero_description" | "hero_title" | "home_care_paid_units" | "how_it_works"
  | "icons_edit_heading" | "individual_recognition" | "kpis_title" | "management_overline"
  | "maximum_budget" | "mechanic_title" | "modal_enroll_subtitle" | "modal_enroll_title"
  | "more_value_no_discount" | "more_value_no_discount_desc" | "multi_brand_opportunity"
  | "multi_brand_portfolio" | "no_salons_enrolled" | "no_salons_enrolled_desc" | "of_potential_sell_in"
  | "ox_developer" | "package_composition" | "paid_value" | "participating_salons" | "podium_preview"
  | "potential_sell_in" | "prize_allocation" | "prize_investment" | "prizes_per_salon"
  | "product" | "product_prize" | "prof_name_placeholder" | "prof_section_desc" | "prof_section_title"
  | "prof_units_label" | "projected_sell_in" | "promotional_period" | "quantity" | "rapid_execution"
  | "recommended" | "regulatory_note" | "remaining_capacity" | "retail_price_list" | "revenue_opportunity"
  | "salon_count_single" | "salons_count" | "second_place" | "sim_prize_scenario_label" | "sim_salons_label"
  | "simulator_overline" | "simulator_title" | "slides" | "status_cancelled" | "status_completed"
  | "status_confirmed" | "status_contacted" | "status_planned" | "step" | "target_per_salon"
  | "target_units_sold" | "third_place" | "timeline_subtitle" | "timeline_title" | "total"
  | "total_delivered_value" | "total_share" | "total_units" | "unit_price" | "unknown_salon" | "week"
  | "position" | "professional_name" | "remove_professional" | "sold" | "units";

type CampaignMessages = Record<CampaignLocaleKey, string>;

const en: CampaignMessages = {
  activation_flow: "Activation flow", actual_purchase_value: "Actual purchase value", badge_trade_marketing: "TRADE MARKETING",
  bleaching_powder: "Bleaching powder", bonus_product_value: "Bonus product value", btn_add_professional: "Add professional",
  btn_cancel: "Cancel", btn_save: "Save enrollment", btn_saving: "Saving…", budget_ceiling: "Budget ceiling",
  cash_prize: "Cash prize", col_actions: "Actions", col_order_ref: "Order reference", col_packages: "Packages",
  col_professionals: "Professionals", col_salon: "Salon", col_sell_out: "Sell-out", col_start_date: "Start date",
  col_status: "Status", col_top_performer: "Top performer", combined_price_list_value: "Combined price-list value",
  commercial_scenarios: "Commercial scenarios", composition_title: "OFFER COMPOSITION", conservative: "Conservative",
  day_activation: "days activation", days: "days", delivered_without_cost: "Delivered at no cost", edit_enrollment: "Edit enrollment",
  effective_saving: "Effective saving", enroll_first_salon: "Enroll first salon", enroll_salon: "Enroll salon",
  enrolled_salons_title: "Enrolled salons", execution_plan: "Execution plan", expected_sell_out: "Expected sell-out",
  field_notes: "Notes", field_notes_placeholder: "Add context, follow-up or evidence", field_order_ref: "Order reference",
  field_order_ref_placeholder: "e.g. PO-2026-001", field_packages: "Packages", field_salon: "Salon",
  field_start_date: "Start date", field_status: "Participation status", first_place: "1st place", free_bonus: "Free bonus",
  free_product_value: "Free product value", growth_pillar_1_desc: "A focused assortment makes the offer easy to explain and execute.",
  growth_pillar_1_title: "Clear offer", growth_pillar_2_desc: "A defined launch window creates urgency without discounting the brand.",
  growth_pillar_2_title: "Fast activation", growth_pillar_3_desc: "Track sell-out, replenishment and participation with the same view.",
  growth_pillar_3_title: "Visible progress", growth_pillar_4_desc: "Use evidence to scale what works across the salon network.",
  growth_pillar_4_title: "Repeatable growth", hero_description: "Plan, activate and measure commercial programs with one shared operating view.",
  hero_title: "Events & campaigns", home_care_paid_units: "Home Care paid units", how_it_works: "How it works",
  icons_edit_heading: "The Icons Edit", individual_recognition: "Individual recognition", kpis_title: "Key indicators",
  management_overline: "PARTICIPATION MANAGEMENT", maximum_budget: "Maximum budget", mechanic_title: "Mechanic",
  modal_enroll_subtitle: "Record the salon's participation in", modal_enroll_title: "Enroll salon",
  more_value_no_discount: "More value, no discount", more_value_no_discount_desc: "A curated multi-brand bundle that protects price-list value.",
  multi_brand_opportunity: "Multi-brand opportunity", multi_brand_portfolio: "Multi-brand portfolio",
  no_salons_enrolled: "No salons enrolled yet", no_salons_enrolled_desc: "Add a salon to start tracking participation, orders and results.",
  of_potential_sell_in: "% of potential sell-in", ox_developer: "OX developer", package_composition: "Package composition",
  paid_value: "paid value", participating_salons: "participating salons", podium_preview: "Podium preview",
  potential_sell_in: "Potential sell-in", prize_allocation: "Prize allocation", prize_investment: "Prize investment",
  prizes_per_salon: "Prizes per salon", product: "product", product_prize: "Product prize",
  prof_name_placeholder: "Professional name", prof_section_desc: "Track each professional's verified sell-out for the ranking.",
  prof_section_title: "Professionals & units sold", prof_units_label: "Units sold", projected_sell_in: "Projected sell-in",
  promotional_period: "Promotional period", quantity: "Quantity", rapid_execution: "Rapid execution",
  recommended: "Recommended", regulatory_note: "Operational note", remaining_capacity: "remaining capacity",
  retail_price_list: "price-list value", revenue_opportunity: "Revenue opportunity", salon_count_single: "salon",
  salons_count: "salons", second_place: "2nd place", sim_prize_scenario_label: "Prize scenario",
  sim_salons_label: "Participating salons", simulator_overline: "SCENARIO PLANNER", simulator_title: "Model the opportunity",
  slides: "slides", status_cancelled: "Cancelled", status_completed: "Completed", status_confirmed: "Confirmed",
  status_contacted: "Contacted", status_planned: "Planned", step: "Step", target_per_salon: "Target per salon",
  target_units_sold: "Target units sold", third_place: "3rd place", timeline_subtitle: "A practical 30-day cadence",
  timeline_title: "ACTIVATION TIMELINE", total: "Total", total_delivered_value: "Total delivered value",
  total_share: "of total prize", total_units: "total units", unit_price: "Unit price", unknown_salon: "Unknown salon", week: "Week",
  position: "Position", professional_name: "Professional name", remove_professional: "Remove professional", sold: "sold", units: "units"
};

const pt: CampaignMessages = {
  ...en,
  activation_flow: "Fluxo de ativação", badge_trade_marketing: "TRADE MARKETING", btn_add_professional: "Adicionar profissional",
  btn_cancel: "Cancelar", btn_save: "Salvar inscrição", btn_saving: "Salvando…", col_actions: "Ações", col_order_ref: "Referência do pedido",
  col_packages: "Pacotes", col_professionals: "Profissionais", col_salon: "Salão", col_sell_out: "Sell-out", col_start_date: "Data de início",
  col_status: "Status", col_top_performer: "Destaque", commercial_scenarios: "Cenários comerciais", composition_title: "COMPOSIÇÃO DA OFERTA",
  days: "dias", day_activation: "dias de ativação", edit_enrollment: "Editar inscrição", enroll_first_salon: "Inscrever primeiro salão",
  enroll_salon: "Inscrever salão", enrolled_salons_title: "Salões inscritos", expected_sell_out: "Sell-out esperado", field_notes: "Observações",
  field_notes_placeholder: "Adicione contexto, acompanhamento ou evidências", field_order_ref: "Referência do pedido",
  field_packages: "Pacotes", field_salon: "Salão", field_start_date: "Data de início", field_status: "Status da participação",
  first_place: "1º lugar", free_bonus: "Bônus grátis", free_product_value: "Valor dos produtos grátis", hero_description: "Planeje, ative e acompanhe campanhas comerciais em uma única visão operacional.",
  hero_title: "Eventos e campanhas", how_it_works: "Como funciona", individual_recognition: "Reconhecimento individual",
  kpis_title: "Indicadores principais", management_overline: "GESTÃO DE PARTICIPAÇÃO", mechanic_title: "Mecânica",
  modal_enroll_subtitle: "Registre a participação do salão em", modal_enroll_title: "Inscrever salão", no_salons_enrolled: "Nenhum salão inscrito",
  no_salons_enrolled_desc: "Adicione um salão para acompanhar participação, pedidos e resultados.", participating_salons: "salões participantes",
  podium_preview: "Prévia do pódio", potential_sell_in: "Sell-in potencial", prize_allocation: "Alocação de prêmios",
  prize_investment: "Investimento em prêmios", prizes_per_salon: "Prêmios por salão", product_prize: "Prêmio em produto",
  prof_name_placeholder: "Nome do profissional", prof_section_desc: "Acompanhe o sell-out validado de cada profissional no ranking.",
  prof_section_title: "Profissionais e unidades vendidas", prof_units_label: "Unidades vendidas", projected_sell_in: "Sell-in projetado",
  promotional_period: "Período promocional", recommended: "Recomendado", regulatory_note: "Nota operacional",
  remaining_capacity: "capacidade restante", salons_count: "salões", salon_count_single: "salão", second_place: "2º lugar",
  sim_prize_scenario_label: "Cenário de premiação", sim_salons_label: "Salões participantes", simulator_overline: "PLANEJADOR DE CENÁRIOS",
  simulator_title: "Modele a oportunidade", slides: "páginas", status_cancelled: "Cancelado", status_completed: "Concluído",
  status_confirmed: "Confirmado", status_contacted: "Contatado", status_planned: "Planejado", target_per_salon: "Meta por salão",
  target_units_sold: "Unidades na meta", third_place: "3º lugar", timeline_subtitle: "Uma cadência prática de 30 dias",
  timeline_title: "CRONOGRAMA DE ATIVAÇÃO", total_delivered_value: "Valor total entregue", week: "Semana",
  position: "Posição", professional_name: "Nome do profissional", remove_professional: "Remover profissional", sold: "vendidas", units: "unidades"
};

export function getCampaignText(key: CampaignLocaleKey, language = "en") {
  return (language.toLowerCase().startsWith("pt") ? pt : en)[key];
}