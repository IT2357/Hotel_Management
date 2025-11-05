# Vision Menu Service

Provider-agnostic service to enrich OCR menu extraction with LLM Vision models.

Inputs
- imageBuffer: Buffer of the uploaded menu image
- mimeType: Image MIME type (e.g., image/jpeg)
- ocrText: Raw text output from Tesseract

Outputs
- Array of items with fields: name_tamil, name_english, price, currency, description_english, ingredients[], isVeg, isSpicy, dietaryTags[], confidence

Providers
- off (default): enrichment disabled, OCR-only parsing
- mock: deterministic sample based on OCR text (enabled only when NODE_ENV !== production)
- gemini: Google Generative AI Vision (requires GEMINI_API_KEY)
- openai: OpenAI Vision (requires OPENAI_API_KEY)

Environment variables
- AI_PROVIDER=off|mock|gemini|openai
- GEMINI_API_KEY=... (when using gemini)
- OPENAI_API_KEY=... (when using openai)

Usage
- The controller `backend/controllers/food-complete/aiExtractionController.js` calls this service after OCR.
- Set AI_PROVIDER to 'off' (default) to disable enrichment and use OCR-only parsing.

Training and tuning guidance (Phase 2)
- Build a small “gold” dataset: 50–200 menu images with ground-truth JSON (names, descriptions, prices, ingredients, veg/spicy tags).
- Prompt tuning: In provider prompt, show 2–3 exemplar JSON outputs and instruct the model to return a strict JSON array following the schema (no extra text). Emphasize bilingual names and price normalization in LKR.
- Post-processing validation: Validate price ranges, dedupe by name+price, drop outliers, and clamp confidence to [0,100].
- Optional OCR tuning: Prepare a finetuned Tesseract language model for specific fonts (Tamil-heavy menus) to boost base OCR accuracy.

Notes
- Network calls are intentionally stubbed. To enable providers, wire the respective SDKs in `visionMenuService.js` and return normalized items.
- The controller merges enriched items with OCR items, preferring more complete fields and higher confidence.
