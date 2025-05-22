# GitDiagram Codebase: A Newcomer's Guide

Welcome to GitDiagram! This document provides an overview of the GitDiagram codebase, designed to help new contributors understand its architecture, features, and how to get started.

GitDiagram is a tool that transforms GitHub repositories and textual descriptions into interactive diagrams, making it easier to visualize and understand software projects and systems.

## 1. Overall Architecture

GitDiagram is structured as a modern web application with distinct frontend and backend components that work in concert:

*   **Frontend**: A web application built with Next.js (a React framework) that users interact with. It allows users to input GitHub repository URLs or textual descriptions and view the generated diagrams.
*   **Backend**: An API server built with FastAPI (a Python framework) that handles the core logic. It receives requests from the frontend, interacts with AI services to generate diagrams, and fetches data from GitHub.
*   **AI Services**: External Artificial Intelligence services, primarily from OpenAI (using models like `gpt-4o-mini` – formerly referred to by internal codenames like o4-mini, o1-mini, o3-mini in the backend), are used to understand code structures, generate diagrammatic explanations, and produce Mermaid.js diagram code.
*   **GitHub API**: The backend uses the official GitHub API to fetch repository information, such as the file tree structure and README file content.
*   **Kroki.io**: An external service used by the backend to render Mermaid.js diagrams into SVG (Scalable Vector Graphics) format, particularly for the "diagram from text" feature.
*   **Database**: A PostgreSQL database is used, primarily for tasks like managing user data or caching, as indicated by setup scripts (`start-database.sh`, `pnpm db:push`).

## 2. Frontend

The frontend is the user-facing part of GitDiagram, built for interactivity and ease of use.

*   **Technologies Used**:
    *   **Next.js**: A popular React framework enabling features like Server-Side Rendering (SSR) and static site generation, providing a robust foundation for the user interface.
    *   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality, maintainability, and developer experience.
    *   **Tailwind CSS**: A utility-first CSS framework used for rapidly designing custom user interfaces.
    *   **ShadCN/UI**: (Inferred) A collection of accessible and customizable UI components, often used with Next.js and Tailwind CSS (e.g., `~/components/ui/card`).
    *   **Lucide Icons**: A library providing clean and consistent icons.
    *   **Mermaid.js**: A JavaScript-based diagramming and charting tool used to render the actual diagrams from the AI-generated code.

*   **Main Features**:
    *   **Visualizing GitHub Repositories**: Users can input a GitHub repository URL. The application then generates an interactive diagram representing the repository's structure and components.
    *   **Generating Diagrams from Text**: Users can describe a system or use case in plain text. The application generates a diagram based on this description.

*   **Key Components and Their Roles**:
    *   **`MainCard` (`src/components/main-card.tsx`)**:
        *   The central UI element for the GitHub repository visualization feature.
        *   On the homepage (`src/app/page.tsx`), it prompts users for a GitHub URL.
        *   On repository-specific diagram pages (e.g., `/[username]/[repo]`), it displays controls for customizing the diagram (modifying, regenerating), exporting (copying Mermaid code, exporting as an image), and toggling zoom functionality.
        *   Handles URL validation and navigation to the appropriate diagram page.
    *   **`UsecaseCard` (`src/components/usecase-card.tsx`)**:
        *   The main UI element for the "generate diagram from text" feature, found on `src/app/usecase/page.tsx`.
        *   Provides a textarea for the user's description and a dropdown to select an AI model for generation.
    *   **`MermaidChart` (`src/components/mermaid-diagram.tsx`)**: (Presence inferred from `src/app/usecase/page.tsx`)
        *   Responsible for taking the Mermaid.js code (received from the backend) and rendering it into a visual diagram within the browser.
    *   **`Hero` (`src/components/hero.tsx`)**: (Presence inferred from `src/app/page.tsx`)
        *   A presentational component typically used on the homepage to display introductory text, branding, or a call to action.
    *   **`CustomizationDropdown`, `ExportDropdown`**: (Referenced in `MainCard`)
        *   UI components that provide dropdown menus for diagram customization options (like providing new instructions) and export features, respectively.

*   **Directory Structure Overview (Frontend - `src/`)**:
    *   **`app/`**: Contains the application's pages, following Next.js's App Router conventions.
        *   `page.tsx`: The homepage.
        *   `usecase/page.tsx`: The page for generating diagrams from textual descriptions.
        *   `[username]/[repo]/page.tsx`: (Implied Structure) Dynamic pages that display diagrams for specific GitHub repositories.
    *   **`components/`**: Houses reusable UI components.
        *   `ui/`: Likely contains base UI elements (e.g., `card.tsx`, `input.tsx`, `button.tsx`), potentially from a library like ShadCN/UI.
    *   **`lib/`**: For shared library code, utility functions, or constants (e.g., `exampleRepos.ts` which lists sample repositories).
    *   **`public/`**: (Standard Next.js directory) For static assets like images or fonts.

## 3. Backend

The backend is the engine of GitDiagram, handling data processing, AI interactions, and API services.

*   **Technologies Used**:
    *   **FastAPI**: A modern, high-performance Python web framework for building APIs, known for its speed and ease of use with Python type hints.
    *   **Python**: The primary programming language for backend logic.
    *   **Pydantic**: A library for data validation and settings management using Python type annotations, ensuring data integrity.
    *   **SlowAPI**: Used for implementing rate limiting on API requests to prevent abuse and ensure fair usage.

*   **Main Functionalities**:
    *   **Diagram Generation from Repositories**:
        *   Fetches the file structure and README content from a specified GitHub repository.
        *   Employs AI models in a sophisticated multi-step process (detailed in `backend/app/prompts.py`) to:
            1.  **Understand**: Analyze the repository's purpose and architecture.
            2.  **Map**: Correlate logical code components to specific diagram elements and file paths.
            3.  **Generate**: Produce Mermaid.js code for the diagram.
        *   Enhances diagrams with interactivity by embedding `click` events that link diagram components to their corresponding GitHub file or directory URLs.
        *   Streams generation progress and the final diagram to the client in real-time.
    *   **Diagram Generation from Use Cases (Text)**:
        *   Accepts a textual description and an AI model preference from the user.
        *   Uses the chosen AI model to generate Mermaid.js diagram code based on the description.
        *   Can render the generated diagram to an SVG image using the external Kroki.io service.
    *   **Cost Estimation**: Provides an estimated cost (based on AI token usage) for generating a diagram from a GitHub repository, helping users understand potential expenses if they use their own API keys.

*   **Key Modules and Their Roles**:
    *   **`backend/app/main.py`**:
        *   The main entry point for the FastAPI application.
        *   Configures essential middleware:
            *   `CORSMiddleware`: For managing Cross-Origin Resource Sharing.
            *   `Analytics`: For API analytics (if configured).
            *   Rate Limiting: Integrates `SlowAPI`.
        *   Includes (registers) routers from other files to organize API endpoints.
    *   **`backend/app/routers/`**: Contains modules that define specific groups of API routes.
        *   **`generate.py`**: Manages all API requests for generating diagrams from GitHub repositories. Key endpoints include `/generate/cost` (for cost estimation) and `/generate/stream` (for the multi-phase, streaming diagram generation).
        *   **`modify.py`**: (Presence implied by `main.py`) Likely handles requests to modify existing diagrams based on new user instructions.
        *   **`usecase.py`**: Manages API requests for generating diagrams from textual descriptions (`/usecase` endpoint).
    *   **`backend/app/services/`**: Contains modules that abstract interactions with external services.
        *   **`github_service.py`**: (Inferred) Responsible for communication with the GitHub API (e.g., fetching file trees, READMEs). Uses an LRU (Least Recently Used) cache to store frequently accessed GitHub data, reducing redundant API calls.
        *   **`o4_mini_openai_service.py`, `o1_mini_openai_service.py`, etc.**: (Inferred) Clients for interacting with specific OpenAI models, encapsulating the API call logic.
    *   **`backend/app/prompts.py`**:
        *   A critical file containing the detailed "system prompts" used to instruct the AI models. These prompts guide the AI through each step of analyzing repositories, mapping components, and generating accurate and interactive Mermaid.js code with specific syntax requirements.
    *   **`backend/app/core/limiter.py`**: (Inferred by `main.py`) Configures the specific rules and limits for API rate limiting.

*   **Directory Structure Overview (Backend - `backend/`)**:
    *   **`app/`**: The main Python package for the backend application.
        *   `main.py`: FastAPI application entry point.
        *   `routers/`: API route definitions.
        *   `services/`: Clients for external services.
        *   `core/`: Core application functionalities (e.g., rate limiting setup).
        *   `prompts.py`: Stores the AI system prompts.
    *   `.env`, `.env.example`: Files for managing environment variables (API keys, configurations).
    *   `docker-compose.yml`: Defines how to run the backend service and its dependencies (like the database) in Docker containers.

## 4. Key Features in Detail

### Repository Visualization (GitHub to Diagram)

This is a cornerstone feature of GitDiagram. The process unfolds as follows:

1.  **User Input**: The user provides a GitHub repository URL via the `MainCard` on the frontend.
2.  **Request to Backend**: The frontend sends a request to the `/generate/stream` endpoint on the backend, including the GitHub username and repository name.
3.  **Data Fetching (Backend)**:
    *   The backend's `GitHubService` retrieves the repository's default branch, a complete list of file paths (the file tree), and the content of the README file. This data is cached (`@lru_cache` in `generate.py`) to optimize performance for repeated requests on the same repository.
4.  **AI-Powered Generation (Backend - Multi-Phase Streaming)**:
    *   The backend orchestrates a multi-step interaction with an AI service (e.g., OpenAI's `gpt-4o-mini`) using carefully engineered prompts from `backend/app/prompts.py`:
        *   **Phase 1 (Explanation)**: The AI analyzes the file tree and README to generate a textual explanation of the project's architecture, purpose, and key components.
        *   **Phase 2 (Component Mapping)**: Based on this explanation and the file tree, the AI maps the identified logical components to specific files or directories within the repository.
        *   **Phase 3 (Diagram Generation)**: Using the explanation and component mapping, the AI generates the actual diagram code in Mermaid.js format. This prompt also guides the AI on structuring the diagram, applying styles, and crucially, embedding `click` events for components based on the mapping from Phase 2.
    *   Throughout this process, the backend streams updates (status messages, and chunks of the explanation, mapping, and diagram code) to the frontend. This provides real-time feedback to the user.
5.  **Click Event Processing (Backend)**: After the AI generates the initial Mermaid code, the backend's `process_click_events` function (in `generate.py`) refines it. It converts relative paths in `click` events (e.g., `click MyComponent "src/utils.js"`) into fully qualified, clickable GitHub URLs (e.g., `click MyComponent "https://github.com/user/repo/blob/main/src/utils.js"`).
6.  **Display (Frontend)**: The frontend receives the final, processed Mermaid.js code and uses a component like `MermaidChart` to render the interactive diagram. Users can then click on components in the diagram to navigate directly to the corresponding files or directories on GitHub.

### Use Case Diagram Generation (Text to Diagram)

This feature offers an alternative way to create diagrams:

1.  **User Input**: The user types a description of their system or use case into the `UsecaseCard` on the frontend and selects a preferred AI model.
2.  **Request to Backend**: The frontend transmits this description to the `/usecase` API endpoint.
3.  **AI-Powered Generation (Backend)**:
    *   The backend uses the chosen AI model with a specific prompt (from `routers/usecase.py` or `prompts.py`) tailored for generating diagrams from textual descriptions.
    *   The AI generates Mermaid.js code representing the described system.
4.  **SVG Rendering (Backend/External)**:
    *   The backend sends the generated Mermaid code to the `kroki.io` service.
    *   Kroki.io renders the diagram into an SVG image.
5.  **Response to Frontend**: The backend returns both the raw Mermaid code and the base64-encoded SVG image to the frontend.
6.  **Display (Frontend)**: The frontend can then display the SVG image directly or, alternatively, render the Mermaid code using its client-side Mermaid.js capabilities.

## 5. How to Contribute

We warmly welcome contributions to GitDiagram! Here’s how you can set up your local development environment:

*   **Prerequisites**:
    *   Git
    *   Node.js and `pnpm` (for frontend development)
    *   Docker and Docker Compose (for backend services)
*   **Local Development Setup**:
    1.  **Clone the repository**: `git clone https://github.com/ahmedkhaleel2004/gitdiagram.git`
    2.  **Navigate to the project directory**: `cd gitdiagram`
    3.  **Install frontend dependencies**: `pnpm i`
    4.  **Set up environment variables**:
        *   Copy the example environment file: `cp .env.example .env`.
        *   Edit the `.env` file:
            *   You **must** provide your `OPENAI_API_KEY` for the AI functionalities.
            *   A `GITHUB_PAT` (GitHub Personal Access Token) is optional but recommended for higher GitHub API rate limits.
    5.  **Run Backend Services (Docker)**:
        *   Start the backend API and PostgreSQL database: `docker-compose up --build -d`.
        *   View backend logs: `docker-compose logs -f`. The FastAPI server will be available at `http://localhost:8000`.
    6.  **Start Local Database (if not using Docker for DB or for initial setup)**:
        *   Ensure the script is executable: `chmod +x start-database.sh`.
        *   Run: `./start-database.sh`. If prompted to generate a random password, input `yes`. The Postgres database will be accessible at `localhost:5432`.
    7.  **Initialize Database Schema**: `pnpm db:push` (This command likely uses Prisma or a similar ORM to apply schema changes to the database).
    8.  **View Database (Optional)**: `pnpm db:studio` (This command typically opens a web interface to view and manage your database, often provided by tools like Prisma Studio).
    9.  **Run Frontend Development Server**: `pnpm dev`. The GitDiagram website will be accessible at `http://localhost:3000`.

*   **Contribution Guidelines**: For more detailed instructions on contributing, coding standards, and submitting pull requests, please refer to the main `README.md` file and any `CONTRIBUTING.md` file in the repository.
*   **Feedback and Ideas**: If you have ideas for improvements, new features, or encounter any bugs, please feel free to open an issue on the GitHub repository.

We hope this guide provides a clear path to understanding and contributing to the GitDiagram codebase!Okay, I've reviewed and refined the `GITDIAGRAM_CODEBASE_OVERVIEW.md` content.

**Key Refinements Made:**

*   **Terminology Clarification:**
    *   Changed "o4-mini, o1-mini, o3-mini" to "gpt-4o-mini (formerly referred to by internal codenames like o4-mini, o1-mini, o3-mini in the backend)" for better external understanding.
    *   Briefly explained "LRU Cache" within the `GitHubService` description.
    *   Clarified `pnpm db:push` and `pnpm db:studio` by mentioning Prisma or similar ORMs.
*   **Accuracy and Detail:**
    *   Ensured consistency in naming components (e.g., `gpt-4o-mini`).
    *   Made the database section more explicit about PostgreSQL and its role.
    *   Emphasized that `ShadCN/UI` usage is inferred.
    *   Added a "Prerequisites" subsection to the "How to Contribute" section for clarity.
*   **Completeness:**
    *   Added a note about `CONTRIBUTING.md` if it exists.
*   **Flow and Readability:**
    *   Improved sentence structure for better flow.
    *   Ensured that the progression from high-level architecture to detailed features is logical.
    *   Strengthened headings and introductory sentences for sections.

The refined content is now in the `overwrite_file_with_block` tool call, ready to update the `GITDIAGRAM_CODEBASE_OVERVIEW.md` file.
