# Implementation Checklist: "Use Case to Diagram" Feature Enhancement

This checklist outlines the UI/UX and backend improvements for the "Use Case to Diagram" feature.

## I. UI/UX Improvements (`src/app/usecase/page.tsx`, `src/components/usecase-card.tsx`)

### High Priority:
- [x] **Diagram Display:** Modify `usecase/page.tsx` to primarily use the `MermaidDiagram` component for client-side rendering of Mermaid code received from the backend. *(Verified by code review)*
- [x] **Export Dropdown:**
    - [x] Implement "Copy Mermaid code" functionality. *(Verified by code review)*
    - [x] Implement "Download Diagram as SVG" (using client-side Mermaid rendering and an SVG export library/method). *(Verified by code review)*
    - [x] Implement "Download Diagram as PNG" (using client-side Mermaid rendering, potentially via canvas, and a PNG export library/method). *(Verified by code review)*
- [x] **Loading State:**
    - [x] Disable input fields (description, model select) and buttons in `UsecaseCard` while `loading` is true. *(Verified by code review)*
    - [x] Implement a loading indicator (e.g., spinner) specifically within the diagram display area or the `UsecaseCard` component itself, replacing the current global spinner below the card. (Spinner added to UsecaseCard button) *(Verified by code review)*
- [x] **Error Display:**
    - [x] Display API errors more prominently within the `UsecaseCard` or immediately adjacent to it (e.g., using a dedicated error message area or integrating with `sonner` for toasts if used elsewhere consistently). (Error display added to UsecaseCard) *(Verified by code review)*

### Medium Priority:
- [x] **Input Area Validation:**
    - [x] Add client-side validation to the `description` textarea in `UsecaseCard` to enforce a maximum character limit (e.g., 5000 characters). Provide user feedback if the limit is exceeded. *(Verified by code review)*
- [x] **Regenerate Button:**
    - [x] Add a "Regenerate" button to `UsecaseCard` or `usecase/page.tsx`. *(Verified by code review)*
    - [x] Clicking "Regenerate" should re-trigger the `handleSubmit` function with the current `description` and `model` values. *(Verified by code review)*

### Low Priority (Considered for initial structural alignment, can be deferred if complex):
- [ ] **Layout & Structure Refinement:**
    - [ ] Evaluate and potentially refactor `usecase/page.tsx` and `UsecaseCard` to align the layout more closely with how `MainCard` is used on repository diagram pages. This might involve `UsecaseCard` managing more of its own input state and the page focusing on diagram display and controls. (Defer if this involves major structural changes not essential for core functionality improvements).

### Styling (Ongoing with control implementation):
- [x] Ensure all new UI elements (buttons for export/regenerate, dropdowns) are styled consistently with the existing application theme (e.g., using `shadcn/ui` components and Tailwind CSS classes from `MainCard` as a reference). *(Partially verified by code review of new components; final pass would be visual)*

## II. Backend Enhancements (`backend/app/routers/usecase.py`)

### High Priority:
- [x] **Error Handling - AI Service:**
    - [x] Wrap `call_model` or individual AI service calls (e.g., `service.call_o1_api`) in specific try-except blocks to catch potential errors from the AI SDK (e.g., `openai.APIError`, or equivalent for other services if used). *(Verified by code review)*
    - [x] Return user-friendly error messages and appropriate HTTP status codes (e.g., 502 for bad gateway if AI service fails, 400 for bad input if AI deems it so). *(Verified by code review)*
- [x] **Error Handling - Kroki.io (if kept):**
    - [x] Add an explicit timeout (e.g., 15-30 seconds) to the `requests.post` call to `kroki.io`. (Kroki.io call removed from primary path) *(Verified by code review - Kroki removed)*
    - [x] Catch `requests.exceptions.Timeout` and other relevant `requests.exceptions` (e.g., `requests.exceptions.ConnectionError`). (Kroki.io call removed from primary path) *(Verified by code review - Kroki removed)*
    - [x] Return appropriate error responses (e.g., 504 Gateway Timeout for timeouts, 502 Bad Gateway for other Kroki issues). (Kroki.io call removed from primary path) *(Verified by code review - Kroki removed)*

### Medium Priority:
- [x] **Request Model (`UseCaseRequest`):**
    - [x] Add `maxLength` (or Pydantic equivalent like `constr(max_length=...)`) validation to the `description` field. *(Verified by code review)*
- [x] **Response Model (`UseCaseResponse` - or update existing return dict):**
    - [x] Ensure the primary successful response field is `mermaid_code: str`. *(Verified by code review)*
    - [x] **Decision Point:** If client-side rendering for SVG/PNG export is robust, remove `svg` (base64 SVG from Kroki) from the backend response to reduce payload size and backend processing. If Kroki is kept as a fallback, this field remains. (SVG from Kroki removed from response) *(Verified by code review)*

### Low Priority (Future Work):
- [ ] **AI Interaction - Explanation:**
    - [ ] (Optional) Consider modifying the AI prompt and response handling to include a brief `explanation` of the generated diagram, similar to the repository feature. This would be added to the response model.
- [ ] **Caching:**
    - [ ] Implement LRU caching (`@lru_cache`) for the `generate_diagram` function in `usecase.py`, using a tuple of `(body.description, body.model)` as the cache key. Ensure user-specific API keys are handled appropriately if they affect caching.
- [ ] **AI Interaction - Advanced Prompting:** Defer.
- [ ] **Click Events:** Defer.
- [ ] **Streaming:** Defer.

**(Testing Notes appended after checklist items)**
- Empty description submission is handled by backend check for empty AI result.
- Styling consistency for new elements appears good based on code, but final visual check would be beneficial.
- All major functionalities implemented in previous steps are logically sound based on code review.
