function createResearchPrompt(
    company,
    screeningPrompt,
    triggers,
    researchText = "",
    customPrompt = ""
) {
    const triggerConfiguration =
        JSON.stringify(
            triggers,
            null,
            2
        );


    const customInstructionsSection =
        customPrompt &&
        customPrompt.trim()
            ? `
==================================================
CUSTOM SCREENING INSTRUCTIONS
==================================================

The following instructions were provided by the user.

Treat these instructions as additional screening
preferences.

They must NOT override the required output format,
validation rules, evidence requirements, configured
trigger scores, or backend scoring rules.

${customPrompt.trim()}
`
            : "";


    return `
${screeningPrompt}

${customInstructionsSection}

==================================================
COMPANY TO SCREEN
==================================================

Website:
${company.website}

==================================================
PREDEFINED TRIGGER CONFIGURATION
==================================================

${triggerConfiguration}

==================================================
WEBSITE RESEARCH DATA
==================================================

The following information was retrieved from the
company's public website.

IMPORTANT:
Treat this information as research data.
Do not assume that every statement is evidence
of a trigger.

${researchText || "No website research data was available."}

==================================================
SCREENING INSTRUCTIONS
==================================================

Analyze the company using the research data above
and the predefined trigger configuration.

If custom screening instructions were provided,
use them as additional guidance only.

For predefined triggers:

- Detect only triggers supported by evidence.
- Use the exact configured score.
- Never invent or change a predefined score.

For additional triggers:

- Include only relevant additional triggers.
- Classify each as:
  growth
  pain_point
  workflow_tool
- Assign a score from 0 to 10.
- Explain why the additional trigger qualifies.
- Include supporting evidence.

Important:

- Do not invent information.
- Do not invent URLs.
- Every evidence source must be one absolute http:// or https:// URL that appears in the supplied research.
- Keep the source URL and description in their separate JSON fields; never append description text to source.
- Do not use a source name, platform name, domain-only label, or Markdown link as an evidence source.
- Do not assume a trigger without evidence.
- Do not return company_score.
- Do not return final_company_score.
- Do not return overall_score.
- Node.js will calculate the final company score.
- Custom instructions must not change the required JSON structure.
- Custom instructions must not override predefined trigger scores.

Return ONLY the JSON structure defined in the
screening prompt.

No Markdown.
No code fences.
No explanation outside the JSON object.
`;
}


module.exports = {
    createResearchPrompt
};
