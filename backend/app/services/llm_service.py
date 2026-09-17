"""
Gemini LLM client wrapper using the official google-genai SDK.
Implements exponential backoff retries (max 3 attempts) and user-friendly error handling.
"""

import asyncio
import logging
import random
from typing import Optional
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import get_settings


logger = logging.getLogger(__name__)


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
        Execute an LLM generation call with 3-attempt exponential backoff retry.

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

                return response.text.strip()

            except HTTPException:
                # Re-raise explicit HTTP exceptions immediately
                raise

            except APIError as api_err:
                last_exception = api_err
                err_code = getattr(api_err, "code", "unknown")
                logger.warning(
                    f"Gemini API attempt {attempt}/{max_attempts} failed with APIError (code {err_code}): {api_err}"
                )
                if attempt < max_attempts:
                    # Exponential backoff with jitter
                    sleep_time = (base_delay * (2 ** (attempt - 1))) + random.uniform(0.1, 0.5)
                    await asyncio.sleep(sleep_time)
                else:
                    break

            except Exception as exc:
                last_exception = exc
                logger.warning(
                    f"LLM call attempt {attempt}/{max_attempts} encountered unexpected error: {type(exc).__name__}"
                )
                if attempt < max_attempts:
                    sleep_time = (base_delay * (2 ** (attempt - 1))) + random.uniform(0.1, 0.4)
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
