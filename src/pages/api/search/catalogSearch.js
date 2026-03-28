import { OpenAI } from "openai";
import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";

// ======================
// CONFIGURATION
// ======================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
});

const limitedCall = createLimitedCaller({
  ratePerSec: 1, // 60 RPM / 60 seconds
  burstCapacity: 60,
});

const chatBatcher = new MicroBatcher({
  maxBatchSize: 16,
  maxWaitMs: 50,
  transport: openaiMessagesTransportFactory({ openai }),
});

// ======================
// SYSTEM PROMPT (STRICT JSON OUTPUT)
// ======================
const SYSTEM_PROMPT_1 = `You are an expert automotive parts catalog matcher for Russian catalogs (Rossko/Laximo). Your task is to return MULTIPLE SEMANTICALLY PLAUSIBLE GROUPS (up to 5) where the queried part could logically exist in the vehicle structure — ranked by relevance. NEVER return groups with isLink=false.

INPUT STRUCTURE:
{
  "query": "user's search term (Russian/English)",
  "groups": [
    {"id":"string","name":"string","isLink":boolean,"parentId?":"string","catalogAggregator":"string"},
    ...
  ]
}

CORE PRINCIPLE: PARTS CAN EXIST IN MULTIPLE LOGICAL LOCATIONS
A single part may belong to:
- Its direct functional group (e.g., "Стойки стабилизатора" for stabilizer links)
- Its parent subsystem (e.g., "Рычаги и тяги подвески" for bushings)
- Related assemblies sharing the same installation location (e.g., "Подвеска" groups for suspension fasteners)

RETURN MULTIPLE CANDIDATES WHEN SEMANTICALLY VALID:
→ Return 3-5 groups ranked by accuracy DESCENDING (highest first)
→ Include groups representing DIFFERENT plausible locations where part could exist
→ Minimum accuracy threshold: 0.50 (exclude groups below 50% relevance)
→ Sort by: (a) semantic match strength, (b) subsystem proximity, (c) specificity

ACCURACY SCORING (0.0–1.0):
Base match (required minimum 0.50):
- 0.90: Exact semantic match + all critical terms present
- 0.80: Strong match with minor term omission (e.g., "прокладка ГБЦ" → "Прокладка головки цилиндра")
- 0.70: Component match within correct subsystem (e.g., "втулка рычага" → "Рычаги задней подвески")
- 0.60: Generic component match with contextual relevance (e.g., "болт подвески" → suspension fastener group)
- 0.50: Plausible location match (e.g., "гайка" → generic fastener group within relevant subsystem)
- <0.50: EXCLUDE

Directional handling:
- +0.10: Directional match (query "передний" → group contains "передн")
- +0.05: Generic group when directional variant missing (query "передний амортизатор" → "Амортизатор подвески")
- -0.30: Directional conflict (query "правый" → group contains ONLY "лев" without "прав") → EXCLUDE

RUSSIAN LINGUISTIC MAPPING (critical roots):
сайлентблок/втулк → втулка, втулки → match "Втулки рычага" OR "Рычаги подвески" (both valid locations)
стойк стабил → стойка стабилизатора → match "Стойки стабилизатора" (primary) + "Стабилизатор поперечной устойчивости" (parent)
прокладк → прокладка → match specific gasket group (e.g., "Прокладка клапанной крышки") + parent assembly ("Головка блока цилиндров" hierarchy)
болт/гайка → fasteners → match BOTH generic fastener group AND specific subsystem group (e.g., "Болт ГБЦ" → fasteners group + cylinder head groups)

STRICT CONSTRAINTS (NON-NEGOTIABLE):
⚠️ RETURN ONLY groups with isLink=true (NEVER isLink=false)
⚠️ Return groups EXACTLY as in input (no field modifications)
⚠️ Accuracy score MUST be 0.0–1.0 number (not percentage string)
⚠️ Maximum 5 groups, minimum 1 group if ≥0.50 accuracy exists
⚠️ When uncertain between equally valid groups → include all with appropriate scores
⚠️ NEVER invent groups or alter values

OUTPUT FORMAT (ABSOLUTE):
- ONLY valid JSON: array of objects with structure:
  [
    {"group": { /* EXACT group object from input with isLink=true */ }, "accuracy": 0.95},
    {"group": { /* next plausible location */ }, "accuracy": 0.82},
    {"group": { /* related subsystem */ }, "accuracy": 0.65},
    ...
  ]
- Empty array [] if no groups meet 0.50 threshold
- ZERO explanations, prefixes, wrappers, or text
- NO "result:", "answer:", or extra fields

VALID OUTPUT EXAMPLES:
[
  {"group": {"id":"484","name":"Стойки стабилизатора","isLink":true,"parentId":"481","catalogAggregator":"Laximo"}, "accuracy": 0.95},
  {"group": {"id":"482","name":"Стабилизатор","isLink":true,"parentId":"481","catalogAggregator":"Laximo"}, "accuracy": 0.75},
  {"group": {"id":"478","name":"Рычаги и тяги подвески","isLink":true,"parentId":"465","catalogAggregator":"Laximo"}, "accuracy": 0.60}
]

[
  {"group": {"id":"22","name":"Прокладка клапанной крышки","isLink":true,"parentId":"35","catalogAggregator":"Laximo"}, "accuracy": 0.92},
  {"group": {"id":"36","name":"Прокладка головки цилиндра","isLink":true,"parentId":"35","catalogAggregator":"Laximo"}, "accuracy": 0.78},
  {"group": {"id":"42","name":"Головка блока цилиндров","isLink":true,"parentId":"35","catalogAggregator":"Laximo"}, "accuracy": 0.55}
]

[]

INVALID (NEVER OUTPUT):
{"id":"35","name":"Головка блока цилиндров","isLink":false,...}  // isLink=false
"null", {"result":[...]}, [{"id":"...", "accuracy":"95%"}], Modified objects`;

const SYSTEM_PROMPT_2 = `You are an expert automotive parts matcher for Russian catalogs (Rossko/Laximo). Your task is to find the SINGLE MOST SEMANTICALLY APPROPRIATE PART from the provided "rosskoParts" array by understanding the part's FUNCTIONAL ROLE in the vehicle system — NOT by exact name matching.

INPUT STRUCTURE:
{
  "query": "user's search term (Russian/English)",
  "rosskoParts": [ { /* EXACT part object from Rossko API */ }, ... ]
}

CORE PRINCIPLE: SYSTEM > LITERAL NAME
Parts belong to VEHICLE SUBSYSTEMS (suspension, engine, brake). Match the query to the CORRECT SUBSYSTEM FIRST, then to component type within that subsystem. Never reject a valid part just because its goodsName lacks colloquial terms.

EXAMPLES OF SEMANTIC MAPPING (NOT LITERAL MATCHING):
| Query                     | Correct Part (Why)                                                                 |
|---------------------------|-----------------------------------------------------------------------------------|
| "сайлентблок заднего рычага" | {"goodsName":"Втулка стабилизатора \| перед \|"} → "сайлентблок" = втулка; рычаги/стабилизаторы share suspension bushings |
| "прокладка клапанной крышки" | {"goodsName":"Прокладка крышки клапанов"} → "крышки клапанов" = "клапанной крышки" (word order irrelevant) |
| "болт ГБЦ"                | {"goodsName":"Болт"} with marketGroupId=10133 + syntheticGroups containing engine groups → generic fasteners inherit parent system context |
| "отбойник амортизатора"   | {"goodsName":"Отбойник амортизатора \| перед \|"} → "отбойник" belongs to shock absorber subsystem |

CRITICAL MATCHING RULES (STRICT PRIORITY):
1. SUBSYSTEM IDENTIFICATION (MOST IMPORTANT):
   - Suspension queries → parts with syntheticGroups containing [1552,1670,2686,2471] OR marketGroupId in [10555,10754,11260,11641]
   - Engine queries → parts with syntheticGroups containing [18,35,68,102] OR marketGroupId in [10544,10886,11229]
   - Brake queries → parts with syntheticGroups containing [542,543,551] OR marketGroupId in [10474,11270]
   - Fasteners (болт/гайка/шпилька) → inherit subsystem from query context (e.g., "болт ГБЦ" → engine subsystem)

2. COMPONENT TYPE MAPPING (colloquial → technical):
   - "сайлентблок"/"втулка" → suspension bushings (marketGroupId 10842) OR stabilizer bushings (marketGroupId 10842)
   - "пыльник" → dust cover (marketGroupId 11421) — belongs to parent component (амортизатор/ШРУС)
   - "отбойник" → bump stop (marketGroupId 11270) — belongs to shock absorber subsystem
   - "опора" → bearing/support (marketGroupId 11329) — belongs to suspension/steering subsystem

3. INSTALLATION CONTEXT (directional matching):
   - Query specifies direction ("передний", "правый") → match parts where:
        a) goodsName contains directional term OR
        b) features contain matching "Ось установки" (668=перед, 669=зад) OR "Сторона установки" (666=прав, 665=лев)
   - If directional variant missing → accept generic part from correct subsystem (e.g., query "втулка заднего рычага" → "Втулка стабилизатора \| перед \|" is INVALID; must be rear suspension part)

STRICT CONSTRAINTS (NON-NEGOTIABLE):
⚠️ RETURN PART OBJECT EXACTLY AS IN INPUT rosskoParts ARRAY (no modifications)
⚠️ NEVER invent parts or alter field values
⚠️ When uncertain between equally valid parts → return literal null
⚠️ Prefer parts with matching subsystem context over literal goodsName matches

OUTPUT FORMAT (ABSOLUTE):
- ONLY valid JSON: exact part object OR literal null (no quotes)
- ZERO explanations, prefixes, wrappers, or text

VALID OUTPUT EXAMPLES:
{"id":"NSIN0004471785","partNumber":"48815-33100","goodsName":"Втулка стабилизатора | перед | ( 4881533101 )","marketGroupId":10842,"syntheticGroups":[1552,1670,2108,2686,2720,2471,2302],...}  // сайлентблок переднего стабилизатора → втулка стабилизатора
{"id":"NSIN0020300821","partNumber":"11213-36020","goodsName":"Прокладка крышки клапанов","marketGroupId":11382,"syntheticGroups":[1552,2088,1670,2686,2752,2471,2302],...}  // прокладка клапанной крышки → прокладка крышки клапанов
{"id":"NSIN0019641157","partNumber":"48820-33070","goodsName":"Стойка стабилизатора | перед прав/лев |","marketGroupId":11641,"syntheticGroups":[1552,1670,2117,2471,2686,2732,2301],...}  // стойка стабилизатора передняя → стойка стабилизатора с "перед"
null

INVALID (NEVER OUTPUT):
"null", {"result":{...}}, [], Modified objects, Truncated fields, Explanatory text`;

// ======================
// LLM WRAPPER WITH RETRY LOGIC
// ======================
const llmChat = (messages, options = {}) =>
  limitedCall(() => chatBatcher.enqueue({ messages, options }), {
    cost: 1,
    backoffOpts: {
      maxRetries: 6,
      baseMs: 250,
      onShouldRetry: (err) => {
        const code = err?.code;
        const status = err?.status ?? err?.response?.status;
        const transientNet = ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(
          code,
        );
        return (
          transientNet || status === 429 || (status >= 500 && status <= 599)
        );
      },
    },
  });

// ======================
// SAFE JSON PARSER (handles "null" string → actual null)
// ======================
function parseLlmResponse(raw) {
  if (!raw || typeof raw !== "string") return null;

  // Step 1: Strip markdown code block wrappers (```json ... ``` or ``` ... ```)
  let cleaned = raw.trim();
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*)\s*```$/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Step 2: Handle literal "null" variations
  if (cleaned === "null" || cleaned === '"null"' || cleaned === '""')
    return null;

  // Step 3: Parse as JSON
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Step 4: Fallback - try to extract JSON from within noisy text
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
      } catch (fallbackErr) {
        console.warn(
          "Failed to parse LLM response (fallback failed):",
          cleaned.substring(0, 200),
        );
        return null;
      }
    }

    console.warn("Failed to parse LLM response:", cleaned.substring(0, 200));
    return null;
  }
}

function parseGroupListResponse(raw) {
  if (!raw || typeof raw !== "string") return [];

  // Step 1: Strip markdown code block wrappers (```json ... ``` or ```)
  let cleaned = raw.trim();
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*)\s*```$/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Step 2: Handle explicit null/empty cases
  if (
    cleaned === "null" ||
    cleaned === '"null"' ||
    cleaned === '""' ||
    cleaned === "" ||
    cleaned.toLowerCase() === "none" ||
    cleaned === "[]"
  ) {
    return [];
  }

  // Step 3: Parse JSON with fallback extraction
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Fallback: Extract JSON array from noisy text
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      try {
        parsed = JSON.parse(cleaned.substring(arrayStart, arrayEnd + 1));
      } catch (fallbackErr) {
        console.warn(
          "Group parser fallback failed:",
          cleaned.substring(0, 200),
        );
        return [];
      }
    } else {
      console.warn(
        "Group parser failed - no valid JSON array found:",
        cleaned.substring(0, 200),
      );
      return [];
    }
  }

  // Step 4: Normalize to array of plain group objects
  if (Array.isArray(parsed)) {
    return parsed
      .filter(
        (item) =>
          item &&
          ((item.group &&
            typeof item.group === "object" &&
            item.group.id &&
            typeof item.group.isLink === "boolean") ||
            (item.id &&
              typeof item.isLink === "boolean" &&
              typeof item.name === "string")),
      )
      .map((item) => item.group || item) // Extract .group if wrapped, else use directly
      .filter(
        (group) =>
          group &&
          typeof group.id === "string" &&
          typeof group.name === "string" &&
          typeof group.isLink === "boolean",
      );
  }
  // Single group object (legacy fallback)
  else if (
    parsed &&
    parsed.id &&
    typeof parsed.isLink === "boolean" &&
    typeof parsed.name === "string"
  ) {
    return [parsed];
  }
  // Unexpected format → empty array
  else {
    console.warn("Unexpected group response format:", typeof parsed, parsed);
    return [];
  }
}

function smartGroupMatcher(query, groups) {
  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^\w\sа-яё]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normQuery = normalize(query);

  // Critical Russian roots for group matching (colloquial → technical)
  const componentRoots = {
    сайлентблок: ["втулк", "рычаг", "подвеск"],
    втулк: ["втулк", "рычаг", "подвеск", "стабил"],
    стойк: ["стойк", "стабил", "амортизатор"],
    стабил: ["стойк", "стабил", "втулк"],
    прокладк: ["прокладк", "крышк", "головк", "гбц"],
    сальник: ["сальник", "коленвал", "распредвал"],
    колодк: ["колодк", "тормоз"],
    отбойник: ["отбойник", "амортизатор", "пружин"],
    опора: ["опора", "амортизатор", "стойк"],
    пыльник: ["пыльник", "амортизатор", "шрус"],
    болт: ["болт", "крепл", "гбц", "головк"],
    гайк: ["гайк", "крепл"],
    шпильк: ["шпильк", "крепл"],
    фильтр: ["фильтр", "масл", "воздушн"],
    амортизатор: ["амортизатор", "стойк", "пружин"],
    пружин: ["пружин", "амортизатор"],
    рычаг: ["рычаг", "подвеск", "стабил"],
  };

  // Directional terms
  const directional = {
    front: /передн|перед/.test(normQuery),
    rear: /задн|зад/.test(normQuery),
    right: /прав(ый|ая|ые|ых)/.test(normQuery),
    left: /лев(ый|ая|ые|ых)/.test(normQuery),
  };

  // Score groups using ONLY name semantics + hierarchy
  const scored = groups
    .filter((g) => g?.isLink === true && g.name?.trim())
    .map((group) => {
      const normName = normalize(group.name);
      let score = 0;

      // Component root matching (primary signal)
      for (const [colloquial, roots] of Object.entries(componentRoots)) {
        if (normQuery.includes(colloquial)) {
          // Direct root match in group name
          if (roots.some((root) => normName.includes(root))) {
            score += 0.7;

            // Bonus for exact root match (not substring)
            if (
              roots.some((root) => new RegExp(`\\b${root}\\b`).test(normName))
            ) {
              score += 0.2;
            }
          }

          // Parent-child proximity: query mentions child component → match parent group
          // Example: "прокладка клапанной крышки" → match "Головка блока цилиндров" parent
          if (colloquial === "прокладк" && /головк|гбц/.test(normName))
            score += 0.3;
          if (colloquial === "сальник" && /коленвал|распредвал/.test(normName))
            score += 0.3;
          if (colloquial === "втулк" && /рычаг|подвеск/.test(normName))
            score += 0.3;
        }
      }

      // Directional matching (secondary signal)
      if (directional.front && /передн/.test(normName)) score += 0.3;
      if (directional.rear && /задн/.test(normName)) score += 0.3;
      if (directional.right && /прав/.test(normName)) score += 0.3;
      if (directional.left && /лев/.test(normName)) score += 0.3;

      // Generic component fallback (e.g., "болт" → any fastener group)
      if (
        /болт|гайк|шпильк/.test(normQuery) &&
        /крепл|болт|гайк/.test(normName)
      ) {
        score += 0.4;
      }

      // Word overlap bonus (catches partial matches)
      const queryWords = normQuery.split(/\s+/).filter((w) => w.length > 2);
      const nameWords = normName.split(/\s+/).filter((w) => w.length > 2);
      const overlap = queryWords.filter((qw) =>
        nameWords.some((nw) => nw.startsWith(qw)),
      ).length;
      if (overlap > 0) score += overlap * 0.1;

      return { group, score };
    })
    .filter((item) => item.score >= 0.5) // Minimum relevance threshold (was 0.4 - too low)
    .sort((a, b) => b.score - a.score);

  // Return top 3-5 candidates (enough for LLM disambiguation)
  const candidates = scored
    .slice(0, Math.min(5, scored.length))
    .map((item) => item.group);

  // CRITICAL SAFETY: Always return at least 3 groups if available (prevents fallback loop)
  if (candidates.length === 0 && groups.filter((g) => g.isLink).length >= 3) {
    console.warn(
      `[SMART MATCH] No semantic matches found for "${query}" - returning top 3 generic groups`,
    );
    return groups.filter((g) => g.isLink).slice(0, 3);
  }

  return candidates;
}
function compressGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return [];

  return groups
    .map((group) => {
      // Build minimal object with ONLY fields needed for semantic matching
      const compressed = {
        id: group.id?.toString() || "",
        name: group.name?.trim() || "",
        isLink: Boolean(group.isLink),
      };

      // Include parentId ONLY if present (top-level groups may omit it)
      if (group.parentId && group.parentId.trim()) {
        compressed.parentId = group.parentId.trim();
      }

      return compressed;
    })
    .filter(
      (group) =>
        group.id &&
        group.name &&
        group.name.length > 1 && // Skip empty/placeholder names
        (group.isLink === true || group.isLink === false), // Ensure valid boolean
    );
}

function compressParts(parts) {
  if (!Array.isArray(parts)) return [];

  return parts
    .filter((p) => p?.goodsName?.trim() && p.partNumber?.trim())
    .map((p) => {
      // Extract ONLY relevant features for directional/context matching
      const relevantFeatures = (p.features || []).filter(
        (f) =>
          f.name === "Ось установки" ||
          f.name === "Сторона установки" ||
          f.name === "Ассортимент",
      );

      return {
        id: p.id?.toString() || "",
        partNumber: p.partNumber.trim(),
        goodsName: p.goodsName.trim(),
        features: relevantFeatures.length > 0 ? relevantFeatures : undefined,
      };
    })
    .filter((p) => p.id && p.partNumber && p.goodsName);
}

// ======================
// SEARCH FUNCTION
// ======================

async function searchGroups(catalogData, parsedResults, partName, catalog_Id) {
  let rawUnitsContent = "null";
  let parsedUnitsResult = null;
  const unitsDataArray = [];
  let tokensUsed = 0;

  for (const parsedResult of parsedResults) {
    if (!parsedResult?.id) continue;

    try {
      // Fetch details API (no LLM call - no tokens)
      const detailsRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/py/details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ssd: catalogData.vinLookup.response_text.car.ssd,
            vehicleId: catalogData.vinLookup.response_text.car.id,
            catalogId: catalog_Id,
            groupId: parsedResult.id,
            parentGroupId: parsedResult.parentId || null,
          }),
        },
      );

      if (!detailsRes.ok) {
        console.warn(
          `[TOKENS] Details API failed (HTTP ${detailsRes.status}) for group ${parsedResult.id}`,
        );
        continue;
      }

      const detailsData = await detailsRes.json();
      const units = detailsData.parsed?.units || [];

      if (units.length === 0) {
        console.warn(`[TOKENS] No units found for group ${parsedResult.id}`);
        continue;
      }

      // Process each unit
      for (const unit of units) {
        if (!unit?.ssd || !unit?.id) continue;

        try {
          // Fetch unit API (no LLM call - no tokens)
          const unitRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/py/unit`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ssd: unit.ssd,
                catalogId: catalog_Id,
                unitId: unit.id,
              }),
            },
          );

          if (!unitRes.ok) {
            console.warn(
              `[TOKENS] Unit API failed (HTTP ${unitRes.status}) for unit ${unit.id}`,
            );
            continue;
          }

          const unitsData = await unitRes.json();
          if (!unitsData?.parsed?.rosskoParts?.length) {
            console.warn(`[TOKENS] No rosskoParts found for unit ${unit.id}`);
            continue;
          }

          // COMPRESS DATA BEFORE SENDING TO LLM (critical for token reduction)
          const compressedParts = compressParts(unitsData.parsed.parts);
          const compressedRosskoParts = compressParts(
            unitsData.parsed.rosskoParts,
          );

          // PART MATCHING LLM CALL (TOKENS ACCUMULATED HERE)
          const messages = [
            { role: "system", content: SYSTEM_PROMPT_2 },
            {
              role: "user",
              content: `QUERY: "${partName.trim()}"\nPARTS (${compressedParts.length}):\n${JSON.stringify(compressedParts)}\nROSSKO PARTS (${compressedRosskoParts.length}):\n${JSON.stringify(compressedRosskoParts)}\n\nRETURN ONLY VALID JSON: single part object OR 'null'.`,
            },
          ];

          const secondResponse = await llmChat(messages, {
            model: "gpt-4o-mini",
            temperature: 0,
          });

          // ACCUMULATE TOKENS FROM THIS LLM CALL
          if (secondResponse?.usage?.total_tokens) {
            tokensUsed += secondResponse.usage.total_tokens;
            console.log(
              `[TOKENS] Part matching LLM call used ${secondResponse.usage.total_tokens} tokens (cumulative: ${tokensUsed})`,
            );
          } else {
            console.warn("[TOKENS] LLM response missing usage data");
          }

          rawUnitsContent = secondResponse.choices[0].message.content || "null";
          parsedUnitsResult = parseLlmResponse(rawUnitsContent);
          unitsDataArray.push(unitsData);

          if (parsedUnitsResult !== null) {
            console.log(
              `[MATCH] ✅ Found matching part: ${parsedUnitsResult.partNumber || parsedUnitsResult.id}`,
            );
            return {
              rawUnitsContent,
              parsedUnitsResult,
              unitsDataArray,
              tokensUsed,
            };
          }
        } catch (unitError) {
          console.warn(
            `[TOKENS] Error processing unit ${unit.id}:`,
            unitError.message,
          );
          continue;
        }
      }
    } catch (groupError) {
      console.warn(
        `[TOKENS] Error processing group ${parsedResult?.id}:`,
        groupError.message,
      );
      continue;
    }
  }

  return { rawUnitsContent, parsedUnitsResult, unitsDataArray, tokensUsed };
}

// ======================
// API HANDLER
// ======================
export default async function handler(req, res) {
  let totalTokensUsed = 0;

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed. Use POST only.",
      });
    }

    const { vin, partName } = req.body;
    if (!vin?.trim() || !partName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: vin and partName",
      });
    }

    // Fetch catalog (no LLM call - no tokens)
    const catalogRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/py/catalog`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: vin.trim() }),
      },
    );

    if (!catalogRes.ok) {
      throw new Error(`Catalog API error: ${catalogRes.status}`);
    }

    const catalogData = await catalogRes.json();
    if (!Array.isArray(catalogData.groups)) {
      throw new Error("Invalid catalog response: groups not an array");
    }

    console.log(
      `[AI MATCHER] 🔍 Matching part: "${partName.trim()}" against ${catalogData.groups.length} groups`,
    );

    // === STAGE 1: OPTIMIZED GROUP MATCHING (TOKEN-EFFICIENT) ===
    const candidateGroups = smartGroupMatcher(
      partName.trim(),
      catalogData.groups,
    );
    const compressedGroups = compressGroups(candidateGroups);
    console.log(
      `[TOKENS] Returned ${compressedGroups.length} Candidate Groups out of ${catalogData.groups.length} groups`,
    );

    let messages = [
      { role: "system", content: SYSTEM_PROMPT_1 },
      {
        role: "user",
        content: `QUERY: "${partName.trim()}"\nGROUPS (${compressedGroups.length}):\n${JSON.stringify(compressedGroups)}\n\nRETURN ONLY VALID JSON: array of {group, accuracy} objects.`,
      },
    ];

    // GROUP MATCHING LLM CALL #1 (TOKENS ACCUMULATED)
    const firstResponse = await llmChat(messages, {
      model: "gpt-4o-mini",
      temperature: 0,
    });

    if (firstResponse?.usage?.total_tokens) {
      totalTokensUsed += firstResponse.usage.total_tokens;
      console.log(
        `[TOKENS] Group matching LLM call #1 used ${firstResponse.usage.total_tokens} tokens (total: ${totalTokensUsed})`,
      );
    }

    let rawContent = firstResponse.choices[0].message.content || "null";
    let parsedResults = parseGroupListResponse(rawContent);
    console.log(`[TOKENS] Parsed ${parsedResults.length} candidate groups`);

    // === STAGE 2: PART MATCHING (WITH TOKEN TRACKING) ===
    const catalog_Id = catalogData.vinLookup.response_text.car.catalog;
    let searchResult = await searchGroups(
      catalogData,
      parsedResults,
      partName.trim(),
      catalog_Id,
    );
    totalTokensUsed += searchResult.tokensUsed;

    // === FALLBACK: Retry WITHOUT pre-filtering if no match found ===
    if (
      searchResult.parsedUnitsResult === null &&
      compressedGroups.length < catalogData.groups.length
    ) {
      console.log(
        "[TOKENS] No match found - retrying with FULL group list (fallback)",
      );

      messages = [
        { role: "system", content: SYSTEM_PROMPT_1 },
        {
          role: "user",
          content: `QUERY: "${partName.trim()}"\nGROUPS (${catalogData.groups.length}):\n${JSON.stringify(catalogData.groups)}\n\nRETURN ONLY VALID JSON: array of {group, accuracy} objects.`,
        },
      ];

      // GROUP MATCHING LLM CALL #2 (TOKENS ACCUMULATED)
      const fallbackResponse = await llmChat(messages, {
        model: "gpt-4o-mini",
        temperature: 0,
      });

      if (fallbackResponse?.usage?.total_tokens) {
        totalTokensUsed += fallbackResponse.usage.total_tokens;
        console.log(
          `[TOKENS] Group matching LLM call #2 (fallback) used ${fallbackResponse.usage.total_tokens} tokens (total: ${totalTokensUsed})`,
        );
      }

      rawContent = fallbackResponse.choices[0].message.content || "null";
      parsedResults = parseGroupListResponse(rawContent);
      console.log(
        `[TOKENS] Fallback parsed ${parsedResults.length} candidate groups`,
      );

      // PART MATCHING WITH FULL GROUP LIST (TOKENS ACCUMULATED)
      searchResult = await searchGroups(
        catalogData,
        parsedResults,
        partName.trim(),
        catalog_Id,
      );
      totalTokensUsed += searchResult.tokensUsed;
    }

    // === FINAL RESPONSE WITH TOKEN METRICS ===
    return res.status(200).json({
      success: true,
      firstResponseData: parsedResults,
      secondResponseData: searchResult.parsedUnitsResult,
      firstResponseRaw: rawContent,
      secondResponseRaw: searchResult.rawUnitsContent,
      catalogData,
      detailsData: searchResult.unitsDataArray.map((u) => u.detailsData),
      unitsData: searchResult.unitsDataArray,
      tokenMetrics: {
        totalTokensUsed,
        groupMatchingTokens: firstResponse?.usage?.total_tokens || 0,
        partMatchingTokens: searchResult.tokensUsed,
        fallbackUsed:
          searchResult.parsedUnitsResult === null &&
          filteredGroups.length < catalogData.groups.length,
        prefilteredGroupCount: candidateGroups.length,
        totalGroupCount: catalogData.groups.length,
      },
    });
  } catch (error) {
    console.error("Part matching error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to match part group",
      tokenMetrics: {
        totalTokensUsed,
        error: error.message,
      },
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
