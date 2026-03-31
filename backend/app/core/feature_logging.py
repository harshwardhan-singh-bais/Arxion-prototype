import json
import logging
from typing import Any


def _safe_json(data: dict[str, Any]) -> str:
    try:
        return json.dumps(data, default=str, ensure_ascii=True)
    except Exception:
        return "{}"


def _emit(logger: logging.Logger, level: str, line: str) -> None:
    print(line)
    if level == "error":
        logger.error(line)
    else:
        logger.info(line)


def log_feature_start(
    logger: logging.Logger,
    feature: str,
    step: str,
    message: str,
    **context: Any,
) -> None:
    line = f"[L1][{feature}][{step}][START] {message} | ctx={_safe_json(context)}"
    _emit(logger, "info", line)


def log_feature_success(
    logger: logging.Logger,
    feature: str,
    step: str,
    message: str,
    **context: Any,
) -> None:
    line = f"[L1][{feature}][{step}][SUCCESS] {message} | ctx={_safe_json(context)}"
    _emit(logger, "info", line)


def log_feature_failure(
    logger: logging.Logger,
    feature: str,
    step: str,
    message: str,
    error: Any | None = None,
    **context: Any,
) -> None:
    payload = dict(context)
    if error is not None:
        payload["error"] = str(error)
    line = f"[L1][{feature}][{step}][FAILURE] {message} | ctx={_safe_json(payload)}"
    _emit(logger, "error", line)
