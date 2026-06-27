from dataclasses import dataclass
from typing import Callable, Iterable

from fastapi import Depends, HTTPException, status


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    role: str


def get_current_user() -> CurrentUser:
    """
    Fail-closed placeholder for Team A's JWT auth.

    This stub intentionally rejects all requests until the real verified token
    flow replaces it in MentorOS.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication is not implemented in this repository yet.",
    )


def require_roles(*allowed_roles: str) -> Callable[[CurrentUser], CurrentUser]:
    """
    Role gating layered on top of get_current_user.

    Today's auth stub never returns a trusted user, so these checks are not
    meaningful yet. They exist to keep the dependency seam explicit for MentorOS.
    """

    def _require_roles(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this operation.",
            )
        return current_user

    return _require_roles
