"""
Gemini LLM client wrapper using the official google-genai SDK.
Implements exponential backoff retries (max 3 attempts) and user-friendly error handling.
"""

import asyncio
import hashlib
import logging
import random
import re
from typing import Optional
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import get_settings


logger = logging.getLogger(__name__)

# Simple in-memory cache for expensive LLM calls
_LLM_CACHE = {}
_MAX_CACHE_SIZE = 100


class LLMService:
    """Wrapper for Google GenAI with exponential backoff retries and error masking."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.gemini_api_key.strip()
        self.model_name = settings.gemini_model
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> genai.Client:
        """Lazily initialize and return the GenAI client."""
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GEMINI_API_KEY is not configured on the server. Please add your key to the .env file.",
            )
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_mode: bool = False,
        temperature: float = 0.1,
    ) -> str:
        """
        Execute an LLM generation call with 3-attempt exponential backoff retry and caching.

        Args:
            prompt: User/task prompt.
            system_instruction: Meta-instruction for the model.
            json_mode: If True, requests JSON response MIME type.
            temperature: Sampling temperature (low for legal accuracy).

        Returns:
            Generated text output from Gemini.

        Raises:
            HTTPException: With a friendly message if retries are exhausted.
        """
        # Check in-memory cache
        cache_key = hashlib.sha256(
            f"{prompt}:{system_instruction}:{json_mode}:{temperature}".encode("utf-8")
        ).hexdigest()

        if cache_key in _LLM_CACHE:
            logger.info(f"Returning cached LLM response for key {cache_key[:8]}")
            return _LLM_CACHE[cache_key]

        client = self._get_client()

        # Build configuration
        config_kwargs = {
            "temperature": temperature,
        }
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if json_mode:
            config_kwargs["response_mime_type"] = "application/json"

        config = types.GenerateContentConfig(**config_kwargs)

        max_attempts = 3
        base_delay = 1.0  # seconds
        last_exception = None

        for attempt in range(1, max_attempts + 1):
            try:
                # Run synchronous SDK call in thread pool to avoid blocking async event loop
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                )

                if not response or not response.text:
                    raise ValueError("Empty response received from language model.")

                result_text = response.text.strip()
                if len(_LLM_CACHE) >= _MAX_CACHE_SIZE:
                    first_key = next(iter(_LLM_CACHE))
                    _LLM_CACHE.pop(first_key, None)
                _LLM_CACHE[cache_key] = result_text

                return result_text

            except HTTPException:
                # Re-raise explicit HTTP exceptions immediately
                raise

            except APIError as api_err:
                last_exception = api_err
                err_code = getattr(api_err, "code", "unknown")
                err_str = str(api_err)
                logger.warning(
                    f"Gemini API attempt {attempt}/{max_attempts} failed with APIError (code {err_code}): {api_err}"
                )
                if attempt < max_attempts:
                    # Parse server-recommended retry delay if available
                    match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_str)
                    if match:
                        sleep_time = min(float(match.group(1)) + 1.0, 30.0)
                    elif err_code == 429 or "RESOURCE_EXHAUSTED" in err_str:
                        sleep_time = min(4.0 * (2 ** (attempt - 1)), 25.0) + random.uniform(0.5, 1.5)
                    else:
                        sleep_time = (base_delay * (2 ** (attempt - 1))) + random.uniform(0.1, 0.5)
                    logger.info(f"Retrying LLM call in {sleep_time:.2f}s...")
                    await asyncio.sleep(sleep_time)
                else:
                    break

            except Exception as exc:
                last_exception = exc
                err_str = str(exc)
                logger.warning(
                    f"LLM call attempt {attempt}/{max_attempts} encountered unexpected error: {type(exc).__name__}"
                )
                if attempt < max_attempts:
                    match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_str)
                    if match:
                        sleep_time = min(float(match.group(1)) + 1.0, 30.0)
                    else:
                        sleep_time = (base_delay * (2 ** (attempt - 1))) + random.uniform(0.1, 0.4)
                    logger.info(f"Retrying LLM call in {sleep_time:.2f}s...")
                    await asyncio.sleep(sleep_time)
                else:
                    break

        # If loop finishes without returning, retries are exhausted
        logger.error(f"LLM generation failed after {max_attempts} attempts: {last_exception}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The legal analysis service is temporarily busy or unreachable. Please try again in a few moments.",
        )


# Singleton instance
_llm_service = None


def get_llm_service() -> LLMService:
    """Return singleton instance of LLMService."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
