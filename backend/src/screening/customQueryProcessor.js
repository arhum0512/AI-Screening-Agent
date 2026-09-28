const {
    askAI,
    parseAIResponse
} = require("../ai/grokClient");

const {
    validateCustomQueryResult
} = require("../validation/customResultValidator");


function createCustomQueryPrompt({
    company,
    query,
    researchText,
    scoringInstructions = ""
}) {

    const scoringSection =
        scoringInstructions.trim()
            ? `
CUSTOM SCORING INSTRUCTIONS

${scoringInstructions.trim()}

Evaluate these instructions only from the supplied research. Return a numeric score from 0 to 10. Set score.max to 10. For binary rules, return exactly the applicable value. Include evidence used for the score.
`
            : `
SCORING

No custom scoring was requested. Return "score": null.
`;

    return `
You are answering a focused company-research query.

COMPANY WEBSITE
${company.website}

USER QUESTIONS OR INSTRUCTIONS
${query.trim()}

RESEARCH DATA
${researchText}

${scoringSection}

RULES

- Answer only the user's requested questions.
- Do not add team size, triggers, workflow tools, operational signals, or unrelated company facts unless explicitly requested.
- Use only the supplied research.
- Do not invent facts or URLs.
- Every evidence source must be an absolute HTTP(S) URL from the research source inventory.
- Keep source and description in separate fields.
- Use one answers item per requested question or distinct requested output.
- Keep answers concise and human-readable.
- For list questions, return a concise semicolon-separated list instead of a paragraph.
- For yes/no questions, begin with exactly Yes or No and keep supporting explanation in evidence.
- Return only valid JSON without Markdown or code fences.

RETURN EXACTLY THIS SHAPE

{
  "company": "string",
  "website": "https://...",
  "answers": [
    {
      "question": "requested question or concise requested field label",
      "answer": "focused answer",
      "evidence": [
        {
          "source": "https://...",
          "description": "specific supporting evidence"
        }
      ]
    }
  ],
  "score": null
}

When custom scoring instructions are present, replace null with:

{
  "value": 0,
  "max": 10,
  "reason": "why the scoring rule produced this value",
  "evidence": [
    {
      "source": "https://...",
      "description": "evidence used for scoring"
    }
  ]
}
`;
}


async function processCustomQuery(
    options
) {

    const ask =
        options.askAI ||
        askAI;

    const parse =
        options.parseAIResponse ||
        parseAIResponse;

    const prompt =
        createCustomQueryPrompt(
            options
        );

    const response =
        await ask(
            prompt
        );

    const result =
        parse(
            response
        );

    const validation =
        validateCustomQueryResult(
            result,
            {
                allowedSourceUrls:
                    options.allowedSourceUrls,
                requireScore:
                    Boolean(
                        options.scoringInstructions?.trim()
                    )
            }
        );

    if (!validation.valid) {

        throw new Error(
            `Custom query result validation failed: ${validation.errors.join("; ")}`
        );
    }

    return result;
}


module.exports = {
    createCustomQueryPrompt,
    processCustomQuery
};
