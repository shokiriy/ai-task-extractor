# AI Task Extractor

`ai-task-extractor` is a small, production-style full-stack learning project for Java backend developers taking their first step into AI Engineering. A user submits an unstructured task through a React web UI, an LLM turns it into a strongly typed Java record, and the application stores both the source text and extracted fields in MySQL.

This repository intentionally stays small: one Spring Boot application, one focused React UI, one AI use case, and one database. It has no authentication, vector database, RAG, agent loop, or microservices.

## What this project teaches

### What the LLM does

The LLM performs semantic extraction. It recognizes meaning that ordinary parsing rules would struggle with: an action, a person, a priority phrase, a category, and relative time such as “tomorrow at 14:00.” It does **not** own persistence, HTTP, validation, or the application workflow. Those remain deterministic backend responsibilities.

### Spring AI `ChatClient`

`ChatClient` is Spring AI's fluent API for communicating with a chat model. `AiTaskExtractorService` gives it a system instruction and a separate user message, requests a typed result, and hides provider details from the rest of the application.

### System prompt vs user prompt

- The **system prompt** defines the extraction role, allowed values, null-handling rules, the current date/time, and safety boundaries.
- The **user prompt** contains only the task text to analyze.

Keeping these roles separate makes the contract easier to understand and evolve. User text is treated as data, not as trusted instructions.

### Structured output

The service does not ask the model for a paragraph and then split strings. It asks Spring AI to map provider-native structured output into `ExtractedTask`:

```java
.entity(ExtractedTask.class, spec -> spec
        .useProviderStructuredOutput()
        .validateSchema());
```

Spring AI derives a schema from the Java record, sends the schema as a provider-level constraint, validates the returned structure, and converts it to the requested Java type.

### Why the Java DTO schema matters

`ExtractedTask` is an explicit contract. The compiler and Jackson know each field's type: `TaskPriority` cannot silently become an arbitrary priority string, and `deadline` is a `LocalDateTime`, not an ambiguous sentence. This gives downstream business code a stable shape to work with.

### Why arbitrary AI prose should not be parsed

LLM wording can change between calls. A model might add Markdown, reorder labels, or explain its answer. String splitting and regular expressions against that prose are fragile. Schema-constrained structured output makes the expected shape explicit and lets malformed results fail safely.

### Hallucination

Hallucination is when a model produces plausible but unsupported information. The prompt explicitly forbids invented assignees and deadlines and tells the model to return `null` when optional information is absent. This reduces risk but does not prove factual correctness. In higher-risk applications, extracted values still need domain validation or human review.

### AI provider boundary

Only `AiTaskExtractorService` knows that task extraction uses `ChatClient`. `TaskAnalysisService` depends on an extracted Java value, not OpenAI response classes. Provider exceptions are wrapped in `AiProcessingException`, so provider details and secrets do not leak through the REST API.

### API key management

The OpenAI key comes from `OPENAI_API_KEY`. It is never stored in source code. `.env.example` contains placeholders, while `.env` and `.env.*` are ignored by Git.

### Persistence of AI output

Both the source text and structured fields are stored. That makes a result inspectable later and creates the foundation for future evaluation: you can compare what the user wrote with what the model extracted.

The AI call completes before `repository.save(...)` is invoked. If extraction fails or the structured response is malformed, no incomplete entity is saved.

### Deterministic backend vs probabilistic LLM

HTTP validation, entity mapping, pagination, schema migration, and error shapes are deterministic: the same inputs follow programmed rules. LLM extraction is probabilistic: outputs can vary with model, prompt, and provider behavior. Good AI Engineering puts a narrow typed boundary between those two worlds.

## Architecture

```text
Client
  |
  v
REST API (TaskAnalysisController)
  |
  v
TaskAnalysisService
  |
  +--> AiTaskExtractorService
  |      |
  |      v
  |    Spring AI ChatClient
  |      |
  |      v
  |    OpenAI
  |      |
  |      v
  |    Structured ExtractedTask
  |
  v
TaskAnalysisRepository
  |
  v
MySQL
```

## Request lifecycle

1. A client sends `POST /api/v1/task-analyses` with a natural-language `text` field.
2. Jakarta Bean Validation rejects null, blank, or overly long input.
3. `TaskAnalysisController` passes valid text to `TaskAnalysisService`.
4. `TaskAnalysisService` asks `AiTaskExtractorService` to extract a task.
5. `TaskExtractionPrompt` supplies rules plus the current date, time, and configured zone so relative dates can be resolved.
6. `ChatClient` sends the system and user messages to OpenAI with a schema derived from `ExtractedTask`.
7. Spring AI validates and maps the result into the Java record.
8. Required semantic fields such as `title` and `description` receive a final application-level check.
9. Only after successful extraction, the original text and structured values are saved in MySQL.
10. The saved entity is mapped to `TaskAnalysisResponse` and returned with HTTP `201 Created`.

If steps 6–8 fail, an AI error is returned and step 9 never happens.

## Project structure

```text
src/main/java/com/shokirjon/aitaskextractor/
├── AiTaskExtractorApplication.java
├── ai/
│   ├── config/AiConfiguration.java
│   └── prompt/TaskExtractionPrompt.java
├── common/
│   ├── config/WebConfig.java
│   └── exception/
│       ├── AiProcessingException.java
│       ├── ApiError.java
│       ├── GlobalExceptionHandler.java
│       ├── MalformedAiResponseException.java
│       └── ResourceNotFoundException.java
└── task/
    ├── controller/TaskAnalysisController.java
    ├── dto/
    │   ├── AnalyzeTaskRequest.java
    │   ├── ExtractedTask.java
    │   ├── PagedTaskAnalysisResponse.java
    │   └── TaskAnalysisResponse.java
    ├── entity/TaskAnalysisEntity.java
    ├── model/TaskPriority.java
    ├── repository/TaskAnalysisRepository.java
    └── service/
        ├── AiTaskExtractorService.java
        └── TaskAnalysisService.java
```

Important supporting files:

- `application.yml` — database, Flyway, Hibernate, model, and API-key configuration.
- `V1__create_task_analysis_table.sql` — versioned database schema.
- `docker-compose.yml` — optional local MySQL only.
- `.env.example` — configuration names with placeholder values.

The web client lives in `frontend/`:

```text
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .env.example
└── src/
    ├── api/
    ├── components/
    ├── styles/
    ├── types/
    ├── utils/
    ├── App.tsx
    └── main.tsx
```

## Web UI

The `frontend/` application uses React 19.3, strict TypeScript, Vite 8, the native browser `fetch` API, and modern CSS. It provides one focused page for:

- submitting natural-language task text;
- viewing the structured AI result;
- browsing paginated analysis history;
- loading a saved analysis through the detail endpoint;
- displaying validation, network, AI provider, and server errors safely.

During local development, Vite serves the frontend from `http://localhost:5173`, while Spring Boot serves the API from `http://localhost:8080`. These are different **origins** because their ports differ. Browsers normally block cross-origin requests unless the API explicitly allows them.

CORS (Cross-Origin Resource Sharing) is the backend policy that permits the frontend origin to call `/api/**`. `WebConfig` allows only configured origins, the `GET`, `POST`, and `OPTIONS` methods, and the headers this UI needs. Credentials are disabled because this project has no cookie-based authentication.

- `VITE_API_BASE_URL` tells the browser where the Spring Boot API is available.
- `APP_CORS_ALLOWED_ORIGINS` tells Spring Boot which frontend origins may call the API. It accepts comma-separated origins, for example `http://localhost:5173,http://192.168.1.10:5173`.

## Configuration

Copy the placeholders from `.env.example` into your preferred environment-variable setup. Spring Boot does not automatically import a plain `.env` file; your shell, IDE run configuration, or another environment loader must export the values.

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `OPENAI_API_KEY` | Yes | none | OpenAI credential; never commit it |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Chat model used for extraction |
| `APP_TIME_ZONE` | No | `Asia/Tashkent` | Zone used to resolve relative deadlines |
| `APP_CORS_ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated frontend origins allowed to call `/api/**` |
| `DB_HOST` | No | `localhost` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_NAME` | No | `ai_task_extractor` | Database name |
| `DB_USER` | No | `ai_task_user` | Database username |
| `DB_PASSWORD` | No | `change-me` | Database password |
| `DB_ROOT_PASSWORD` | Docker only | `change-root-me` | MySQL container root password |

`created_at` is represented as `Instant` and Hibernate is configured for UTC. `deadline` intentionally remains a `LocalDateTime`: it represents the local wall-clock time inferred using `APP_TIME_ZONE`. If this application later supports users in many zones, persist a zone or offset alongside the deadline.

Hibernate uses `ddl-auto: validate`; Flyway owns schema creation and evolution.

The frontend has its own `frontend/.env.example` containing only:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Vite exposes `VITE_*` values to browser code, so never put an OpenAI key or another secret in the frontend environment file.

## Local Development

These commands are for you to run manually. Prerequisites: Java 21, Maven, Docker, and a Node.js version supported by Vite 8 (`20.19+` or `22.12+`).

### 1. Configure local MySQL values

From the repository root, copy the backend environment example:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Replace the placeholder database passwords in `.env`. Docker Compose automatically reads this root `.env` file.

### 2. Start MySQL

```bash
docker compose up -d
```

This starts only MySQL. OpenAI is not part of Docker Compose.

### 3. Configure the backend terminal

Spring Boot does not automatically import the root `.env` file. Export the required values in the terminal where you will start Maven.

macOS/Linux:

```bash
export OPENAI_API_KEY="your-real-openai-api-key"
export DB_PASSWORD="the-same-DB_PASSWORD-used-in-.env"
export APP_TIME_ZONE="Asia/Tashkent"
export APP_CORS_ALLOWED_ORIGINS="http://localhost:5173"
```

Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your-real-openai-api-key"
$env:DB_PASSWORD="the-same-DB_PASSWORD-used-in-.env"
$env:APP_TIME_ZONE="Asia/Tashkent"
$env:APP_CORS_ALLOWED_ORIGINS="http://localhost:5173"
```

`OPENAI_MODEL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, and `DB_USER` already have local defaults. Export them too if your setup differs.

### 4. Start the backend

From the repository root:

```bash
mvn spring-boot:run
```

The API should use port `8080`. Flyway will apply the schema migration when the backend starts.

### 5. Configure the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
```

Windows PowerShell:

```powershell
cd frontend
Copy-Item .env.example .env
```

Keep `VITE_API_BASE_URL=http://localhost:8080` when the backend uses its default port.

### 6. Install frontend dependencies

```bash
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

### 8. Open the application

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Expected local architecture

```text
Browser
  |
  | http://localhost:5173
  v
React + Vite
  |
  | HTTP /api/v1/task-analyses
  v
Spring Boot :8080
  |
  +----> OpenAI
  |
  +----> MySQL :3306
```

No OpenAI model is placed in Docker. The Spring Boot application calls the configured external provider.

## REST API

### Analyze and save a task

```bash
curl --request POST 'http://localhost:8080/api/v1/task-analyses' \
  --header 'Content-Type: application/json' \
  --data '{
    "text": "Tomorrow at 14:00 check the production deployment with Hikmatullo. This is critical."
  }'
```

### Example response

The following is an **EXAMPLE**, not a hardcoded response. Exact extracted wording may vary by model and prompt.

```json
{
  "id": 1,
  "originalText": "Tomorrow at 14:00 check the production deployment with Hikmatullo. This is critical.",
  "task": {
    "title": "Check production deployment",
    "description": "Check the production deployment with Hikmatullo.",
    "priority": "CRITICAL",
    "assignee": "Hikmatullo",
    "deadline": "2026-09-23T14:00:00",
    "category": "DEVOPS"
  },
  "createdAt": "2026-09-22T18:30:00Z"
}
```

### Get one saved analysis

```bash
curl 'http://localhost:8080/api/v1/task-analyses/1'
```

### List saved analyses

```bash
curl 'http://localhost:8080/api/v1/task-analyses?page=0&size=20'
```

Results are ordered by `createdAt` descending. `page` is zero-based and `size` is limited to `1..100`.

### Error shape

```json
{
  "timestamp": "2026-09-22T18:30:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "text: text must not be blank",
  "path": "/api/v1/task-analyses"
}
```

Provider failures and malformed structured responses return a safe `502` response. Stack traces, API keys, and provider request bodies are not exposed.

## How structured output works

1. Spring AI inspects `ExtractedTask` and derives a JSON schema from its record components and enum.
2. `useProviderStructuredOutput()` sends that schema to OpenAI as an API-level response constraint instead of relying only on “please return JSON” prompt wording.
3. `validateSchema()` checks the response against the schema.
4. `.entity(ExtractedTask.class, ...)` converts the validated result into a Java record using Jackson.
5. Application-level validation rejects a null result or blank required semantic fields.

This is stronger than JSON mode alone. JSON mode only promises syntactically valid JSON; a schema also constrains expected property names and types.

## Things I should study in the code

Recommended order:

1. `AnalyzeTaskRequest` — deterministic input validation.
2. `TaskAnalysisController` — versioned REST endpoints and HTTP responses.
3. `TaskAnalysisService` — orchestration and the save-after-success flow.
4. `AiTaskExtractorService` — the AI provider boundary and typed `ChatClient` call.
5. `TaskExtractionPrompt` — system rules and dynamic date/time context.
6. `ExtractedTask` — the schema-producing Java contract.
7. `AiConfiguration` and `application.yml` — model client, clock, secrets, and model configuration.
8. `TaskAnalysisEntity` and `TaskAnalysisRepository` — mapping extracted output to persistence.
9. `V1__create_task_analysis_table.sql` — Flyway-owned schema.
10. `GlobalExceptionHandler` — safe failures across deterministic and AI paths.

## Experiments for me

These are intentionally **not implemented**. Add them one at a time as learning exercises:

1. Add `estimatedDurationMinutes` to the record, entity, migration, and response.
2. Add a confidence score and decide whether the model's self-reported confidence is trustworthy.
3. Test Uzbek task input and refine the prompt without translating in application code.
4. Test Korean task input and compare deadline extraction behavior.
5. Add a typed list of tags.
6. Compare two prompt versions against the same dataset.
7. Add a second LLM provider behind the existing AI boundary.
8. Add unit tests for deterministic mapping, validation, and error handling.
9. Create an evaluation dataset with 30 representative task texts and expected fields.
10. Measure extraction correctness field by field instead of only judging the whole object.
11. Store prompt/model metadata so old results can be traced to a configuration.
12. Add idempotency to prevent accidental duplicate submissions.
13. Later, expose selected database operations as AI tools and keep authorization in backend code.

## Future AI Engineering roadmap

This repository is **STEP 1**. Do not add all later concepts at once; each step introduces a different engineering problem.

```text
STEP 1  Structured Output             <-- current project
STEP 2  Prompt / Context Engineering
STEP 3  Embeddings
STEP 4  RAG
STEP 5  Tool Calling
STEP 6  Agent Loop
STEP 7  MCP
STEP 8  Evals / Observability
```

- **STEP 1 — Structured Output:** turn uncertain natural language into a narrow typed contract.
- **STEP 2 — Prompt / Context Engineering:** systematically control instructions, examples, context, and versions.
- **STEP 3 — Embeddings:** represent semantic similarity numerically.
- **STEP 4 — RAG:** retrieve relevant private knowledge and ground model answers in it.
- **STEP 5 — Tool Calling:** let the model request explicit backend capabilities with validated arguments.
- **STEP 6 — Agent Loop:** manage repeated model decisions, tool results, limits, and termination.
- **STEP 7 — MCP:** expose and consume tools/resources through a standard protocol.
- **STEP 8 — Evals / Observability:** measure quality, latency, cost, errors, and regressions.

The later steps are roadmap items only and are deliberately outside this repository's scope.
