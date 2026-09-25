const {
    calculateCompanyScore
} = require("../src/screening/scoreCalculator");


// --------------------------------------------------
// Test helper
// --------------------------------------------------

function runTest(
    name,
    detectedTriggers,
    additionalTriggers,
    expectedScore
) {

    const actualScore =
        calculateCompanyScore(
            detectedTriggers,
            additionalTriggers
        );


    const passed =
        actualScore ===
        expectedScore;


    console.log(
        `${passed ? "PASS" : "FAIL"}: ${name}`
    );


    if (!passed) {

        console.log(
            `Expected: ${expectedScore}`
        );

        console.log(
            `Actual: ${actualScore}`
        );

    }


    return passed;
}


// --------------------------------------------------
// Tests
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "SCORE CALCULATOR TEST"
);

console.log(
    "========================================\n"
);


const tests = [];


// --------------------------------------------------
// Test 1
// No triggers
// --------------------------------------------------

tests.push(
    runTest(
        "No triggers should return 0",
        [],
        [],
        0
    )
);


// --------------------------------------------------
// Test 2
// One predefined trigger
// --------------------------------------------------

tests.push(
    runTest(
        "One predefined trigger should return its score",
        [
            {
                name:
                    "Hiring rapidly",

                score:
                    8
            }
        ],
        [],
        8
    )
);


// --------------------------------------------------
// Test 3
// Multiple predefined triggers
// --------------------------------------------------

tests.push(
    runTest(
        "Multiple predefined triggers should average correctly",
        [
            {
                name:
                    "Hiring rapidly",

                score:
                    8
            },
            {
                name:
                    "Project delays",

                score:
                    9
            },
            {
                name:
                    "Google Sheets",

                score:
                    4
            }
        ],
        [],
        7
    )
);


// --------------------------------------------------
// Test 4
// Manager scoring example
// --------------------------------------------------

tests.push(
    runTest(
        "Manager scoring example should return 7.75",
        [
            {
                name:
                    "Hiring rapidly",

                score:
                    8
            },
            {
                name:
                    "Project delays",

                score:
                    9
            },
            {
                name:
                    "Missed deadlines",

                score:
                    10
            }
        ],
        [
            {
                name:
                    "Excel",

                score:
                    4
            }
        ],
        7.75
    )
);


// --------------------------------------------------
// Test 5
// Additional triggers only
// --------------------------------------------------

tests.push(
    runTest(
        "Additional triggers only should average correctly",
        [],
        [
            {
                name:
                    "Increasing workload",

                score:
                    7
            },
            {
                name:
                    "Coordination difficulty",

                score:
                    8
            }
        ],
        7.5
    )
);


// --------------------------------------------------
// Test 6
// Decimal rounding
// --------------------------------------------------

tests.push(
    runTest(
        "Score should round to two decimal places",
        [
            {
                name:
                    "Trigger A",

                score:
                    8
            },
            {
                name:
                    "Trigger B",

                score:
                    7
            },
            {
                name:
                    "Trigger C",

                score:
                    7
            }
        ],
        [],
        7.33
    )
);


// --------------------------------------------------
// Test 7
// Maximum score
// --------------------------------------------------

tests.push(
    runTest(
        "Maximum trigger scores should return 10",
        [
            {
                name:
                    "Trigger A",

                score:
                    10
            }
        ],
        [
            {
                name:
                    "Trigger B",

                score:
                    10
            }
        ],
        10
    )
);


// --------------------------------------------------
// Test 8
// Mixed strong and weak triggers
// --------------------------------------------------

tests.push(
    runTest(
        "Mixed strong and weak triggers should average correctly",
        [
            {
                name:
                    "Missed deadlines",

                score:
                    10
            },
            {
                name:
                    "Slack",

                score:
                    3
            }
        ],
        [
            {
                name:
                    "Manual coordination",

                score:
                    4
            }
        ],
        5.67
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
        "\nScore calculator test completed successfully."
    );

} else {

    console.log(
        "\nScore calculator test failed."
    );

    process.exitCode = 1;
}