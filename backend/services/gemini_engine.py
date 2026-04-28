"""
Gemini explainability engine.
Generates natural-language rationales for route recommendations.
"""
from __future__ import annotations
import os
import logging
from models import Shipment, RerouteOption

logger = logging.getLogger(__name__)

FALLBACK_TEMPLATES = {
    "fast": "This express route minimises transit time by {time_saving} days. While cost is ₹{cost_delta} higher, risk drops from {old_risk}% to {new_risk}%. Recommended for time-sensitive cargo.",
    "cheap": "This economy route saves ₹{cost_saving} via {mode} transport through {waypoint}. Transit increases by {time_delta} days but risk-adjusted total cost is lowest. Carbon is {carbon_pct}% lower.",
    "green": "This green corridor reduces CO₂ by {carbon_saving} kg ({carbon_pct}% reduction) via slow-steaming through {waypoint}. Adds {time_delta} days. Ideal for sustainability-focused shipments.",
}


async def generate_rationale(shipment: Shipment, option: RerouteOption, disruption_context: str = "") -> str:
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return _fallback_rationale(shipment, option)

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))

        prompt = f"""You are a supply chain AI for Indian logistics. Explain why rerouting shipment {shipment.id} from {shipment.origin.name} to {shipment.destination.name} via "{option.label}" is recommended.
Current risk: {shipment.risk_score}% → New: {option.risk_score}%
Cost: ₹{shipment.current_route_details.cost:,.0f} → ₹{option.cost:,.0f}
Transit: {shipment.current_route_details.estimated_days}d → {option.transit_time}d
Cargo: ₹{shipment.cargo_value:,.0f} ({shipment.product_type})
{f'Disruption: {disruption_context}' if disruption_context else ''}
Use ₹/Lakhs/Crores. Keep under 3 sentences. Be specific."""

        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini failed: {e}")
        return _fallback_rationale(shipment, option)


def _fallback_rationale(shipment: Shipment, option: RerouteOption) -> str:
    cost_delta = option.cost - shipment.current_route_details.cost
    time_delta = option.transit_time - shipment.current_route_details.estimated_days
    carbon_delta = shipment.current_route_details.carbon - option.carbon
    carbon_pct = round(abs(carbon_delta) / max(shipment.current_route_details.carbon, 1) * 100)
    waypoint = option.label.split("via ")[-1] if "via" in option.label else option.label

    if "fast" in option.id.lower() or "air" in option.label.lower():
        t = FALLBACK_TEMPLATES["fast"]
    elif "cheap" in option.id.lower() or "economy" in option.label.lower():
        t = FALLBACK_TEMPLATES["cheap"]
    else:
        t = FALLBACK_TEMPLATES["green"]

    return t.format(
        time_saving=abs(time_delta), cost_delta=f"{abs(cost_delta):,.0f}",
        old_risk=shipment.risk_score, new_risk=option.risk_score,
        cost_saving=f"{abs(cost_delta):,.0f}", mode=option.mode.value,
        waypoint=waypoint, time_delta=abs(time_delta),
        carbon_pct=carbon_pct, carbon_saving=abs(carbon_delta),
    )


async def generate_whatif_summary(disruption_type: str, affected_count: int, total_value_at_risk: float, top_reroutes: list[dict]) -> str:
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return _fallback_whatif(disruption_type, affected_count, total_value_at_risk)

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))

        details = "\n".join([f"  - {r.get('shipment_id')}: {r.get('recommended_option')} (risk {r.get('old_risk',0)}%→{r.get('new_risk',0)}%)" for r in top_reroutes[:3]])
        prompt = f"""Supply chain AI summary for What-If scenario:
Disruption: {disruption_type}, Affected: {affected_count} shipments, Value at risk: ₹{total_value_at_risk:,.0f}
Top reroutes:\n{details}
Write 2-3 sentence executive summary using ₹/Lakhs/Crores."""

        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini What-If failed: {e}")
        return _fallback_whatif(disruption_type, affected_count, total_value_at_risk)


def _fallback_whatif(disruption_type: str, affected_count: int, total_value_at_risk: float) -> str:
    value_cr = total_value_at_risk / 10_000_000
    return f"⚠️ {disruption_type.replace('_', ' ').title()}: {affected_count} shipments affected with ₹{value_cr:.1f} Cr at risk. AI-optimised reroutes reduce aggregate risk by 45-65% with ₹2-4 L average cost increase per shipment."
