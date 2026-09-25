AI Website Screening Agent — Project Status

Current Version

V1

Overall Status

The V1 backend pipeline is implemented, organized, documented, regression-tested, and verified with live Grok API usage.

The project is now functionally complete for manager demonstration and technical handoff.

Completed Areas

Project setup

Node.js application structure

Environment configuration

.env.example

Safe .gitignore

Config loader

CSV input reader

CSV row validation

Website URL normalization

Invalid website handling

Website research

Homepage research

Internal-link discovery

Multi-page website research

Configurable page priorities

Configurable research settings

Research text limiting

Screening prompt generation

Configurable screening instructions

Grok live API integration

Gemini-compatible provider architecture

Provider switching through environment configuration

AI response parsing

Markdown code-fence removal

AI response validation

Predefined trigger detection

Additional trigger detection

Trigger-name normalization

Trigger category normalization

Configured trigger score enforcement

Additional trigger score validation

Duplicate trigger handling

Duplicate evidence merging

Evidence validation

Confidence validation

Forbidden AI score-field validation

Final company score calculation

Score rounding

Result formatting

CSV output writing
Human-readable CSV formatting
Readable trigger formatting
Readable evidence formatting
Stale-output protection
Zero-success output handling
User-facing CSV location instructions

Stable CSV headers

Empty output handling

Output-directory creation

AI retry handling

Temporary rate-limit handling

Exponential retry backoff

API-provided retry-delay handling

Daily quota handling logic

Partial batch preservation

Individual company failure handling

Local regression testing

Website research network test

Live Grok connection test

Real multi-company end-to-end Grok test

Test folder reorganization

npm test scripts

README documentation

Project status documentation

Current Project Structure

AI-Website-Screening-Agent/
│
├── config/
│   ├── triggers.json
│   ├── screening-prompt.md
│   ├── output-schema.json
│   └── research.json
│
├── input/
│   └── companies.csv
│
├── output/
│   └── screened-companies.csv
│
├── src/
│   ├── index.js
│   ├── csvReader.js
│   ├── csvWriter.js
│   ├── configLoader.js
│   │
│   ├── ai/
│   │   ├── grokClient.js
│   │   └── mockAIResponse.js
│   │
│   ├── research/
│   │   └── webResearcher.js
│   │
│   ├── screening/
│   │   ├── researcher.js
│   │   ├── triggerDetector.js
│   │   ├── scoreCalculator.js
│   │   └── resultFormatter.js
│   │
│   └── validation/
│       └── outputValidator.js
│
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
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── PROJECT_STATUS.md

Main Application Flow

Input CSV
↓
Load Configuration
↓
Clear Previous Output
↓
Validate Website
↓
Normalize Website URL
↓
Research Homepage
↓
Discover Internal Links
↓
Select Useful Pages
↓
Research Additional Pages
↓
Combine Research
↓
Generate Screening Prompt
↓
Send Prompt to AI Provider
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
Format Final Result
↓
Convert Complex Fields to Readable CSV Text
↓
Write Successful Results to CSV

AI Provider Status

Grok

Current status:

Provider selected                    ✅
API key accepted                     ✅
grok-4.7 accessible                  ✅
Live API request successful          ✅
Non-empty response returned          ✅
End-to-end screening verified        ✅
Multi-company batch verified         ✅

Current configuration:

AI_PROVIDER=grok
GROK_MODEL=grok-4.7

The live provider connection was verified with:

npm run test

Verified result:

GROK CONNECTION TEST PASSED

Gemini

The shared provider architecture also supports Gemini-compatible configuration.

Example:

AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.7-flash

The main screening pipeline does not need to be rebuilt when changing providers.

Website Research Status

Website research is implemented in:

src/research/webResearcher.js

Current capabilities include:

homepage fetching

redirect handling

response-size protection

request timeout handling

HTML text extraction

page title extraction

heading extraction

internal-link discovery

useful-page selection

configurable page priorities

multi-page research

research text combination

research text size limiting

source URL preservation

source-type preservation

Current verified research settings:

{
"request_timeout_ms": 30000,
"max_response_size_mb": 3,
"max_redirects": 5,
"max_research_text_length": 25000,
"max_additional_pages": 4
}

These values were verified successfully with the live website-research test and real company screening.

Trigger Categories

The current system supports:

growth
pain_point
workflow_tool

Predefined Trigger Scoring

Predefined trigger scores are configured before AI analysis.

Example:

{
"name": "Hiring rapidly",
"score": 8
}

The AI determines whether the supplied research supports the trigger.

The backend enforces the configured score.

Additional Trigger Scoring

Additional triggers can be identified by the AI when they are not already defined in the configured trigger list.

Each additional trigger contains:

name
category
score
reason
evidence

Allowed score range:

0–10

Additional-trigger scores are AI-generated and backend-validated.

Final Company Score

The final company score is calculated by Node.js, not the AI.

Current formula:

Final Company Score

Sum of all detected trigger scores
÷
Number of detected triggers

Both predefined and additional triggers contribute.

Example:

Hiring rapidly = 8
Project delays = 9
Missed deadlines = 10
Excel = 4

Total = 31
31 / 4 = 7.75

Final score:

7.75 / 10

If no triggers are detected:

0 / 10

Scores are rounded to two decimal places.

Current Output Fields

The final CSV contains:

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

Complex values such as triggers and evidence are converted into human-readable text when written to the final CSV. The internal pipeline can still retain structured values.

Confidence Values

Supported confidence values:

High
Medium
Low

Evidence Requirements

Evidence format:

{
"source": "https://company.com/page",
"description": "Evidence description"
}

Every accepted detected trigger must include supporting evidence.

The AI is instructed not to fabricate facts, URLs, or unsupported evidence.

Validation Status

AI response validation checks:

required top-level fields

field data types

services array

trigger categories

trigger scores

evidence

additional-trigger reasons

duplicate predefined triggers

duplicate additional triggers

confidence values

forbidden AI-generated score fields

Forbidden fields include:

company_score
final_company_score
overall_score
total_score
screening_score

Final scoring remains a backend responsibility.

Error Handling Status

The application handles company failures independently.

Examples include:

website request failure

invalid website

research error

AI request error

malformed AI JSON

invalid AI response

validation failure

Later companies can continue when appropriate.

Completed successful results are preserved.

Retry Handling Status

Temporary AI failures support retries.

Handled temporary status codes include:

408
429
500
502
503
504

Fallback retry delays use exponential backoff.

When the provider supplies a retry delay, the client attempts to respect it with a safety buffer.

Quota Handling Status

The shared AI client includes logic for distinguishing temporary rate limits from quota-exhaustion behavior where identifiable.

Completed company results are preserved if a later request causes the batch to stop.

This behavior is also covered by local tests.

Local Regression Test Status

Run:

npm test

or:

npm run test

Current verified result:

Total test files: 10
Passed: 10
Failed: 0

ALL LOCAL TESTS PASSED

These tests do not make live AI API requests.

Local Regression Test Coverage

The runner executes:

Trigger Detector

Research Prompt

Output Validator

Score Calculator

Result Formatter

AI Client Helpers

Batch Quota Handling

CSV Reader

CSV Writer

Pipeline Integration

Current verified individual results:

Trigger Detector             11/11 ✅
Research Prompt              10/10 ✅
Output Validator             16/16 ✅
Score Calculator              8/8  ✅
Result Formatter             15/15 ✅
AI Client Helpers            15/15 ✅
Batch Quota Handling         16/16 ✅
CSV Reader                   19/19 ✅
CSV Writer                   21/21 ✅
Pipeline Integration         11/11 ✅

Website Research Test

Run:

npm run test

This performs a real HTTP request but does not use an AI API request.

Current verified result:

Passed: 6/6

Web researcher test completed successfully.

Live Grok Test

Run:

npm run test

This performs a real Grok API request.

Current verified result:

GROK CONNECTION TEST PASSED

Verified:

Grok provider selected     ✅
API key accepted           ✅
Grok model accessible      ✅
API request completed      ✅
Non-empty response returned✅

Real Multi-Company End-to-End Test

The complete production pipeline was tested with:

id,website
1,https://www.shopify.com
2,https://www.atlassian.com
3,https://www.hubspot.com

All three companies completed successfully.

Verified results from that run:

Shopify    → 7.00 / 10
Atlassian  → 6.75 / 10
HubSpot    → 0.00 / 10

Pipeline stages verified:

Website research
→ Internal-page discovery
→ Prompt generation
→ Grok API request
→ JSON parsing
→ Output validation
→ Predefined trigger detection
→ Additional trigger detection
→ Backend scoring
→ Result formatting
→ CSV output

Batch result:

Successful results: 3
Total companies: 3

These scores reflect the website research available during that specific run and are not permanent company ratings.

npm Scripts Status

Current scripts include:

npm start
npm run dev
npm test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test
npm run test

Documentation Status

README.md

Updated ✅

The README now includes:

current architecture

current project structure

Grok live integration

research configuration

trigger logic

scoring

validation

output structure

retry handling

testing

live Grok verification

manager demo flow

limitations

future improvements

PROJECT_STATUS.md

Updated ✅

This document reflects the final verified V1 backend state.

Security and Configuration Status

.env ignored                 ✅
.env.example available       ✅
API keys outside source      ✅
node_modules ignored         ✅
Generated output separated   ✅

Real API keys should exist only in:

.env

They must not be committed to source control.

UTF-8 Output Verification

The CSV output contains valid UTF-8 text.

On Windows PowerShell, display it using:

Get-Content .\output\screened-companies.csv -Encoding UTF8

This was verified with Unicode text such as:

Gdańsk

The earlier incorrectly displayed text was caused by PowerShell's default decoding behavior, not by the website researcher or CSV content.

Current V1 Limitations

Website-Only Research

V1 mainly researches company-owned website pages.

It does not yet perform broad external research across:

LinkedIn

job boards

funding databases

external news platforms

review websites

social media

JavaScript-Heavy Websites

Some websites depend heavily on browser-side JavaScript.

The current HTTP researcher may not capture all dynamically rendered content.

Bot Protection

Some sites may restrict automated HTTP requests.

This can reduce available research and screening confidence.

API Cost and Quotas

Live AI usage consumes provider credit.

Large batches should consider:

budget controls

quota monitoring

batch sizing

retries

caching

No Human Review UI

V1 focuses on the backend.

It does not yet include a dedicated interface for:

manually adding triggers

removing triggers

editing scores

reviewing evidence visually

approving AI findings

Sequential Batch Processing

Companies are processed sequentially.

Future production versions could add:

queues

workers

controlled parallelism

distributed processing

Additional Trigger Scoring

Additional-trigger scores are currently AI-generated within the allowed range.

A future version could introduce deterministic backend rules for these scores.

V1 Architecture Principles

Configurable

Business rules remain outside application code where practical.

Evidence Based

Triggers require supporting evidence.

Provider Independent

The screening flow can support multiple AI providers.

Defensive

AI output is parsed and validated before scoring.

Resilient

Individual failures do not automatically stop the entire batch.

Quota Aware

The application avoids unnecessary requests when quota-related conditions are detected.

Testable

Core behavior can be tested without spending AI API credit.

Maintainable

Production code and tests are separated:

src/   → production code
tests/ → testing code

Explainable

Detected signals include evidence and reasoning.

V1 Completion Checklist

Project Setup                     ✅
Environment Configuration         ✅
Configuration Loading             ✅
CSV Input                         ✅
CSV Validation                    ✅
URL Normalization                 ✅
Website Research                  ✅
Internal Link Discovery           ✅
Multi-page Research               ✅
Screening Prompt                  ✅
Grok API Integration              ✅
Live Grok Connection              ✅
Provider Switching                ✅
JSON Parsing                      ✅
Output Validation                 ✅
Predefined Trigger Detection      ✅
Additional Trigger Detection      ✅
Score Enforcement                 ✅
Score Calculation                 ✅
Result Formatting                 ✅
CSV Output                        ✅
Error Handling                    ✅
Retry Handling                    ✅
Rate Limit Handling               ✅
Quota Handling                    ✅
Partial Batch Preservation        ✅
Test Reorganization               ✅
Regression Test Runner            ✅
npm Test Configuration            ✅
Local Regression Tests            ✅
Website Research Test             ✅
Live Grok Test                    ✅
Real Multi-company Grok Test      ✅
README Documentation              ✅
Project Status Documentation      ✅

Current Verified Status

CSV Input                     ✅
Configuration Loading         ✅
Website Research              ✅
Multi-page Research           ✅
Screening Prompt              ✅
Grok Integration              ✅
Live Grok Connection          ✅
Live Grok Screening           ✅
Provider Switching Layer      ✅
JSON Parsing                  ✅
Output Validation             ✅
Trigger Detection             ✅
Additional Triggers           ✅
Score Calculation             ✅
Result Formatting             ✅
CSV Output                    ✅
Retry Handling                ✅
Quota Handling                ✅
Partial Result Preservation   ✅
Local Tests                   ✅
Website Research Test         ✅
Manager Demo Batch            ✅
Documentation                 ✅

Final Acceptance Verification

The latest acceptance cycle also verified:

Airtable live screening               ✅
Readable user-facing CSV              ✅
Canva HTTP 403 handling               ✅
Figma timeout handling                ✅
Partial-success batch                 ✅
Stale-output clearing                 ✅
Zero-success no-output behavior       ✅
Invalid CSV input handling            ✅
Updated Grok-first .env.example       ✅
Final project structure               ✅

A final partial-failure batch used:

Airtable → success
Canva    → HTTP 403
Notion   → success

Result:

Successful results: 2
Total companies: 3

The resulting CSV contained only the successful companies.

A zero-success Canva-only run was then executed. The previous CSV was cleared and:

Test-Path .\output\screened-companies.csv

returned:

False

This confirms that stale results cannot be mistaken for the latest run.

Handoff Readiness

The V1 backend is ready for:

Manager demonstration ✅
Technical review       ✅
V1 handoff             ✅
Further V2 planning    ✅

The remaining work is no longer core V1 implementation. Final acceptance activities are limited to one final clean regression run, preparation of the final V1 testing report, and manager handoff/submission.

Any additional work should be driven by:

manager feedback

production deployment requirements

UI requirements

external research requirements

scale/performance requirements

V2 feature planning

Recommended Manager Demo Flow

Run:

npm test

Then:

npm run test

Optionally demonstrate the live Grok connection:

npm run test

Run the full application:

npm start

Then inspect:

output/screened-companies.csv

On PowerShell:

Get-Content .\output\screened-companies.csv -Encoding UTF8

This gives a complete demonstration of the current V1 backend from input through final structured output.