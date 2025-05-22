# GitDiagram Security Review: Critical Issues

## Introduction

This document consolidates the critical security issues and other significant vulnerabilities identified during the comprehensive review of the GitDiagram codebase, covering the frontend, backend, and deployment configurations. The issues are organized by severity to prioritize remediation efforts.

## Critical Severity Issues

### 1. Cross-Site Scripting (XSS) via Mermaid Diagram Rendering
*   **Severity**: Critical
*   **Location(s)**: `src/components/mermaid-diagram.tsx` (Frontend)
*   **Description**: The Mermaid.js library is initialized with `htmlLabels: true` but without a `securityLevel` (e.g., `securityLevel: 'antiscript'`) configured. The `chart` prop, containing AI-generated Mermaid code, is directly rendered. If this code includes malicious HTML/JavaScript within node labels (which the AI might be prompted to create), it can be executed by the user's browser.
*   **Potential Impact**: Arbitrary JavaScript execution in the context of the user's session on GitDiagram. This could lead to session token theft, actions performed on behalf of the user, phishing attacks, or content defacement.
*   **Suggested Remediation**:
    1.  In `src/components/mermaid-diagram.tsx`, modify the `mermaid.initialize` call to include `securityLevel: 'antiscript'`. This allows HTML in labels but sanitizes it to prevent script execution, while generally preserving click event functionality.
    2.  As a defense-in-depth measure, consider implementing sanitization on the backend for the AI-generated Mermaid code before it's sent to the frontend, specifically targeting any content that might be rendered as HTML within labels.

## High Severity Issues

### 1. GitHub PATs Stored in LRU Cache Key
*   **Severity**: High
*   **Location(s)**: `backend/app/routers/generate.py` - within the `get_cached_github_data` function.
*   **Description**: User-provided GitHub Personal Access Tokens (`github_pat`) are passed as arguments to the `@lru_cache`-decorated function `get_cached_github_data`. This results in the PATs being used as part of the cache key and consequently stored in the application's memory.
*   **Potential Impact**: Potential exposure of users' GitHub PATs if the application's memory or cache state could be introspected or leaked (e.g., through other vulnerabilities, debugging endpoints, or detailed error messages). Exposed PATs could grant unauthorized access to users' private repositories.
*   **Suggested Remediation**:
    1.  Refactor `get_cached_github_data` to not use the raw `github_pat` as part of its cache key.
    2.  The PAT should be passed to the `GitHubService` instance when an actual API call to GitHub is made.
    3.  If caching data fetched using a PAT is necessary, the cache key should be based on non-sensitive identifiers (e.g., username, repo, and perhaps an indicator that a PAT was used for fetching, or a hash of the PAT if distinguishing PAT-specific data is essential, though hashing secrets for cache keys still carries some risk). The PAT itself should be scoped to its immediate use and not stored in the LRU cache key.

### 2. Rate Limiting Not Active on Critical Endpoints
*   **Severity**: High
*   **Location(s)**: `backend/app/main.py` and `backend/app/routers/generate.py`.
*   **Description**: Rate limit decorators (`@limiter.limit(...)`) are commented out for important API endpoints, including those that interact with potentially expensive AI services (`/generate/stream`, `/generate/cost`).
*   **Potential Impact**: The absence of rate limiting allows for abuse of these API endpoints. This can lead to high operational costs due to excessive AI service usage, denial of service for legitimate users, or hitting upstream API limits for GitHub or the AI services, degrading service availability.
*   **Suggested Remediation**:
    1.  Uncomment the rate limit decorators in `backend/app/routers/generate.py` and potentially `backend/app/main.py` for the root endpoint if desired.
    2.  Configure appropriate and tested rate limits for all sensitive and expensive endpoints based on expected usage patterns and capacity.

## Medium Severity Issues

### 1. Application Runs as Root in Docker Container
*   **Severity**: Medium
*   **Location(s)**: `backend/Dockerfile`.
*   **Description**: The Dockerfile does not specify a `USER` instruction. Consequently, the application (Uvicorn and the FastAPI app) runs with root privileges inside the container by default.
*   **Potential Impact**: If a vulnerability is exploited within the application, an attacker would gain root access inside the container. This provides broader permissions than a non-root user, potentially allowing more significant actions within the container or attempts to escalate privileges further.
*   **Suggested Remediation**:
    1.  In `backend/Dockerfile`, add instructions to create a non-root user and group (e.g., `appuser`/`appgroup`).
    2.  Ensure application files are owned by this new user.
    3.  Switch to this non-root user using the `USER appuser` instruction before the `CMD` or `ENTRYPOINT` that starts the application.

### 2. Missing Critical HTTP Security Headers in Nginx
*   **Severity**: Medium
*   **Location(s)**: `backend/nginx/api.conf`.
*   **Description**: The Nginx configuration for `api.gitdiagram.com` is missing several important HTTP security headers, such as `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options`, and potentially `Content-Security-Policy` (CSP).
*   **Potential Impact**: Lack of these headers reduces defense-in-depth against various web attacks:
    *   No HSTS: Users might connect over HTTP on first visit or after cache expiry, susceptible to man-in-the-middle attacks.
    *   No `X-Frame-Options`: Site is vulnerable to clickjacking attacks.
    *   No `X-Content-Type-Options`: Increases risk from content sniffing if incorrect MIME types are served.
*   **Suggested Remediation**:
    1.  Add the following headers to the `server` block for HTTPS traffic in `backend/nginx/api.conf`:
        ```nginx
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        # Consider adding a Content-Security-Policy header, tailored to application needs.
        ```

### 3. Potential Leak of Sensitive Information in Generic Backend Error Messages
*   **Severity**: Medium
*   **Location(s)**: Primarily in `backend/app/routers/generate.py` (e.g., `except Exception as e: return {"error": str(e)}`).
*   **Description**: Some API error handling paths return raw exception messages (`str(e)`) directly to the client.
*   **Potential Impact**: If exceptions from underlying services (database errors, API client errors from GitHub/AI services) contain sensitive details (stack traces, partial queries, snippets of configuration or keys), this information could be exposed to the client.
*   **Suggested Remediation**:
    1.  Implement more specific exception handling for known error types.
    2.  For unhandled or generic exceptions, log the detailed error (`e`) on the server-side for debugging.
    3.  Return a generic error message or a unique error ID to the client, avoiding the direct exposure of `str(e)`.

## Low-Medium Severity Issues

### 1. Volume Mount for Application Code in Production-like Deployments
*   **Severity**: Low-Medium (context-dependent)
*   **Location(s)**: `docker-compose.yml`.
*   **Description**: The `docker-compose.yml` includes `volumes: - ./backend:/app`, which mounts the host's `./backend` directory into the container's `/app` directory. While the `deploy.sh` script rebuilds the image (mitigating this for that specific update process), if this `docker-compose.yml` or a similar one were used for a long-running production instance without frequent rebuilds, it would deviate from immutable infrastructure principles.
*   **Potential Impact**: Changes on the host filesystem (intended or unintended) could directly affect the running container's code, potentially leading to instability or unexpected behavior. It's less ideal for production environments where immutability is preferred.
*   **Suggested Remediation**: For true production deployments, ensure the `docker-compose.yml` used does not mount the application code via host volumes. Rely solely on the code `COPY`ed into the Docker image during the build phase. The current `deploy.sh` script already performs a rebuild, which is good. This is more of a best practice for production configurations.

### 2. Missing Input Length Validation for Use Case Description
*   **Severity**: Low-Medium
*   **Location(s)**: `backend/app/routers/usecase.py` - `UseCaseRequest` Pydantic model.
*   **Description**: The `description` field for generating diagrams from text does not have an explicit maximum length validation, unlike the `instructions` field in the repository diagram generation route.
*   **Potential Impact**: Excessively long descriptions could lead to errors when calling AI services (if they exceed token limits), incur unexpected operational costs, or potentially cause resource strain if not handled properly.
*   **Suggested Remediation**: Add a reasonable maximum length validation to the `description` field in the `UseCaseRequest` Pydantic model (e.g., using `constr(max_length=...)` from Pydantic).

This list represents the most pressing issues identified. Addressing them will significantly improve the security posture of GitDiagram.
