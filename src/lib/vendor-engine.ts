import {
  VendorQuestionItem,
  QuotationComparisonResult,
} from "@/types/event";
import { QuotationComparisonRequest, VendorQuestionRequest } from "@/lib/ai-schemas";

/**
 * Deterministic Vendor Question Preparation Engine
 * Tailored for Indian celebrations and domain-specific vendor inquiries.
 */
export function generateDeterministicVendorQuestions(
  req: VendorQuestionRequest
): { category: string; questions: VendorQuestionItem[]; tips: string[] } {
  const { category, guestCount, requirements } = req;
  const questions: VendorQuestionItem[] = [];
  const tips: string[] = [];

  switch (category) {
    case "Venue":
      questions.push(
        {
          question: `What is the maximum indoor seating and floating capacity for our ${guestCount} guests?`,
          purpose: "Ensures the venue avoids severe overcrowding during peak rituals and dinner.",
          category: "Capacity & Space",
        },
        {
          question: "Are electricity, centralized air-conditioning, and 100% DG generator fuel included, or billed extra per unit/hour?",
          purpose: "Power and generator bills in peak Indian summers/weddings often produce ₹30,000–₹80,000 hidden surprises.",
          category: "Utilities & Hidden Costs",
        },
        {
          question: "Do you allow outside caterers and decorators, or is there an empanelled vendor royalty fee?",
          purpose: "Unapproved vendors often incur a steep penalty or royalty charge (₹25,000–₹50,000) at contracted banquet halls.",
          category: "Vendor Restrictions",
        },
        {
          question: "What is the sound and music cutoff timing as per local civic guidelines?",
          purpose: "Most Indian municipal corporations strictly enforce the 10:00 PM loudspeaker cutoff.",
          category: "Permits & Regulations",
        },
        {
          question: "How many complimentary air-conditioned green rooms/bride suites are provided for pre-function prep?",
          purpose: "Crucial for family changing, makeup artists, and immediate valuables safety during multi-hour ceremonies.",
          category: "Amenities",
        },
        {
          question: "What is the parking capacity and is complimentary valet parking assistance included?",
          purpose: "Heavy evening guest influx can cause road choking without dedicated valet staff.",
          category: "Logistics",
        },
        {
          question: "What is the advance payment schedule and cancellation/date-transfer refund policy?",
          purpose: "Clarifies forfeiture risk in case of date shifts or emergency adjustments.",
          category: "Payment Terms",
        }
      );
      tips.push(
        "Always demand written confirmation on DG generator fuel charges before handing over the booking advance.",
        "Inspect the bride's green room locks and operational AC during your physical venue walkthrough."
      );
      break;

    case "Caterer":
      questions.push(
        {
          question: `What is the exact per-plate cost for ${guestCount} guests, and what is the minimum guaranteed (MG) pax count?`,
          purpose: "Prevents paying for unconsumed plates if attendance fluctuates.",
          category: "Pricing & Minimum Guarantee",
        },
        {
          question: "Which live food counters (e.g. Chaat, Wood-fired Pizza, Dosa, Jalebi-Rabdi) and welcome mocktails are included?",
          purpose: "Live interactive counters define the Indian dining experience and guest satisfaction.",
          category: "Menu Scope",
        },
        {
          question: "Are mineral water bottles/dispensers, soft beverages, and ice included in the plate quote or charged on consumption?",
          purpose: "Beverage consumption charges frequently add 12–15% to final catering bills if excluded.",
          category: "Beverages",
        },
        {
          question: "What is the ratio of trained uniform service staff and buffet managers to our guest count?",
          purpose: "Standard celebration etiquette requires at least 1 server per 25–30 guests for seamless refill service.",
          category: "Staffing",
        },
        {
          question: "Do you supply premium bone china/melamine crockery, chafing dishes, and linen, or is cutlery rented separately?",
          purpose: "Ensures no last-minute surcharge for cutlery, napkins, and buffet counters.",
          category: "Equipment & Presentation",
        },
        {
          question: "What protocol do you follow for hygienic food storage and packing leftover food for the host family?",
          purpose: "Ensures food is neither wasted nor mishandled at the conclusion of late-night pheras or dinner.",
          category: "Food Safety & Waste",
        },
        {
          question: "Does the quoted per-plate price include 18% GST and all service taxes?",
          purpose: "Avoids 18% GST shock at final settlement.",
          category: "Taxes & Billing",
        }
      );
      tips.push(
        "Request a pre-event tasting session for 3-4 signature gravies, rotis, and sweets.",
        "Set the Minimum Guarantee (MG) plate count at 85% of expected RSVPs to avoid overpaying."
      );
      break;

    case "Photographer":
      questions.push(
        {
          question: "How many lead candid photographers, traditional photographers, and cinematographers will be on-site?",
          purpose: "Guarantees complete coverage of stage rituals and candid emotional moments without single-person fatigue.",
          category: "Team Size & Scope",
        },
        {
          question: "What are the exact deliverable formats (e.g. 3-min cinematic teaser, 30-min wedding film, photo book with X pages)?",
          purpose: "Prevents ambiguity between short social reels and archival family albums.",
          category: "Deliverables",
        },
        {
          question: "What is the committed turnaround time for edited photos and the final cinematic film?",
          purpose: "Industry standard is 45 to 60 days; getting it in writing prevents 6-month delivery delays.",
          category: "Timeline",
        },
        {
          question: "Will all raw unedited high-resolution JPEG photos and video footage (raw rushes) be handed over on a hard drive?",
          purpose: "Safeguards family archival footage so you own all recorded memories permanently.",
          category: "Raw Media Rights",
        },
        {
          question: "Is drone/aerial videography included, and do you manage local flying clearance?",
          purpose: "Outdoor lawn venues benefit greatly from drone visuals, but require pilot permits.",
          category: "Equipment",
        },
        {
          question: "What are the overtime charges if rituals extend past 1:00 AM (e.g. late night Muhurat pheras)?",
          purpose: "Late night Indian rituals commonly overrun; explicit hourly rates prevent disputes.",
          category: "Overtime Terms",
        }
      );
      tips.push(
        "Always request full sample albums of an entire single wedding, not just curated Instagram highlights.",
        "Ensure payment milestones: 25% booking, 50% on event day, and remaining 25% upon final album delivery."
      );
      break;

    case "Decorator":
      questions.push(
        {
          question: "What proportion of flowers used will be fresh exotic blooms vs artificial/silk flowers?",
          purpose: "Dramatically impacts aesthetic appeal, fragrance, and costs.",
          category: "Materials & Freshness",
        },
        {
          question: "Can you provide 3D render sketches or reference stage dimensions before final execution?",
          purpose: "Prevents mismatched scale between stage backdrop and venue ceiling height.",
          category: "Design Mockups",
        },
        {
          question: "Does the package cover pathway fairy lighting, entrance arch, mandap, and guest seating sofas?",
          purpose: "Clarifies whether lounge furniture, chiavari chairs, and ambient lighting are all-inclusive.",
          category: "Coverage Scope",
        },
        {
          question: "What weather contingency (waterproof canopy, heavy truss weights) is provided for outdoor lawns?",
          purpose: "Protects against sudden evening rain or heavy wind gusts common in open-air venues.",
          category: "Contingency",
        },
        {
          question: "What is your setup hand-over time prior to guest arrival?",
          purpose: "Ensures decor is 100% ready at least 2 hours prior to guest arrival for family portraits.",
          category: "Setup Timeline",
        }
      );
      tips.push(
        "Ask if transport and teardown labour are included in the quote.",
        "Specify exact color palette and flower types (e.g. Marigolds, Mogra, Carnations, Orchids) in the agreement."
      );
      break;

    case "Entertainment":
      questions.push(
        {
          question: "What audio equipment (JBL/Line Array wattage, cordless mics, console) is provided by the DJ?",
          purpose: "Audio clarity is vital for sangeet performances and announcements.",
          category: "Sound Tech",
        },
        {
          question: "Can we share a mandatory playlist and a strict 'Do Not Play' list before the celebration?",
          purpose: "Maintains family musical preferences and cultural appropriateness.",
          category: "Curated Playlist",
        },
        {
          question: "Does the package include a professional bilingual Master of Ceremonies (Anchor/Emcee)?",
          purpose: "An experienced anchor engages guests and keeps sangeet performances moving on schedule.",
          category: "Anchor / Host",
        },
        {
          question: "Are live percussionists (dhol players/punjabi dholis) included for baraat or grand entries?",
          purpose: "High energy traditional Indian entries require synchronized dhol beats.",
          category: "Live Artists",
        },
        {
          question: "What are the overtime rates if guests dance past the scheduled cutoff?",
          purpose: "Prevents surprise hourly fees.",
          category: "Overtime Terms",
        }
      );
      tips.push(
        "Verify if performance licenses (IPRS/PPL) are required and who holds responsibility for them."
      );
      break;

    case "Transportation":
      questions.push(
        {
          question: "What vehicle models are included (e.g. AC Tempo Traveller, Innova Crysta, 50-seater luxury bus)?",
          purpose: "Ensures comfortable luggage and passenger space for outstation guests.",
          category: "Fleet Quality",
        },
        {
          question: "Are fuel, driver daily allowance (bhatta), highway tolls, and parking taxes all-inclusive?",
          purpose: "Toll, state border taxes, and night driver charges often add 20–30% if unquoted.",
          category: "Hidden Charges",
        },
        {
          question: "What is the contingency protocol if a vehicle suffers a mechanical breakdown during guest transit?",
          purpose: "Ensures an immediate replacement vehicle is dispatched within 30 minutes.",
          category: "Emergency Protocol",
        },
        {
          question: "Are drivers provided with clear GPS route maps and local contact numbers of the family transport manager?",
          purpose: "Prevents airport/station pick-up delays for senior family members.",
          category: "Coordination",
        }
      );
      tips.push(
        "Designate one family member as the transport coordinator with a printed driver contact manifest."
      );
      break;

    case "Makeup":
      questions.push(
        {
          question: "Is a prior bridal makeup and hair trial session included in the quotation?",
          purpose: "Essential to verify skin tone compatibility, foundation finish, and hairstyle durability before wedding day.",
          category: "Trial & Prep",
        },
        {
          question: "Does the quote include saree/lehenga draping, jewelry setting, and hair accessory installation?",
          purpose: "Prevents separate last-minute fees for draping assistants and styling tools.",
          category: "Inclusions",
        },
        {
          question: "How many assistants accompany the lead artist and can they cover immediate family party makeups in parallel?",
          purpose: "Avoids severe schedule delays when mother and sisters also require styling.",
          category: "Team & Logistics",
        },
        {
          question: "Are early-morning or late-night muhurat timing travel charges included?",
          purpose: "Early morning ritual slots (4:00 AM) often carry unannounced convenience surcharges.",
          category: "Timing & Surcharges",
        }
      );
      tips.push(
        "Confirm the brand of HD/Airbrush cosmetics used and inform the artist in writing of any skin sensitivities."
      );
      break;

    case "Lighting":
      questions.push(
        {
          question: "Does the lighting plan include warm architectural uplighting, mandap spotlights, and dining fairy light canopies?",
          purpose: "Ensures comprehensive illumination without dark unlit camera shadows during dinner and rituals.",
          category: "Design Scope",
        },
        {
          question: "Is dedicated DG generator power backup and weatherproof cabling included in case of grid failure?",
          purpose: "Prevents ceremony blackouts and hazardous exposed wires during outdoor celebrations.",
          category: "Power & Safety",
        },
        {
          question: "Will dedicated dimmer operators and lighting technicians remain on-site throughout the event?",
          purpose: "Ensures smooth lighting transitions for the grand varmala and cultural performances.",
          category: "Operational Support",
        }
      );
      tips.push(
        "Ensure all heavy distribution boards (DB) are protected from moisture and placed safely away from guest walkways."
      );
      break;

    default: // Other
      questions.push(
        {
          question: "What is the comprehensive scope of deliverables included in your quoted amount?",
          purpose: "Leaves no room for assumptions on what services are actually delivered.",
          category: "Scope of Work",
        },
        {
          question: "What advance deposit is required to confirm the date, and what is your written cancellation policy?",
          purpose: "Protects budget capital in case of unforeseen schedule revisions.",
          category: "Financial Terms",
        },
        {
          question: "Are all taxes, travel surcharges, and equipment handling fees included in this quotation?",
          purpose: "Guarantees a clean, uninflated final invoice.",
          category: "Billing Transparency",
        },
        {
          question: "Have you previously provided services for a similar scale celebration?",
          purpose: "Verifies domain experience and operational readiness.",
          category: "Past Experience",
        }
      );
      tips.push(
        "Always obtain terms and pricing in writing (email or signed quote) before transferring an advance."
      );
      break;
  }

  // If user provided custom requirements, add a targeted requirement check
  if (requirements && requirements.trim().length > 0) {
    questions.push({
      question: `Regarding our requirement: "${requirements.trim()}" — how do you incorporate this into your delivery schedule?`,
      purpose: "Ensures custom celebration requirements are formally addressed in the vendor scope.",
      category: "Custom Requirements",
    });
  }

  return {
    category,
    questions,
    tips,
  };
}

/**
 * Deterministic Quotation Comparison Engine
 * Evaluates quotations based on true value, guest coverage, service depth,
 * hidden surcharges, and missing information. NEVER defaults to cheapest.
 */
export function generateDeterministicQuotationComparison(
  req: QuotationComparisonRequest
): QuotationComparisonResult {
  const { quotations, guestCount, categoryBudget, userPriorities } = req;

  // 1. Calculate metrics for each quotation
  interface EvaluatedQuote {
    quote: (typeof quotations)[0];
    perGuestCost: number;
    hasAdequateCoverage: boolean;
    coverageDelta: number;
    servicesCount: number;
    hiddenChargesCount: number;
    missingInfoCount: number;
    valueScore: number;
    strengths: string[];
    weaknesses: string[];
  }

  const evaluated: EvaluatedQuote[] = quotations.map((q) => {
    const coverage = q.guestCoverage > 0 ? q.guestCoverage : guestCount;
    const perGuest = Math.round(q.quotedAmount / coverage);
    const hasAdequateCoverage = coverage >= guestCount;
    const coverageDelta = coverage - guestCount;
    const servicesCount = q.includedServices.length;
    const hiddenChargesCount = q.additionalCharges.length;
    const missingInfoCount = q.missingInformation.length;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze included services
    if (servicesCount >= 4) {
      strengths.push(`Comprehensive scope with ${servicesCount} documented deliverables included.`);
    } else if (servicesCount <= 2) {
      weaknesses.push(`Minimal service inclusions (${servicesCount} items). May require external top-ups.`);
    }

    // Analyze guest coverage
    if (q.guestCoverage > 0) {
      if (coverageDelta >= 0) {
        strengths.push(`Fully accommodates expected guest count (${q.guestCoverage} pax covered vs ${guestCount} required).`);
      } else {
        weaknesses.push(`Coverage deficit: Covers only ${q.guestCoverage} guests (shortfall of ${Math.abs(coverageDelta)} pax). Overflow will trigger surcharge.`);
      }
    } else {
      weaknesses.push("Guest coverage limit unspecified; risk of per-pax overage disputes on event day.");
    }

    // Analyze additional charges
    if (hiddenChargesCount > 0) {
      weaknesses.push(`${hiddenChargesCount} potential additional charges noted: ${q.additionalCharges.join("; ")}.`);
    } else {
      strengths.push("No obvious unbundled extra charges reported in initial quote.");
    }

    // Analyze missing information
    if (missingInfoCount > 0) {
      weaknesses.push(`${missingInfoCount} critical details missing: ${q.missingInformation.join(", ")}.`);
    } else {
      strengths.push("Documented terms appear complete with no flagged informational omissions.");
    }

    // Analyze budget fit
    if (categoryBudget && categoryBudget > 0) {
      if (q.quotedAmount <= categoryBudget) {
        const remaining = categoryBudget - q.quotedAmount;
        strengths.push(`Within allocated category budget (₹${remaining.toLocaleString("en-IN")} buffer remaining).`);
      } else {
        const overrun = q.quotedAmount - categoryBudget;
        weaknesses.push(`Exceeds category allocation by ₹${overrun.toLocaleString("en-IN")}. Requires conscious budget trade-off.`);
      }
    }

    // Value Score Calculation:
    // Base score starts at 50
    // +20 if adequate guest coverage
    // +4 per included service (up to +24)
    // -8 per additional/hidden charge
    // -10 per missing information item
    // -15 if coverage deficit
    // +10 if within budget
    let score = 50;
    if (hasAdequateCoverage) score += 20;
    else score -= 15;

    score += Math.min(24, servicesCount * 4);
    score -= hiddenChargesCount * 8;
    score -= missingInfoCount * 10;

    if (categoryBudget && q.quotedAmount <= categoryBudget) {
      score += 10;
    }

    // Align with user celebration priorities
    const isHighPriority = userPriorities.some(
      (p) => p.toLowerCase() === req.category.toLowerCase()
    );
    if (isHighPriority && servicesCount >= 3) {
      score += 8;
      strengths.push(`Aligns with your primary celebration priority (${req.category}) by providing robust service scope.`);
    }

    // Reward transparency in terms
    if (q.terms && q.terms.length > 20) {
      score += 6;
      strengths.push("Written commercial and service terms provided upfront.");
    } else {
      weaknesses.push("Terms and cancellation conditions not formally detailed.");
    }

    return {
      quote: q,
      perGuestCost: perGuest,
      hasAdequateCoverage,
      coverageDelta,
      servicesCount,
      hiddenChargesCount,
      missingInfoCount,
      valueScore: score,
      strengths,
      weaknesses,
    };
  });

  // Sort by value score descending (highest value first)
  const sortedByValue = [...evaluated].sort((a, b) => b.valueScore - a.valueScore);
  const bestValue = sortedByValue[0];

  // Cheapest quotation check
  const sortedByPrice = [...evaluated].sort((a, b) => a.quote.quotedAmount - b.quote.quotedAmount);
  const cheapest = sortedByPrice[0];

  // Highlight key differences
  const differences: string[] = [];
  const minPrice = cheapest.quote.quotedAmount;
  const maxPrice = sortedByPrice[sortedByPrice.length - 1].quote.quotedAmount;
  const priceSpread = maxPrice - minPrice;

  differences.push(
    `Price variance across quotes is ₹${priceSpread.toLocaleString("en-IN")} (ranging from ₹${minPrice.toLocaleString("en-IN")} [${cheapest.quote.vendorName}] to ₹${maxPrice.toLocaleString("en-IN")} [${sortedByPrice[sortedByPrice.length - 1].quote.vendorName}]).`
  );

  // Compare service inclusions between top 2
  if (evaluated.length >= 2) {
    const q1 = evaluated[0];
    const q2 = evaluated[1];
    const onlyIn1 = q1.quote.includedServices.filter(
      (s) => !q2.quote.includedServices.some((s2) => s2.toLowerCase() === s.toLowerCase())
    );
    const onlyIn2 = q2.quote.includedServices.filter(
      (s) => !q1.quote.includedServices.some((s1) => s1.toLowerCase() === s.toLowerCase())
    );

    if (onlyIn1.length > 0) {
      differences.push(
        `${q1.quote.vendorName} includes exclusive deliverables: ${onlyIn1.slice(0, 3).join(", ")}.`
      );
    }
    if (onlyIn2.length > 0) {
      differences.push(
        `${q2.quote.vendorName} includes alternative deliverables: ${onlyIn2.slice(0, 3).join(", ")}.`
      );
    }
  }

  // Advantages and Disadvantages dictionaries
  const advantages: Record<string, string[]> = {};
  const disadvantages: Record<string, string[]> = {};
  evaluated.forEach((e) => {
    advantages[e.quote.vendorName] = e.strengths.length > 0 ? e.strengths : ["Competitive baseline pricing."];
    disadvantages[e.quote.vendorName] = e.weaknesses.length > 0 ? e.weaknesses : ["Standard market turnaround terms."];
  });

  // Additional charges analysis
  const additionalChargesAnalysis: string[] = [];
  evaluated.forEach((e) => {
    if (e.quote.additionalCharges.length > 0) {
      additionalChargesAnalysis.push(
        `${e.quote.vendorName}: Unbundled charges include ${e.quote.additionalCharges.join(", ")}. Verify if 18% GST and overtime will be appended.`
      );
    } else {
      additionalChargesAnalysis.push(
        `${e.quote.vendorName}: No extra charges stated, but confirm in writing whether taxes and transport are truly all-inclusive.`
      );
    }
  });

  // Missing info alerts
  const missingInformationAlerts: string[] = [];
  evaluated.forEach((e) => {
    if (e.quote.missingInformation.length > 0) {
      missingInformationAlerts.push(
        `Critical information pending for ${e.quote.vendorName}: ${e.quote.missingInformation.join("; ")}.`
      );
    }
    if (!e.quote.guestCoverage || e.quote.guestCoverage === 0) {
      missingInformationAlerts.push(
        `${e.quote.vendorName} has not specified maximum guest coverage capacity.`
      );
    }
  });

  // Questions to ask vendors
  const questionsToAsk: string[] = [
    `Confirm whether 18% GST is included in the stated quote or will be billed additionally on the final invoice.`,
    `What are the specific penalty or surcharge terms if guest count exceeds the agreed quote by 10%–15%?`,
    `What is the exact advance milestone schedule, and what happens to the deposit if the celebration date is rescheduled?`,
  ];

  // Craft recommendation rationale
  let rationale = "";
  let valueAssessment = "";

  if (bestValue.quote.id === cheapest.quote.id) {
    // Cheapest also happens to provide top value
    rationale = `${bestValue.quote.vendorName} is recommended not simply because it is the most affordable at ₹${bestValue.quote.quotedAmount.toLocaleString("en-IN")}, but because it maintains comprehensive service deliverables (${bestValue.servicesCount} items) and transparent terms without penalizing omissions.`;
    valueAssessment = `Best overall cost-to-value ratio. Effective rate of ~₹${bestValue.perGuestCost.toLocaleString("en-IN")}/pax with minimal hidden surcharge risk.`;
  } else {
    // A higher-priced vendor provides better value
    const premium = bestValue.quote.quotedAmount - cheapest.quote.quotedAmount;
    rationale = `Although ${cheapest.quote.vendorName} offers a lower upfront figure (₹${cheapest.quote.quotedAmount.toLocaleString("en-IN")}), ${bestValue.quote.vendorName} (₹${bestValue.quote.quotedAmount.toLocaleString("en-IN")}) is the superior value choice. It provides ${bestValue.servicesCount} verified deliverables, protects against guest coverage shortfall (${bestValue.quote.guestCoverage || guestCount} pax covered), and eliminates ambiguous hidden extras that would otherwise exceed the ₹${premium.toLocaleString("en-IN")} difference.`;
    valueAssessment = `Superior peace of mind and deliverable depth. The ₹${premium.toLocaleString("en-IN")} premium delivers verified inclusions, transparent contractual terms, and prevents expensive day-of-event surcharges.`;
  }

  const comparisonSummary = `Compared ${quotations.length} vendor quotations for ${req.category}. While upfront pricing spans ₹${minPrice.toLocaleString("en-IN")} to ₹${maxPrice.toLocaleString("en-IN")}, analysis of service scopes, guest coverage guarantees, and unbundled surcharges indicates that ${bestValue.quote.vendorName} presents the highest overall value for your celebration.`;

  return {
    comparisonSummary,
    quotationDifferences: differences,
    advantages,
    disadvantages,
    additionalChargesAnalysis,
    missingInformationAlerts,
    questionsToAsk,
    recommendation: {
      vendorName: bestValue.quote.vendorName,
      quotationId: bestValue.quote.id,
      rationale,
      valueAssessment,
    },
    assumptions: [
      "Quotation amounts reflect current market rates and do not incorporate unannounced festival/auspicious date surcharges.",
      "GST (standard 18% for hospitality/event services) is assumed excluded unless explicitly marked as all-inclusive.",
      "Quotations are user-reported proposals and do not represent verified vendor contracts or real-time availability.",
    ],
    warnings: [
      "Do not transfer booking advances without a signed contract detailing service timings, deliverables, and refund clauses.",
      "Incomplete quotations must never be treated as guaranteed fixed prices.",
      "SamarohSathi AI does not book vendors or verify vendor credentials; all terms must be verified directly with the vendor.",
    ],
    analyzedAt: new Date().toISOString(),
    source: "deterministic-fallback",
  };
}
