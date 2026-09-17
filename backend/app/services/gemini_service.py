import asyncio
import logging
import json
from typing import List, Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("lifeos.gemini")

FALLBACK_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-3.6-flash",
]

class GeminiService:
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "your-google-gemini-api-key":
            try:
                from google import genai
                self.client = genai.Client(api_key=api_key)
                logger.info("Google Gen AI SDK initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Google Gen AI SDK: {e}")

    def is_configured(self) -> bool:
        if self.client is None:
            self._init_client()
        return self.client is not None

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        model: Optional[str] = None
    ) -> str:
        """Generates text using Gemini model with system instructions, automated retries, and fallback cascade."""
        if not self.is_configured():
            return (
                "⚠️ Gemini API key is not configured yet. "
                "Please add your `GEMINI_API_KEY` to the `.env` file to enable live AI responses. "
                f"Simulated response for: '{prompt[:100]}...'"
            )

        requested_model = model or settings.GEMINI_MODEL
        candidate_models: List[str] = []
        for m in [requested_model] + FALLBACK_MODELS:
            if m and m not in candidate_models:
                candidate_models.append(m)

        from google.genai import types
        config = types.GenerateContentConfig(
            temperature=temperature,
            system_instruction=system_instruction
        )

        last_error = None
        for current_model in candidate_models:
            for attempt in range(2):
                try:
                    response = await asyncio.wait_for(
                        asyncio.to_thread(
                            self.client.models.generate_content,
                            model=current_model,
                            contents=prompt,
                            config=config
                        ),
                        timeout=14.0
                    )
                    if response:
                        if response.text and response.text.strip():
                            return response.text.strip()
                        # Check candidates if response.text is blank
                        if hasattr(response, "candidates") and response.candidates:
                            candidate = response.candidates[0]
                            if hasattr(candidate, "content") and hasattr(candidate.content, "parts"):
                                part_texts = [p.text for p in candidate.content.parts if hasattr(p, "text") and p.text]
                                if part_texts:
                                    return "".join(part_texts).strip()
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    is_overloaded = (
                        "503" in err_str
                        or "unavailable" in err_str
                        or "high demand" in err_str
                        or "429" in err_str
                        or "resource_exhausted" in err_str
                        or "timeout" in err_str
                    )
                    logger.warning(
                        f"Gemini error with model '{current_model}' (attempt {attempt + 1}/2): {e}"
                    )
                    if is_overloaded and attempt == 0:
                        await asyncio.sleep(0.8)
                        continue
                    else:
                        # Switch to next fallback model in candidate_models
                        break

        logger.error(f"All Gemini models in fallback chain failed. Last error: {last_error}")
        return (
            "> ⚠️ **AI Service High Demand**: Google's AI servers are temporarily experiencing high traffic spikes. "
            "The system attempted multiple backup models. Please resend your question in a moment."
        )

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> Any:
        """Generates structured JSON using Gemini."""
        if not self.is_configured():
            return None

        enhanced_system = (system_instruction or "") + "\nRespond strictly in valid JSON format without markdown code blocks."
        text_response = await self.generate_text(
            prompt=prompt,
            system_instruction=enhanced_system,
            temperature=temperature
        )
        try:
            cleaned = text_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"Failed to parse JSON from Gemini response: {e}")
            return None

    async def generate_embedding(self, text: str) -> List[float]:
        """Generates embedding using gemini-embedding-001."""
        if not self.is_configured() or not text.strip():
            return [0.0] * 768

        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.client.models.embed_content,
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    contents=text
                ),
                timeout=10.0
            )
            if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                return list(response.embedding.values)
            elif hasattr(response, "embeddings") and response.embeddings:
                return list(response.embeddings[0].values)
            return [0.0] * 768
        except Exception as e:
            logger.error(f"Gemini embedding error: {e}")
            return [0.0] * 768

gemini_service = GeminiService()
