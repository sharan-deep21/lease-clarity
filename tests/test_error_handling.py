"""
Unit tests for error handling, retries, exponential backoff, and exception masking.
"""

from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from fastapi import HTTPException
from google.genai.errors import APIError

from app.services.llm_service import LLMService


class TestLLMErrorHandlingAndRetries:
    """Test 3-attempt exponential backoff retry and graceful error masking."""

    @pytest.mark.asyncio
    async def test_successful_after_transient_failure(self):
        """Simulate failure on attempt 1, success on attempt 2."""
        service = LLMService()
        service.api_key = "test-key"

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"result": "success"}'

        # Side effect: first call raises APIError, second succeeds
        call_count = 0
        dummy_http_resp = httpx.Response(503, request=httpx.Request("POST", "https://example.com"))

        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise APIError(code=503, response=dummy_http_resp)
            return mock_response

        with patch.object(service, "_get_client", return_value=mock_client):
            mock_client.models.generate_content.side_effect = side_effect

            with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
                result = await service.generate("Test prompt")
                assert result == '{"result": "success"}'
                assert call_count == 2
                assert mock_sleep.call_count == 1

    @pytest.mark.asyncio
    async def test_fails_after_three_attempts_masks_error(self):
        """Confirm exactly 3 attempts made, then raises friendly 503 without raw trace."""
        service = LLMService()
        service.api_key = "test-key"

        dummy_http_resp = httpx.Response(
            429,
            content=b"RESOURCE_EXHAUSTED: Rate limit exceeded for default project 123456789",
            request=httpx.Request("POST", "https://example.com"),
        )
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = APIError(
            code=429,
            response=dummy_http_resp,
        )

        with patch.object(service, "_get_client", return_value=mock_client):
            with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
                with pytest.raises(HTTPException) as exc_info:
                    await service.generate("Prompt")

                # Verify 3 attempts took place (2 sleep delays before final attempt)
                assert mock_client.models.generate_content.call_count == 3
                assert mock_sleep.call_count == 2
                assert exc_info.value.status_code == 503
                # Verify raw sensitive API error (e.g. project number) is masked
                assert "123456789" not in exc_info.value.detail
                assert "temporarily busy" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_missing_api_key_raises_clear_error(self):
        service = LLMService()
        service.api_key = ""
        with pytest.raises(HTTPException) as exc_info:
            await service.generate("Prompt")
        assert exc_info.value.status_code == 500
        assert "GEMINI_API_KEY" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_llm_cache_key_differs_by_document_content(self):
        """Confirm that different document texts produce distinct cache keys and avoid collisions."""
        from app.services.llm_service import _LLM_CACHE
        _LLM_CACHE.clear()

        service = LLMService()
        service.api_key = "test-key"

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"summary": "Document analysis result"}'
        mock_client.models.generate_content.return_value = mock_response

        with patch.object(service, "_get_client", return_value=mock_client):
            # First call with Document A
            prompt_doc_a = "Analyze lease:\n<document>Rent is $1500/month</document>"
            res1 = await service.generate(prompt=prompt_doc_a)
            assert res1 == '{"summary": "Document analysis result"}'
            assert mock_client.models.generate_content.call_count == 1

            # Second call with identical Document A -> Cache Hit (no SDK call)
            res2 = await service.generate(prompt=prompt_doc_a)
            assert res2 == '{"summary": "Document analysis result"}'
            assert mock_client.models.generate_content.call_count == 1

            # Third call with different Document B -> Cache Miss (triggers SDK call)
            prompt_doc_b = "Analyze lease:\n<document>Rent is $2500/month</document>"
            res3 = await service.generate(prompt=prompt_doc_b)
            assert res3 == '{"summary": "Document analysis result"}'
            assert mock_client.models.generate_content.call_count == 2
            assert len(_LLM_CACHE) == 2

    @pytest.mark.asyncio
    async def test_llm_cache_ttl_expiration(self):
        """Confirm that an expired cache entry (>10 min old) is evicted and triggers a fresh API call."""
        import time
        from app.services.llm_service import _LLM_CACHE, _CACHE_TTL_SECONDS
        _LLM_CACHE.clear()

        service = LLMService()
        service.api_key = "test-key"

        mock_client = MagicMock()
        mock_response_fresh = MagicMock()
        mock_response_fresh.text = '{"summary": "Fresh response after TTL expiration"}'
        mock_client.models.generate_content.return_value = mock_response_fresh

        with patch.object(service, "_get_client", return_value=mock_client):
            prompt = "Analyze lease:\n<document>Rent is $1500/month</document>"
            # Populate cache
            await service.generate(prompt=prompt)
            assert mock_client.models.generate_content.call_count == 1

            # Manually age the cached entry past TTL (e.g. 601 seconds ago)
            for k in list(_LLM_CACHE.keys()):
                val, _ = _LLM_CACHE[k]
                _LLM_CACHE[k] = (val, time.time() - (_CACHE_TTL_SECONDS + 1.0))

            # Call again -> Expired entry must be evicted and a fresh API call made
            res = await service.generate(prompt=prompt)
            assert res == '{"summary": "Fresh response after TTL expiration"}'
            assert mock_client.models.generate_content.call_count == 2


