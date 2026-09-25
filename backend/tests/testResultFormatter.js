const {
    formatScreeningResult
} = require("../src/screening/resultFormatter");


// --------------------------------------------------
// Mock company from CSV
// --------------------------------------------------

const company = {
    id: "TEST-001",
    website: "https://example.com"
};


// --------------------------------------------------
// Mock AI result
// --------------------------------------------------

const aiResult = {

    company:
        "Example Company",

    business_type:
        "Software Development Company",

    services: [
        "Web Development",
        "SaaS Solutions",
        "E-commerce Development"
    ],

    team_size:
        "50-100",

    evidence: [
        {
            source:
                "https://example.com/about",

            description:
                "The company provides software development services."
        }
    ],

    reason:
        "The company shows multiple growth and workflow signals.",

    confidence:
        "High"
};


// --------------------------------------------------
// Mock detected predefined triggers
// --------------------------------------------------

const detectedTriggers = [

    {
        name:
            "Hiring rapidly",

        category:
            "growth",

        score:
            8,

        evidence: [
            {
                source:
                    "https://example.com/careers",

                description:
                    "The company is hiring across multiple departments."
            }
        ]
    },

    {
        name:
            "Google Sheets",

        category:
            "workflow_tool",

        score:
            4,

        evidence: [
            {
                source:
                    "https://example.com/process",

                description:
                    "The operations team uses Google Sheets for tracking."
            }
        ]
    }
];


// --------------------------------------------------
// Mock additional triggers
// --------------------------------------------------

const additionalTriggers = [

    {
        name:
            "Increasing operational complexity",

        category:
            "growth",

        score:
            7,

        reason:
            "The company is expanding operationally.",

        evidence: [
            {
                source:
                    "https://example.com/news",

                description:
                    "The company announced expansion into additional operational areas."
            }
        ]
    }
];


// --------------------------------------------------
// Mock final company score
// --------------------------------------------------

const companyScore = 6.33;


// --------------------------------------------------
// Format result
// --------------------------------------------------

const formattedResult =
    formatScreeningResult(
        company,
        aiResult,
        detectedTriggers,
        additionalTriggers,
        companyScore
    );


// --------------------------------------------------
// Display formatted result
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "RESULT FORMATTER TEST"
);

console.log(
    "========================================\n"
);


console.log(
    JSON.stringify(
        formattedResult,
        null,
        2
    )
);


// --------------------------------------------------
// Automated checks
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "TEST RESULTS"
);

console.log(
    "========================================"
);


const tests = [];


// ID

tests.push({
    name:
        "ID should be preserved",

    passed:
        formattedResult.id ===
        "TEST-001"
});


// Website

tests.push({
    name:
        "Website should be preserved",

    passed:
        formattedResult.website ===
        "https://example.com"
});


// Company

tests.push({
    name:
        "Company name should be preserved",

    passed:
        formattedResult.company ===
        "Example Company"
});


// Business type

tests.push({
    name:
        "Business type should be preserved",

    passed:
        formattedResult.business_type ===
        "Software Development Company"
});


// Services

tests.push({
    name:
        "Services should be converted into CSV-friendly text",

    passed:
        formattedResult.services ===
        "Web Development, SaaS Solutions, E-commerce Development"
});


// Team size

tests.push({
    name:
        "Team size should be preserved",

    passed:
        formattedResult.team_size ===
        "50-100"
});


// Company score

tests.push({
    name:
        "Company score should be preserved",

    passed:
        formattedResult.company_score ===
        6.33
});


// Detected triggers

let parsedDetectedTriggers = [];

try {

    parsedDetectedTriggers =
        JSON.parse(
            formattedResult.detected_triggers
        );

} catch (error) {

    parsedDetectedTriggers = [];
}


tests.push({
    name:
        "Detected triggers should be valid JSON text",

    passed:
        Array.isArray(
            parsedDetectedTriggers
        )
});


tests.push({
    name:
        "Detected trigger count should be 2",

    passed:
        parsedDetectedTriggers.length === 2
});


// Additional triggers

let parsedAdditionalTriggers = [];

try {

    parsedAdditionalTriggers =
        JSON.parse(
            formattedResult.additional_triggers
        );

} catch (error) {

    parsedAdditionalTriggers = [];
}


tests.push({
    name:
        "Additional triggers should be valid JSON text",

    passed:
        Array.isArray(
            parsedAdditionalTriggers
        )
});


tests.push({
    name:
        "Additional trigger count should be 1",

    passed:
        parsedAdditionalTriggers.length === 1
});


// Evidence

let parsedEvidence = [];

try {

    parsedEvidence =
        JSON.parse(
            formattedResult.evidence
        );

} catch (error) {

    parsedEvidence = [];
}


tests.push({
    name:
        "Evidence should be valid JSON text",

    passed:
        Array.isArray(
            parsedEvidence
        )
});


tests.push({
    name:
        "Evidence count should be 1",

    passed:
        parsedEvidence.length === 1
});


// Reason

tests.push({
    name:
        "Reason should be preserved",

    passed:
        formattedResult.reason ===
        "The company shows multiple growth and workflow signals."
});


// Confidence

tests.push({
    name:
        "Confidence should be preserved",

    passed:
        formattedResult.confidence ===
        "High"
});


// --------------------------------------------------
// Display results
// --------------------------------------------------

let passedTests = 0;


for (const test of tests) {

    if (test.passed) {

        console.log(
            `PASS: ${test.name}`
        );

        passedTests++;

    } else {

        console.log(
            `FAIL: ${test.name}`
        );

    }
}


// --------------------------------------------------
// Final summary
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    `Passed: ${passedTests}/${tests.length}`
);

console.log(
    "========================================"
);


if (
    passedTests ===
    tests.length
) {

    console.log(
        "\nResult formatter test completed successfully."
    );

} else {

    console.log(
        "\nResult formatter test failed."
    );

    process.exitCode = 1;
}