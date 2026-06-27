from backend.app.core.auth import get_current_user
from backend.app.main import app


def _route_uses_dependency(route, dependency):
    stack = list(getattr(route.dependant, "dependencies", []))
    while stack:
        dep = stack.pop()
        if dep.call is dependency:
            return True
        stack.extend(getattr(dep, "dependencies", []))
    return False


def test_all_api_v1_routes_in_scoring_students_and_mentoring_require_current_user():
    from fastapi.routing import APIRoute, _IncludedRouter

    def get_routes(r_list):
        res = []
        for r in r_list:
            if isinstance(r, APIRoute):
                res.append(r)
            elif isinstance(r, _IncludedRouter):
                res.extend(get_routes(r.original_router.routes))
        return res

    flat_routes = get_routes(app.routes)
    api_routes = [
        route for route in flat_routes
        if getattr(route, "path", "").startswith("/api/v1/")
        and getattr(route, "methods", None)
        and getattr(route, "path", "") != "/api/v1/health"
    ]

    assert api_routes, "Expected API routes under /api/v1/"
    missing = [route.path for route in api_routes if not _route_uses_dependency(route, get_current_user)]
    assert missing == []
