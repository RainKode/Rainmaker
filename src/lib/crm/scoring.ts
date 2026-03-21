/**
 * Simple lead scoring engine for CRM contacts.
 * Calculates a numeric score based on engagement signals.
 *
 * Factors:
 * - Message frequency (last 30 days)
 * - Response rate (outbound vs inbound ratio)
 * - Deal value
 * - Stage progression
 * - Recency of last contact
 */

type ScoringInput = {
  message_count_30d: number;
  inbound_count_30d: number;
  outbound_count_30d: number;
  deal_value: number | null;
  stage_probability: number;
  days_since_last_contact: number | null;
};

export function calculateLeadScore(input: ScoringInput): number {
  let score = 0;

  // Message frequency — up to 30 points
  // 1 point per message, capped at 30
  score += Math.min(input.message_count_30d, 30);

  // Response rate — up to 20 points
  // If we've sent messages and they've replied, that's engagement
  if (input.outbound_count_30d > 0 && input.inbound_count_30d > 0) {
    const responseRate = input.inbound_count_30d / input.outbound_count_30d;
    score += Math.min(Math.round(responseRate * 20), 20);
  } else if (input.inbound_count_30d > 0) {
    // They reached out unprompted — high signal
    score += 15;
  }

  // Deal value — up to 25 points
  if (input.deal_value !== null && input.deal_value > 0) {
    if (input.deal_value >= 10000) score += 25;
    else if (input.deal_value >= 5000) score += 20;
    else if (input.deal_value >= 1000) score += 15;
    else if (input.deal_value >= 500) score += 10;
    else score += 5;
  }

  // Stage probability — up to 15 points
  score += Math.round((input.stage_probability / 100) * 15);

  // Recency — up to 10 points
  if (input.days_since_last_contact !== null) {
    if (input.days_since_last_contact <= 1) score += 10;
    else if (input.days_since_last_contact <= 3) score += 8;
    else if (input.days_since_last_contact <= 7) score += 6;
    else if (input.days_since_last_contact <= 14) score += 4;
    else if (input.days_since_last_contact <= 30) score += 2;
    // > 30 days: 0 points
  }

  // Clamp to 0–100
  return Math.max(0, Math.min(100, score));
}
