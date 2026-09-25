const {
    validateScreeningResult
} = require("../src/validation/outputValidator");


// --------------------------------------------------
// Helper: run one validator test
// --------------------------------------------------

function runTest(
    testName,
    result,
    expectedValid
) {

    const validation =
        validateScreeningResult(
            result
        );


    const passed =
        validation.valid ===
        expectedValid;


    console.log(
        `${passed ? "PASS" : "FAIL"}: ${testName}`
    );


    if (!passed) {

        console.log(
            "Expected valid:",
            expectedValid
        );

        console.log(
            "Actual valid:",
            validation.valid
        );

        console.log(
            "Errors:",
            validation.errors
        );

    }


    return passed;
}


// --------------------------------------------------
// Base valid result
// --------------------------------------------------

const validResult = {

    website:
        "https://example.com",

    company:
        "Example Company",

    business_type:
        "Software Company",

    services: [
        "Web Development",
        "SaaS"
    ],

    team_size:
        "50-100",

    detected_triggers: [
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
                        "The company is hiring across multiple teams."
                }
            ]
        }
    ],

    additional_triggers: [
        {
            name:
                "Increasing operational complexity",

            category:
                "growth",

            score:
                7,

            reason:
                "The company is expanding operations across several areas.",

            evidence: [
                {
                    source:
                        "https://example.com/news",

                    description:
                        "The company announced expansion across multiple operational areas."
                }
            ]
        }
    ],

    evidence: [
        {
            source:
                "https://example.com/careers",

            description:
                "The company shows significant hiring activity."
        }
    ],

    reason:
        "The company shows multiple evidence-based growth signals.",

    confidence:
        "High"
};


// --------------------------------------------------
// Tests
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "OUTPUT VALIDATOR TEST"
);

console.log(
    "========================================\n"
);


const tests = [];


// --------------------------------------------------
// Test 1: Valid result
// --------------------------------------------------

tests.push(
    runTest(
        "Valid screening result should pass",
        validResult,
        true
    )
);


// --------------------------------------------------
// Test 2: Missing required field
// --------------------------------------------------

const missingCompany = {
    ...validResult
};

delete missingCompany.company;


tests.push(
    runTest(
        "Missing company field should fail",
        missingCompany,
        false
    )
);


// --------------------------------------------------
// Test 3: Invalid confidence
// --------------------------------------------------

const invalidConfidence = {
    ...validResult,
    confidence: "Very High"
};


tests.push(
    runTest(
        "Invalid confidence should fail",
        invalidConfidence,
        false
    )
);


// --------------------------------------------------
// Test 4: Invalid predefined trigger category
// --------------------------------------------------

const invalidCategory = {
    ...validResult,

    detected_triggers: [
        {
            ...validResult.detected_triggers[0],
            category: "marketing"
        }
    ]
};


tests.push(
    runTest(
        "Invalid detected trigger category should fail",
        invalidCategory,
        false
    )
);


// --------------------------------------------------
// Test 5: Invalid predefined trigger score
// --------------------------------------------------

const invalidDetectedScore = {
    ...validResult,

    detected_triggers: [
        {
            ...validResult.detected_triggers[0],
            score: 15
        }
    ]
};


tests.push(
    runTest(
        "Detected trigger score above 10 should fail",
        invalidDetectedScore,
        false
    )
);


// --------------------------------------------------
// Test 6: Detected trigger without evidence
// --------------------------------------------------

const missingDetectedEvidence = {
    ...validResult,

    detected_triggers: [
        {
            ...validResult.detected_triggers[0],
            evidence: []
        }
    ]
};


tests.push(
    runTest(
        "Detected trigger without evidence should fail",
        missingDetectedEvidence,
        false
    )
);


// --------------------------------------------------
// Test 7: Additional trigger without reason
// --------------------------------------------------

const missingAdditionalReason = {
    ...validResult,

    additional_triggers: [
        {
            ...validResult.additional_triggers[0],
            reason: ""
        }
    ]
};


tests.push(
    runTest(
        "Additional trigger without reason should fail",
        missingAdditionalReason,
        false
    )
);


// --------------------------------------------------
// Test 8: Additional trigger invalid score
// --------------------------------------------------

const invalidAdditionalScore = {
    ...validResult,

    additional_triggers: [
        {
            ...validResult.additional_triggers[0],
            score: -1
        }
    ]
};


tests.push(
    runTest(
        "Additional trigger score below 0 should fail",
        invalidAdditionalScore,
        false
    )
);


// --------------------------------------------------
// Test 9: Invalid evidence source
// --------------------------------------------------

const invalidEvidenceSource = {
    ...validResult,

    detected_triggers: [
        {
            ...validResult.detected_triggers[0],

            evidence: [
                {
                    source: "",
                    description:
                        "Evidence exists but source is empty."
                }
            ]
        }
    ]
};


tests.push(
    runTest(
        "Evidence with empty source should fail",
        invalidEvidenceSource,
        false
    )
);


// --------------------------------------------------
// Test 10: Invalid evidence description
// --------------------------------------------------

const invalidEvidenceDescription = {
    ...validResult,

    detected_triggers: [
        {
            ...validResult.detected_triggers[0],

            evidence: [
                {
                    source:
                        "https://example.com",

                    description:
                        ""
                }
            ]
        }
    ]
};


tests.push(
    runTest(
        "Evidence with empty description should fail",
        invalidEvidenceDescription,
        false
    )
);


// --------------------------------------------------
// Test 11: Duplicate detected trigger
// --------------------------------------------------

const duplicateDetectedTrigger = {
    ...validResult,

    detected_triggers: [
        validResult.detected_triggers[0],

        {
            ...validResult.detected_triggers[0]
        }
    ]
};


tests.push(
    runTest(
        "Duplicate detected trigger should fail",
        duplicateDetectedTrigger,
        false
    )
);


// --------------------------------------------------
// Test 12: Duplicate additional trigger
// --------------------------------------------------

const duplicateAdditionalTrigger = {
    ...validResult,

    additional_triggers: [
        validResult.additional_triggers[0],

        {
            ...validResult.additional_triggers[0]
        }
    ]
};


tests.push(
    runTest(
        "Duplicate additional trigger should fail",
        duplicateAdditionalTrigger,
        false
    )
);


// --------------------------------------------------
// Test 13: Forbidden AI company score
// --------------------------------------------------

const forbiddenCompanyScore = {
    ...validResult,
    company_score: 8.5
};


tests.push(
    runTest(
        "AI company_score field should fail",
        forbiddenCompanyScore,
        false
    )
);


// --------------------------------------------------
// Test 14: Services must be array
// --------------------------------------------------

const invalidServices = {
    ...validResult,
    services: "Web Development"
};


tests.push(
    runTest(
        "Services as string should fail",
        invalidServices,
        false
    )
);


// --------------------------------------------------
// Test 15: Empty service should fail
// --------------------------------------------------

const emptyService = {
    ...validResult,
    services: [
        "Web Development",
        ""
    ]
};


tests.push(
    runTest(
        "Empty service item should fail",
        emptyService,
        false
    )
);


// --------------------------------------------------
// Test 16: Empty top-level evidence is allowed
// --------------------------------------------------

const emptyTopLevelEvidence = {
    ...validResult,
    evidence: []
};


tests.push(
    runTest(
        "Empty top-level evidence should still be valid",
        emptyTopLevelEvidence,
        true
    )
);


// --------------------------------------------------
// Final summary
// --------------------------------------------------

const passedCount =
    tests.filter(Boolean).length;


console.log(
    "\n========================================"
);

console.log(
    `Passed: ${passedCount}/${tests.length}`
);

console.log(
    "========================================"
);


if (
    passedCount ===
    tests.length
) {

    console.log(
        "\nOutput validator test completed successfully."
    );

} else {

    console.log(
        "\nOutput validator test failed."
    );

    process.exitCode = 1;
}