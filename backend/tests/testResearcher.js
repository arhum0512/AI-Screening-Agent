const { loadConfig } = require("../src/configLoader");

const {
    createResearchPrompt
} = require("../src/screening/researcher");


// --------------------------------------------------
// Load project configuration
// --------------------------------------------------

const config =
    loadConfig();


// --------------------------------------------------
// Create mock company
// --------------------------------------------------

const company = {
    id: "TEST-001",
    website: "https://test-company.com"
};


// --------------------------------------------------
// Create mock website research
// --------------------------------------------------

const researchText = `
==================================================
SOURCE TYPE: careers
SOURCE URL: https://test-company.com/careers
==================================================

Test Company is expanding its engineering,
sales, and customer-success departments.

The company currently lists more than 30
open positions across multiple teams.


==================================================
SOURCE TYPE: news
SOURCE URL: https://test-company.com/news
==================================================

Test Company announced the opening of a new
office to support its growing customer base.


==================================================
SOURCE TYPE: blog
SOURCE URL: https://test-company.com/blog
==================================================

The operations team currently tracks several
internal processes using Google Sheets.
`;


// --------------------------------------------------
// Generate complete AI screening prompt
// --------------------------------------------------

const prompt =
    createResearchPrompt(
        company,
        config.screeningPrompt,
        config.triggers,
        researchText
    );


// --------------------------------------------------
// Display prompt information
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "SCREENING PROMPT TEST"
);

console.log(
    "========================================"
);


console.log(
    `Prompt length: ${prompt.length} characters`
);


// --------------------------------------------------
// Run checks
// --------------------------------------------------

const checks = [];


// New prompt loaded

checks.push({
    name:
        "Updated screening prompt is loaded",

    passed:
        prompt.includes(
            "systematically evaluate every configured trigger"
        )
});


// Company website included

checks.push({
    name:
        "Company website is included",

    passed:
        prompt.includes(
            "https://test-company.com"
        )
});


// Trigger configuration included

checks.push({
    name:
        "Growth trigger configuration is included",

    passed:
        prompt.includes(
            "Hiring rapidly"
        )
});


checks.push({
    name:
        "Pain-point trigger configuration is included",

    passed:
        prompt.includes(
            "Missed deadlines"
        )
});


checks.push({
    name:
        "Workflow trigger configuration is included",

    passed:
        prompt.includes(
            "Google Sheets"
        )
});


// Research included

checks.push({
    name:
        "Careers research is included",

    passed:
        prompt.includes(
            "more than 30"
        )
});


checks.push({
    name:
        "News research is included",

    passed:
        prompt.includes(
            "opening of a new"
        )
});


checks.push({
    name:
        "Workflow research is included",

    passed:
        prompt.includes(
            "tracks several"
        )
});


// Critical output instructions included

checks.push({
    name:
        "Final company score is prohibited",

    passed:
        prompt.includes(
            "DO NOT calculate or return a final company score"
        )
});


checks.push({
    name:
        "JSON-only output rule is included",

    passed:
        prompt.includes(
            "contain only JSON"
        )
});


// --------------------------------------------------
// Display check results
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


let passedChecks = 0;


for (const check of checks) {

    if (check.passed) {

        console.log(
            `PASS: ${check.name}`
        );

        passedChecks++;

    } else {

        console.log(
            `FAIL: ${check.name}`
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
    `Passed: ${passedChecks}/${checks.length}`
);

console.log(
    "========================================"
);


if (
    passedChecks ===
    checks.length
) {

    console.log(
        "\nResearch prompt test completed successfully."
    );

} else {

    console.log(
        "\nResearch prompt test failed."
    );

    process.exitCode = 1;
}


// --------------------------------------------------
// Optional preview
// --------------------------------------------------

console.log(
    "\n========================================"
);

console.log(
    "PROMPT PREVIEW"
);

console.log(
    "========================================"
);


const previewLength = 1500;


console.log(
    "\n--- PROMPT START ---\n"
);


console.log(
    prompt.substring(
        0,
        previewLength
    )
);


console.log(
    "\n--- PROMPT END ---\n"
);


console.log(
    prompt.substring(
        Math.max(
            0,
            prompt.length -
            previewLength
        )
    )
);