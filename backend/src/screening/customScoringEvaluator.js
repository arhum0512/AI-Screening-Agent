const {
    askAI,
    parseAIResponse
} = require("../ai/grokClient");

const {
    validateCustomScore
} = require("../validation/customResultValidator");


function createCustomScoringPrompt({
    company,
    researchText,
    scoringInstructions
}) {

    return `
Evaluate a user-defined company scoring rule using only the supplied research.

COMPANY WEBSITE
${company.website}

SCORING INSTRUCTIONS
${scoringInstructions.trim()}

RESEARCH DATA
${researchText}

RULES

- Follow the user's scoring rule exactly when supported by research.
- Return a numeric value from 0 to 10 only.
- For a binary rule, return exactly the applicable value, such as 10 or 0.
- Never invent facts or source URLs.
- Evidence URLs must come from the supplied source inventory.
- Keep source URLs and descriptions separate.
- Return only valid JSON without Markdown.

{
  "value": 0,
  "max": 10,
  "reason": "why the rule produced this score",
  "evidence": [
    {
      "source": "https://...",
      "description": "evidence used to apply the rule"
    }
  ]
}
`;
}


async function evaluateCustomScoring(
    options
) {

    const ask =
        options.askAI ||
        askAI;

    const parse =
        options.parseAIResponse ||
        parseAIResponse;

    const response =
        await ask(
            createCustomScoringPrompt(
                options
            )
        );

    const score =
        parse(
            response
        );

    const validation =
        validateCustomScore(
            score,
            "custom_score",
            options.allowedSourceUrls
        );

    if (!validation.valid) {

        throw new Error(
            `Custom scoring result validation failed: ${validation.errors.join("; ")}`
        );
    }

    return score;
}


module.exports = {
    createCustomScoringPrompt,
    evaluateCustomScoring
};
