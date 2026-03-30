import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractCarDataFromVin(input, vin) {
  console.log("[extractCarDataFromVin] === START ===");
  console.log("[extractCarDataFromVin] VIN:", vin);
  console.log("[extractCarDataFromVin] Input type:", typeof input);
  console.log("[extractCarDataFromVin] Input keys:", Object.keys(input || {}));

  // 🔥 SAFE DEBUG: Check Array.isArray BEFORE using array methods
  const attrs = input?.attributes;
  const attrsInfo = Array.isArray(attrs)
    ? {
        type: "array",
        count: attrs.length,
        hasOptions: attrs.some((a) => a.key === "options"),
      }
    : attrs && typeof attrs === "object"
      ? {
          type: "object",
          keys: Object.keys(attrs),
          hasOptions: "options" in attrs,
        }
      : { type: "missing" };

  console.log("[extractCarDataFromVin] Attributes info:", attrsInfo);
  console.log(
    "[extractCarDataFromVin] Input snippet:",
    JSON.stringify(
      {
        id: input?.id,
        name: input?.name,
        brand: input?.brand,
        attributesType: attrsInfo.type,
      },
      null,
      2,
    ),
  );

  try {
    let carData = input;

    // Step 1: Parse attributes - handle BOTH array (raw) and object (parsed) formats
    const parsedAttrs = {};
    if (Array.isArray(carData?.attributes)) {
      // Raw Rossko format: [{ key: "model", value: "ASV50L-RETNKX", name: "Модель" }, ...]
      for (const attr of carData.attributes) {
        if (attr?.key && attr?.value) {
          parsedAttrs[attr.key] = {
            value: attr.value,
            name: attr.name || attr.key,
          };
        }
      }
    } else if (carData?.attributes && typeof carData.attributes === "object") {
      // Already-parsed format from parseVinResponse: { model: { value: "...", name: "..." }, ... }
      for (const [key, attr] of Object.entries(carData.attributes)) {
        if (attr?.value) {
          parsedAttrs[key] = attr; // Already in { value, name } format
        }
      }
    }

    console.log(
      "[extractCarDataFromVin] Parsed attributes keys:",
      Object.keys(parsedAttrs),
    );

    // Step 2: Extract options string - handle both formats
    const optionsValue = parsedAttrs.options?.value || parsedAttrs.options;
    const optionsStr = typeof optionsValue === "string" ? optionsValue : "";
    console.log(
      "[extractCarDataFromVin] Options string preview:",
      optionsStr.substring(0, 100) + "...",
    );

    // Step 3: Use LLM with structured JSON output
    const systemPrompt = `You are a car data extraction expert. Map the provided Rossko VIN response to the target schema.

TARGET SCHEMA (return ONLY valid JSON with these exact fields):
{
  "vin": string (required),
  "make": string | null,
  "model": string | null,
  "year": number | null,
  "color": string | null,
  "mileage": number | null,
  "licensePlate": string | null,
  "engine": string | null,
  "transmission": string | null,
  "driveType": string | null,
  "fuelType": string | null
}

EXTRACTION RULES:
- "make": Use carData.brand directly
- "model": Use carData.name directly
- "year": Extract 4-digit year from parsedAttrs.date.value ("05.2013" → 2013) OR parsedAttrs.prodPeriod.value
- "color": Use parsedAttrs.framecolor.value
- "engine": Parse from optionsStr after "Двигатель:" until semicolon
- "transmission": Parse from optionsStr after "Тип трансмиссии:" or "АКПП/МКПП:"
- "driveType": Parse from optionsStr after "Расположение руля:"
- "fuelType": If model contains "HYBRID" → "Hybrid"; else if options contains "Diesel" → "Diesel"; else "Gasoline"
- "mileage" & "licensePlate": Always return null
- Return null for undeterminable fields - NEVER guess
- Return ONLY valid JSON, no markdown, no explanations`;

    const userContent = `VIN: ${vin}

CAR DATA:
${JSON.stringify(
  {
    brand: carData?.brand,
    name: carData?.name,
    catalog: carData?.catalog,
    attributes: parsedAttrs,
    options: optionsStr,
  },
  null,
  2,
)}`;

    console.log("[extractCarDataFromVin] Calling OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log("[extractCarDataFromVin] LLM result:", result);

    // Ensure VIN field
    if (!result?.vin) result.vin = vin;

    // Type coercion
    if (result.year && typeof result.year === "string") {
      const yearNum = parseInt(result.year, 10);
      result.year = Number.isFinite(yearNum) ? yearNum : null;
    }
    if (result.mileage && typeof result.mileage === "string") {
      result.mileage = parseFloat(result.mileage) || null;
    }

    console.log("[extractCarDataFromVin] === FINAL ===");
    console.log("[extractCarDataFromVin] Normalized car:", result);
    console.log("[extractCarDataFromVin] === END ===\n");

    return result;
  } catch (error) {
    console.error("[extractCarDataFromVin] ❌ LLM failed:", error.message);
    console.log("[extractCarDataFromVin] Falling back to rule-based");
    return fallbackExtractCarData(input, vin);
  }
}

// Fallback: rule-based extraction
function fallbackExtractCarData(input, vin) {
  console.log("[fallbackExtractCarData] Running fallback");

  let carData = input;
  if (input?.car) carData = input.car;
  else if (input?.data?.car) carData = input.data.car;

  const attrs = {};
  if (Array.isArray(carData?.attributes)) {
    for (const a of carData.attributes) {
      if (a?.key && a?.value) attrs[a.key] = a.value;
    }
  } else if (carData?.attributes && typeof carData.attributes === "object") {
    for (const [k, v] of Object.entries(carData.attributes)) {
      if (v?.value) attrs[k] = v.value;
    }
  }
  const options = attrs.options || "";

  const extractAfter = (text, label) => {
    if (!text || !label) return null;
    const regex = new RegExp(`${label}:\\s*([^;]+)`, "i");
    return text.match(regex)?.[1]?.trim() || null;
  };

  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const match1 = dateStr.match(/(\d{4})/);
    if (match1) return parseInt(match1[1], 10);
    const match2 = dateStr.match(/(\d{2})\.(\d{4})/);
    if (match2) return parseInt(match2[2], 10);
    return null;
  };

  const result = {
    vin,
    make: carData?.brand || null,
    model: carData?.name || null,
    year: extractYear(attrs.date) || extractYear(attrs.prodPeriod),
    color: attrs.framecolor || null,
    mileage: null,
    licensePlate: null,
    engine:
      extractAfter(options, "Двигатель") || extractAfter(options, "Engine"),
    transmission:
      extractAfter(options, "Тип трансмиссии") ||
      extractAfter(options, "АКПП/МКПП") ||
      extractAfter(options, "TRANSMISSION"),
    driveType:
      extractAfter(options, "Расположение руля") ||
      extractAfter(options, "Привод") ||
      extractAfter(options, "DRIVE"),
    fuelType: carData?.name?.toLowerCase().includes("hybrid")
      ? "Hybrid"
      : options.toLowerCase().includes("diesel")
        ? "Diesel"
        : options.toLowerCase().includes("electric")
          ? "Electric"
          : "Gasoline",
  };

  console.log("[fallbackExtractCarData] Result:", result);
  return result;
}
