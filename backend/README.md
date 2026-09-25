AI Website Screening Agent — V1

Overview

The AI Website Screening Agent is a Node.js application that reads company websites from a CSV file, researches each company’s public website, analyzes the collected information using an AI provider, detects relevant business triggers, calculates a final company score, and exports the results to a human-readable CSV file.

V1 keeps business rules configurable. Trigger definitions, trigger scores, screening instructions, research settings, and output structure are stored separately from the main application logic.

Core Features

CSV company input

CSV validation and URL normalization

Configurable website research

Homepage and internal-page research

Configurable predefined triggers and scores

Additional AI-discovered triggers

Evidence-based screening

Grok as the current tested V1 provider

Optional Gemini provider support

AI response parsing and validation

Backend score calculation

Human-readable CSV output

Partial-batch preservation

Individual company failure handling

Retry and quota handling

Stale-output protection

Local regression tests

Live website-research test

Live Grok connection test

Workflow

Input CSV
    ↓
Load Configuration
    ↓
Clear Previous Output
    ↓
Validate Website
    ↓
Research Homepage
    ↓
Discover Useful Internal Pages
    ↓
Research Selected Pages
    ↓
Create Screening Prompt
    ↓
Send Research to AI
    ↓
Parse AI JSON
    ↓
Validate AI Response
    ↓
Detect Predefined Triggers
    ↓
Detect Additional Triggers
    ↓
Calculate Final Company Score
    ↓
Format Result
    ↓
Write Human-Readable CSV

Project Structure

AI-Website-Screening-Agent/
├── config/
│   ├── triggers.json
│   ├── screening-prompt.md
│   ├── output-schema.json
│   └── research.json
├── input/
│   └── companies.csv
├── output/
│   └── screened-companies.csv
├── src/
│   ├── index.js
│   ├── csvReader.js
│   ├── csvWriter.js
│   ├── configLoader.js
│   ├── ai/
│   │   ├── grokClient.js
│   │   └── mockAIResponse.js
│   ├── research/
│   │   └── webResearcher.js
│   ├── screening/
│   │   ├── researcher.js
│   │   ├── triggerDetector.js
│   │   ├── scoreCalculator.js
│   │   └── resultFormatter.js
│   └── validation/
│       └── outputValidator.js
├── tests/
│   ├── runLocalTests.js
│   ├── testTriggerDetector.js
│   ├── testResearcher.js
│   ├── testOutputValidator.js
│   ├── testScoreCalculator.js
│   ├── testResultFormatter.js
│   ├── testGrokClient.js
│   ├── testBatchQuotaHandling.js
│   ├── testCsvReader.js
│   ├── testCsvWriter.js
│   ├── testPipelineIntegration.js
│   ├── testWebResearcher.js
│   └── testLiveGrokConnection.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── PROJECT_STATUS.md

Installation

Requirements:

Node.js 18+

npm

Install dependencies:

npm install

Environment Configuration

Create a .env file in the project root.

AI_PROVIDER=grok

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash

GROK_API_KEY=your_grok_api_key_here
GROK_MODEL=grok-4.7

Never commit the real .env file or API credentials.

Input CSV

Default input file:

input/companies.csv

Example:

id,website
1,https://www.airtable.com
2,https://www.notion.so

The CSV reader validates rows before website research. Missing websites and unsupported protocols such as ftp:// are rejected. Domains without a protocol can be normalized to HTTPS.

Website Research

Website research is handled by:

src/research/webResearcher.js

The researcher fetches the homepage, discovers internal links, selects useful pages using configured priorities, researches those pages, and combines the collected text with source URLs.

Research behavior is configured in:

config/research.json

Some websites may block automated requests, return HTTP 403, require browser-side JavaScript, or time out. These failures are handled at company level so later companies can continue.

Trigger Configuration

Predefined triggers are stored in:

config/triggers.json

The main trigger categories are:

growth

pain point

workflow tool

Predefined trigger scores are configured before AI analysis and enforced by the backend.

Additional AI-discovered triggers are also supported. Their scores must remain between 0 and 10 and are validated by the backend.

Screening Prompt

AI instructions are stored in:

config/screening-prompt.md

The AI is instructed to use only supplied research, avoid unsupported assumptions, detect supported triggers, provide evidence, return structured JSON, and not calculate the final company score.

AI Provider

The current tested V1 provider is Grok:

AI_PROVIDER=grok
GROK_MODEL=grok-4.7

The shared AI client is:

src/ai/grokClient.js

It handles provider selection, model selection, API requests, retry behavior, rate-limit handling, quota-related failures, and AI JSON parsing.

Gemini remains available as an optional provider through environment configuration.

Validation

AI responses are validated by:

src/validation/outputValidator.js

Validation includes required fields, data types, trigger categories, trigger scores, evidence, confidence, duplicate triggers, and forbidden AI-generated final score fields.

Scoring

Scoring is handled by:

src/screening/scoreCalculator.js

Formula:

Final Company Score
=
Sum of all detected trigger scores
÷
Number of detected triggers

Both predefined and additional triggers contribute. If no triggers are detected, the final score is 0.

Output CSV

Default output file:

output/screened-companies.csv

Columns:

id
website
company
business_type
services
team_size
detected_triggers
additional_triggers
company_score
evidence
reason
confidence

The final CSV is designed for non-technical users and can be opened directly in Excel or Google Sheets.

Complex trigger and evidence fields are converted into readable text rather than raw JSON.

Example trigger:

Hiring rapidly - growth - 8/10

Stale-Output Protection

Before each run, the application removes the previous output/screened-companies.csv if it exists.

This prevents a previous successful result from being mistaken for the latest run. If a new batch produces zero successful results, no output CSV is created.

Failure Handling

Companies are processed independently.

A company may fail because of an HTTP error, HTTP 403, timeout, research failure, AI request failure, JSON parsing failure, or validation failure.

A normal company failure does not stop later companies. Successful results from the same batch are preserved.

Running the Application

npm start

or:

npm run dev

Normal workflow:

Add websites to input/companies.csv.

Run npm start.

Open output/screened-companies.csv in Excel or Google Sheets.

Testing

Run the local regression suite:

npm test

or:

npm run test:local

Latest verified result:

Total test files: 10
Passed: 10
Failed: 0

ALL LOCAL TESTS PASSED

Run the website-research test:

npm run test:web-research

Latest verified result:

Passed: 6/6
Web researcher test completed successfully.

Run the live Grok connection test:

npm run test:grok-live

Latest verified result:

Configured provider: grok
Configured model: grok-4.7

GROK CONNECTION TEST PASSED

Available test scripts:

npm run test:trigger-detector
npm run test:researcher
npm run test:validator
npm run test:score
npm run test:formatter
npm run test:ai-client
npm run test:quota
npm run test:csv-reader
npm run test:csv-writer
npm run test:pipeline
npm run test:web-research
npm run test:grok-live

Final V1 Verification

CSV Input                     PASS
CSV Validation                PASS
URL Normalization             PASS
Configuration Loading         PASS
Website Research              PASS
Internal-Link Discovery       PASS
Multi-page Research           PASS
Screening Prompt              PASS
Grok Integration              PASS
Live Grok Connection          PASS
JSON Parsing                  PASS
Output Validation             PASS
Trigger Detection             PASS
Additional Trigger Handling   PASS
Configured Score Enforcement  PASS
Score Calculation             PASS
Result Formatting             PASS
Readable CSV Output           PASS
Partial Batch Handling        PASS
Individual Failure Handling   PASS
Stale-Output Protection       PASS
Zero-Success Handling         PASS
Retry Handling                PASS
Quota Handling Tests          PASS
Security Configuration        PASS
Project Structure             PASS
Local Regression Suite        PASS
Website Research Test         PASS

Live screening was successfully verified with Airtable.

Partial-failure behavior was verified with Airtable, Canva, and Notion. Canva returned HTTP 403 while the other companies continued successfully.

Stale-output protection was verified by running a zero-success Canva batch and confirming that screened-companies.csv did not remain in the output folder.

Current V1 Limitations

Research is primarily limited to company-owned website pages.

JavaScript-heavy websites may not expose all content.

Bot-protected websites may return HTTP 403.

Some websites may time out.

Live AI requests consume provider quota or credit.

V1 has no graphical human-review interface.

Processing is sequential.

Future Improvements

Possible V2 improvements include external web search, browser-based research, LinkedIn research, job-board research, funding/news research, a human-review dashboard, editable trigger management, database storage, historical comparisons, caching, scheduled screening, logging, monitoring, CI/CD, deployment, queues, and controlled parallel processing.

Current Status

The AI Website Screening Agent V1 backend is implemented and has passed its main functional and integration verification stages.

Current workflow:

CSV Input
→ Website Research
→ AI Analysis
→ Validation
→ Trigger Detection
→ Score Calculation
→ Human-Readable CSV Output

Remaining finalization work:

finalize PROJECT_STATUS.md

perform one final clean regression run

prepare the final V1 testing report

prepare the project for manager handoff or submission