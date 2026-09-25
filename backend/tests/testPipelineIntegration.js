const { loadConfig } = require("../src/configLoader");

const {
    createResearchPrompt
} = require("../src/screening/researcher");

const {
    getMockAIResponse
} = require("../src/ai/mockAIResponse");

const {
    validateScreeningResult
} = require("../src/validation/outputValidator");

const {
    detectTriggers,
    detectAdditionalTriggers
} = require("../src/screening/triggerDetector");

const {
    calculateCompanyScore
} = require("../src/screening/scoreCalculator");

const {
    formatScreeningResult
} = require("../src/screening/resultFormatter");


// --------------------------------------------------
// Test helper
// --------------------------------------------------

function runTest(
    name,
    condition
) {

    const passed =
        Boolean(
            condition
        );


    console.log(
        `${passed ? "PASS" : "FAIL"}: ${name}`
    );


    return passed;
}


// --------------------------------------------------
// Main test
// --------------------------------------------------

function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "PIPELINE INTEGRATION TEST"
    );

    console.log(
        "========================================\n"
    );


    // --------------------------------------------------
    // Load configuration
    // --------------------------------------------------

    const config =
        loadConfig();


    // --------------------------------------------------
    // Mock company
    // --------------------------------------------------

    const company = {

        id:
            "TEST-001",

        website:
            "https://example.com"
    };


    // --------------------------------------------------
    // Mock website research
    // --------------------------------------------------

    const researchText = `
==================================================
SOURCE TYPE: homepage
SOURCE URL: https://example.com
==================================================

Example Company provides software development
and digital services for growing businesses.

==================================================
SOURCE TYPE: careers
SOURCE URL: https://example.com/careers
==================================================

The company is actively hiring across several
departments and expanding its team.

==================================================
SOURCE TYPE: operations
SOURCE URL: https://example.com/operations
==================================================

The company manages many projects and uses Slack
for internal communication.
`;


    // --------------------------------------------------
    // Step 1: Create screening prompt
    // --------------------------------------------------

    const prompt =
        createResearchPrompt(
            company,
            config.screeningPrompt,
            config.triggers,
            researchText
        );


    console.log(
        "PASS: Research prompt created"
    );


    // --------------------------------------------------
    // Step 2: Create mock AI response
    // --------------------------------------------------

    const aiResult =
        getMockAIResponse(
            company
        );


    console.log(
        "PASS: Mock AI result created"
    );


    // --------------------------------------------------
    // Step 3: Validate mock AI result
    // --------------------------------------------------

    const validation =
        validateScreeningResult(
            aiResult
        );


    console.log(
        validation.valid
            ? "PASS: AI result validation passed"
            : "FAIL: AI result validation failed"
    );


    // --------------------------------------------------
    // Step 4: Detect predefined triggers
    // --------------------------------------------------

    const detectedTriggers =
        detectTriggers(
            aiResult,
            config.triggers
        );


    console.log(
        `PASS: Predefined triggers detected (${detectedTriggers.length})`
    );


    // --------------------------------------------------
    // Step 5: Detect additional triggers
    // --------------------------------------------------

    const additionalTriggers =
        detectAdditionalTriggers(
            aiResult,
            config.triggers
        );


    console.log(
        `PASS: Additional triggers detected (${additionalTriggers.length})`
    );


    // --------------------------------------------------
    // Step 6: Calculate company score
    // --------------------------------------------------

    const companyScore =
        calculateCompanyScore(
            detectedTriggers,
            additionalTriggers
        );


    console.log(
        `PASS: Company score calculated (${companyScore})`
    );


    // --------------------------------------------------
    // Step 7: Format final result
    // --------------------------------------------------

    const formattedResult =
        formatScreeningResult(
            company,
            aiResult,
            detectedTriggers,
            additionalTriggers,
            companyScore
        );


    console.log(
        "PASS: Final result formatted"
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


    tests.push(
        runTest(
            "Prompt should include company website",

            prompt.includes(
                "https://example.com"
            )
        )
    );


    tests.push(
        runTest(
            "Prompt should include configured triggers",

            prompt.includes(
                "Hiring rapidly"
            )
        )
    );


    tests.push(
        runTest(
            "Validation should pass",

            validation.valid ===
            true
        )
    );


    tests.push(
        runTest(
            "Should detect 3 predefined triggers",

            detectedTriggers.length ===
            3
        )
    );


    tests.push(
        runTest(
            "Should detect 1 additional trigger",

            additionalTriggers.length ===
            1
        )
    );


    tests.push(
        runTest(
            "Final score should be 6.5",

            companyScore ===
            6.5
        )
    );


    tests.push(
        runTest(
            "Formatted result should preserve company score",

            formattedResult.company_score ===
            6.5
        )
    );


    tests.push(
        runTest(
            "Formatted result should preserve website",

            formattedResult.website ===
            "https://example.com"
        )
    );


    tests.push(
        runTest(
            "Formatted result should preserve company name",

            formattedResult.company ===
            aiResult.company
        )
    );


    let parsedDetectedTriggers =
        null;


    try {

        parsedDetectedTriggers =
            JSON.parse(
                formattedResult.detected_triggers
            );

    } catch (error) {

        parsedDetectedTriggers =
            null;
    }


    tests.push(
        runTest(
            "Formatted detected triggers should be valid JSON",

            Array.isArray(
                parsedDetectedTriggers
            )
        )
    );


    let parsedAdditionalTriggers =
        null;


    try {

        parsedAdditionalTriggers =
            JSON.parse(
                formattedResult.additional_triggers
            );

    } catch (error) {

        parsedAdditionalTriggers =
            null;
    }


    tests.push(
        runTest(
            "Formatted additional triggers should be valid JSON",

            Array.isArray(
                parsedAdditionalTriggers
            )
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
            "\nPipeline integration test completed successfully."
        );

    } else {

        console.log(
            "\nPipeline integration test failed."
        );

        process.exitCode =
            1;
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();