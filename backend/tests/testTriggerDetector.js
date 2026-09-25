const {
    detectTriggers,
    detectAdditionalTriggers
} = require("../src/screening/triggerDetector");


// --------------------------------------------------
// Mock trigger configuration
// --------------------------------------------------

const triggers = {

    growth_triggers: [
        {
            name: "Hiring rapidly",
            score: 8
        },
        {
            name: "Opening new locations",
            score: 8
        }
    ],


    pain_point_triggers: [
        {
            name: "Missed deadlines",
            score: 10
        },
        {
            name: "Project delays",
            score: 9
        }
    ],


    workflow_tool_triggers: [
        {
            name: "Slack",
            score: 3
        },
        {
            name: "Google Sheets",
            score: 4
        }
    ]
};


// --------------------------------------------------
// Mock AI response
// --------------------------------------------------

const aiResult = {

    detected_triggers: [

        {
            name: "Hiring rapidly",
            category: "growth",
            score: 2,
            evidence: [
                {
                    source: "https://example.com/careers",
                    description:
                        "The company is recruiting for multiple positions."
                }
            ]
        },


        {
            name: "PROJECT DELAYS",
            category: "pain_point",
            score: 1,
            evidence: [
                {
                    source: "https://example.com/blog",
                    description:
                        "The company discusses delays affecting project delivery."
                }
            ]
        },


        {
            name: "Google-Sheets",
            category: "workflow_tool",
            score: 10,
            evidence: [
                {
                    source: "https://example.com/tools",
                    description:
                        "Google Sheets is used for operational tracking."
                }
            ]
        },


        {
            name: "Hiring rapidly",
            category: "growth",
            score: 10,
            evidence: [
                {
                    source: "https://example.com/jobs",
                    description:
                        "Several additional technical roles are open."
                }
            ]
        },


        {
            name: "Unknown configured trigger",
            category: "growth",
            score: 9,
            evidence: []
        }
    ],


    additional_triggers: [

        {
            name: "Increasing operational complexity",
            category: "growth",
            score: 7,
            reason:
                "The organization is expanding operations across multiple areas.",
            evidence: [
                {
                    source: "https://example.com/news",
                    description:
                        "The company describes increasing operational complexity."
                }
            ]
        },


        {
            name: "Cross-team coordination difficulty",
            category: "pain point",
            score: 8,
            reason:
                "Multiple teams are experiencing coordination difficulties.",
            evidence: [
                {
                    source: "https://example.com/blog",
                    description:
                        "Cross-team coordination has become more difficult."
                }
            ]
        },


        {
            name: "Complex manual workflow",
            category: "workflow-tool",
            score: 15,
            reason:
                "The organization relies on a complex manual workflow.",
            evidence: [
                {
                    source: "https://example.com/process",
                    description:
                        "Several operational steps are completed manually."
                }
            ]
        },


        {
            name: "Slack",
            category: "workflow_tool",
            score: 9,
            reason:
                "Slack is used internally.",
            evidence: [
                {
                    source: "https://example.com",
                    description:
                        "Slack is listed as a communication platform."
                }
            ]
        },


        {
            name: "Increasing operational complexity",
            category: "growth",
            score: 8,
            reason:
                "The company's expanding operations are increasing coordination and operational complexity.",
            evidence: [
                {
                    source: "https://example.com/about",
                    description:
                        "Operations now span multiple business functions."
                }
            ]
        }
    ]
};


// --------------------------------------------------
// Run predefined trigger detection
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "TESTING PREDEFINED TRIGGERS"
);

console.log(
    "========================================"
);


const detectedTriggers =
    detectTriggers(
        aiResult,
        triggers
    );


console.log(
    JSON.stringify(
        detectedTriggers,
        null,
        2
    )
);


// --------------------------------------------------
// Run additional trigger detection
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "TESTING ADDITIONAL TRIGGERS"
);

console.log(
    "========================================"
);


const additionalTriggers =
    detectAdditionalTriggers(
        aiResult,
        triggers
    );


console.log(
    JSON.stringify(
        additionalTriggers,
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


// Predefined trigger count

tests.push({
    name:
        "Predefined trigger count should be 3",

    passed:
        detectedTriggers.length === 3
});


// Hiring rapidly should use configured score 8

const hiringTrigger =
    detectedTriggers.find(
        (trigger) =>
            trigger.name ===
            "Hiring rapidly"
    );


tests.push({
    name:
        "Hiring rapidly should use configured score 8",

    passed:
        hiringTrigger?.score === 8
});


// Duplicate evidence should merge

tests.push({
    name:
        "Duplicate Hiring rapidly evidence should merge",

    passed:
        hiringTrigger?.evidence?.length === 2
});


// Project delays should match despite capitalization

const projectDelayTrigger =
    detectedTriggers.find(
        (trigger) =>
            trigger.name ===
            "Project delays"
    );


tests.push({
    name:
        "PROJECT DELAYS should match Project delays",

    passed:
        projectDelayTrigger?.score === 9
});


// Google-Sheets should match Google Sheets

const googleSheetsTrigger =
    detectedTriggers.find(
        (trigger) =>
            trigger.name ===
            "Google Sheets"
    );


tests.push({
    name:
        "Google-Sheets should match Google Sheets",

    passed:
        googleSheetsTrigger?.score === 4
});


// Additional trigger count

tests.push({
    name:
        "Additional trigger count should be 3",

    passed:
        additionalTriggers.length === 3
});


// Category normalization

const coordinationTrigger =
    additionalTriggers.find(
        (trigger) =>
            trigger.name ===
            "Cross-team coordination difficulty"
    );


tests.push({
    name:
        "pain point should normalize to pain_point",

    passed:
        coordinationTrigger?.category ===
        "pain_point"
});


// Score clamping

const manualWorkflowTrigger =
    additionalTriggers.find(
        (trigger) =>
            trigger.name ===
            "Complex manual workflow"
    );


tests.push({
    name:
        "Additional trigger score 15 should become 10",

    passed:
        manualWorkflowTrigger?.score === 10
});


// Configured Slack trigger must not appear as additional

const slackAdditional =
    additionalTriggers.find(
        (trigger) =>
            trigger.name ===
            "Slack"
    );


tests.push({
    name:
        "Configured Slack trigger should not appear as additional",

    passed:
        slackAdditional === undefined
});


// Duplicate additional trigger should merge

const complexityTrigger =
    additionalTriggers.find(
        (trigger) =>
            trigger.name ===
            "Increasing operational complexity"
    );


tests.push({
    name:
        "Duplicate additional trigger should merge evidence",

    passed:
        complexityTrigger?.evidence?.length === 2
});


// Duplicate additional trigger should keep stronger score

tests.push({
    name:
        "Duplicate additional trigger should keep higher score",

    passed:
        complexityTrigger?.score === 8
});


// --------------------------------------------------
// Display tests
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
        "\nTrigger detector test completed successfully."
    );

} else {

    console.log(
        "\nTrigger detector test failed."
    );

    process.exitCode = 1;
}