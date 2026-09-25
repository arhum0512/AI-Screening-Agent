/*
 * Mock AI Response
 *
 * This file is used during development and testing.
 *
 * It allows us to test the screening pipeline without
 * sending requests to Gemini or Grok.
 *
 * Later, the real AI provider can be used again by
 * changing the application configuration.
 */

function getMockAIResponse(company, triggers) {
    /*
     * We use the company website from the CSV.
     */
    const website = company.website;

    /*
     * These are example triggers for testing.
     *
     * IMPORTANT:
     * The scores here are NOT trusted by the application
     * for predefined triggers.
     *
     * Our triggerDetector will replace these scores with
     * the scores configured in config/triggers.json.
     */
    const mockResponse = {
        website: website,

        company: "Mock Technology Company",

        business_type: "Software Development Company",

        services: [
            "Web Development",
            "Software Development",
            "SaaS Solutions"
        ],

        team_size: "50-100",

        detected_triggers: [
            {
                name: "Hiring rapidly",
                category: "growth",
                score: 8,
                evidence: [
                    {
                        source: website,
                        description:
                            "The company is expanding its development team and hiring for multiple technical positions."
                    }
                ]
            },

            {
                name: "Too many projects",
                category: "pain_point",
                score: 8,
                evidence: [
                    {
                        source: website,
                        description:
                            "The company reports managing multiple projects simultaneously across different clients."
                    }
                ]
            },

            {
                name: "Slack",
                category: "workflow_tool",
                score: 3,
                evidence: [
                    {
                        source: website,
                        description:
                            "Slack is listed as one of the communication tools used by the company."
                    }
                ]
            }
        ],

        additional_triggers: [
            {
                name: "Increasing client workload",
                category: "growth",
                score: 7,
                reason:
                    "The company is handling an increasing amount of client work, which indicates additional growth beyond the predefined triggers.",
                evidence: [
                    {
                        source: website,
                        description:
                            "The company indicates that its client workload is increasing."
                    }
                ]
            }
        ],

        evidence: [
            {
                source: website,
                description:
                    "Mock evidence created for development and pipeline testing."
            }
        ],

        reason:
            "Mock AI response created to test trigger detection, additional trigger handling, validation, and company scoring without using a live AI API.",

        confidence: "Medium"
    };

    return mockResponse;
}

module.exports = {
    getMockAIResponse
};