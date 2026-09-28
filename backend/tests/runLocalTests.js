const path = require("path");
const { spawnSync } = require("child_process");


// --------------------------------------------------
// Test files
// --------------------------------------------------

const tests = [

    {
        name:
            "Trigger Detector",

        file:
            "testTriggerDetector.js"
    },

    {
        name:
            "Research Prompt",

        file:
            "testResearcher.js"
    },

    {
        name:
            "Output Validator",

        file:
            "testOutputValidator.js"
    },

    {
        name:
            "Evidence Validation and CSV Formatting",

        file:
            "testEvidenceValidation.js"
    },

    {
        name:
            "Score Calculator",

        file:
            "testScoreCalculator.js"
    },

    {
        name:
            "Result Formatter",

        file:
            "testResultFormatter.js"
    },

    {
        name:
            "AI Client Helpers",

        file:
            "testGrokClient.js"
    },

    {
        name:
            "Batch Quota Handling",

        file:
            "testBatchQuotaHandling.js"
    },

    {
        name:
            "CSV Reader",

        file:
            "testCsvReader.js"
    },

    {
        name:
            "CSV Writer",

        file:
            "testCsvWriter.js"
    },

    {
        name:
            "Pipeline Integration",

        file:
            "testPipelineIntegration.js"
    },

    {
        name:
            "X Social Research",

        file:
            "testXSocialResearcher.js"
    },

    {
        name:
            "Multi-Source Research",

        file:
            "testMultiSourceResearcher.js"
    },

    {
        name:
            "Multi-Source Pipeline End-to-End",

        file:
            "testMultiSourcePipelineE2E.js"
    },

    {
        name:
            "Custom Query and Natural-Language Scoring",

        file:
            "testCustomModes.js"
    }
];


// --------------------------------------------------
// Run tests
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "LOCAL REGRESSION TEST SUITE"
);

console.log(
    "========================================"
);


console.log(
    `Tests to run: ${tests.length}`
);


let passedTests = 0;
let failedTests = 0;


// --------------------------------------------------
// Execute each test file
// --------------------------------------------------

tests.forEach(
    (
        test,
        index
    ) => {

        console.log(
            "\n========================================"
        );

        console.log(
            `Running test ${index + 1}/${tests.length}`
        );

        console.log(
            test.name
        );

        console.log(
            "========================================\n"
        );


        const testPath =
            path.join(
                __dirname,
                test.file
            );


        const result =
            spawnSync(
                process.execPath,
                [
                    testPath
                ],
                {
                    stdio:
                        "inherit"
                }
            );


        if (
            result.status ===
            0
        ) {

            console.log(
                `\nPASS: ${test.name}`
            );


            passedTests++;

        } else {

            console.log(
                `\nFAIL: ${test.name}`
            );


            failedTests++;
        }
    }
);


// --------------------------------------------------
// Final summary
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "LOCAL REGRESSION TEST SUMMARY"
);

console.log(
    "========================================"
);


console.log(
    `Total test files: ${tests.length}`
);


console.log(
    `Passed: ${passedTests}`
);


console.log(
    `Failed: ${failedTests}`
);


if (
    failedTests ===
    0
) {

    console.log(
        "\n========================================"
    );

    console.log(
        "ALL LOCAL TESTS PASSED"
    );

    console.log(
        "The non-AI-network application pipeline is stable."
    );

    console.log(
        "No AI API requests were used by this test suite."
    );

    console.log(
        "========================================"
    );

} else {

    console.log(
        "\n========================================"
    );

    console.log(
        "LOCAL TEST SUITE FAILED"
    );

    console.log(
        "Fix the failing tests before continuing."
    );

    console.log(
        "========================================"
    );


    process.exitCode =
        1;
}
