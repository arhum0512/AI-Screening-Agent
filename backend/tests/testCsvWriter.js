const fs = require("fs");
const path = require("path");

const {
    writeCompanies,
    writeFailedCompanies,
    ensureOutputDirectory,
    parseJsonArray,
    normalizeText,
    normalizeServices,
    formatCategory,
    getGrowthSignals,
    getOperationalSignals,
    collectEvidence,
    createVerticalCompanyRows,
    buildVerticalSummaryRows,
    buildFailedCompanyRows,
    buildTriggerRows,
    buildEvidenceRows,
    getOutputPaths
} = require("../src/csvWriter");


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
// Main test runner
// --------------------------------------------------

async function main() {

    console.log(
        "\n========================================"
    );

    console.log(
        "CSV WRITER TEST"
    );

    console.log(
        "========================================\n"
    );

    const tests = [];


    // --------------------------------------------------
    // Basic helper tests
    // --------------------------------------------------

    tests.push(
        runTest(
            "parseJsonArray should preserve arrays",

            parseJsonArray(
                [
                    {
                        name:
                            "Test"
                    }
                ]
            ).length === 1
        )
    );


    tests.push(
        runTest(
            "parseJsonArray should parse JSON array strings",

            parseJsonArray(
                '[{"name":"Test"}]'
            ).length === 1
        )
    );


    tests.push(
        runTest(
            "parseJsonArray should return empty array for invalid JSON",

            parseJsonArray(
                "invalid-json"
            ).length === 0
        )
    );


    tests.push(
        runTest(
            "normalizeText should preserve valid text",

            normalizeText(
                "Example Company"
            ) ===
            "Example Company"
        )
    );


    tests.push(
        runTest(
            "normalizeText should use fallback for missing value",

            normalizeText(
                null,
                "Unknown"
            ) ===
            "Unknown"
        )
    );


    tests.push(
        runTest(
            "normalizeServices should join service arrays",

            normalizeServices(
                [
                    "Web Development",
                    "Automation"
                ]
            ) ===
            "Web Development, Automation"
        )
    );


    tests.push(
        runTest(
            "formatCategory should convert workflow_tool to Workflow Tool",

            formatCategory(
                "workflow_tool"
            ) ===
            "Workflow Tool"
        )
    );


    // --------------------------------------------------
    // Successful test company
    // --------------------------------------------------

    const testCompany = {

        id:
            "1",

        website:
            "https://example.com",

        company:
            "Example Company",

        business_type:
            "Software Company",

        services:
            "Web Development, Automation",

        team_size:
            "50-100",

        company_score:
            7,

        confidence:
            "High",

        reason:
            "The company shows growth and workflow signals.",

        detected_triggers:
            JSON.stringify(
                [
                    {
                        name:
                            "Hiring rapidly",

                        category:
                            "growth",

                        score:
                            8,

                        evidence:
                            [
                                {
                                    source:
                                        "https://example.com/careers",

                                    description:
                                        "The company is hiring across multiple roles."
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

                        evidence:
                            [
                                {
                                    source:
                                        "https://example.com/process",

                                    description:
                                        "The company uses Google Sheets for tracking."
                                }
                            ]
                    }
                ]
            ),

        additional_triggers:
            JSON.stringify(
                [
                    {
                        name:
                            "Increasing operational complexity",

                        category:
                            "pain_point",

                        score:
                            9,

                        reason:
                            "The company has increasing operational complexity.",

                        evidence:
                            [
                                {
                                    source:
                                        "https://example.com/news",

                                    description:
                                        "Operations have expanded across multiple teams."
                                }
                            ]
                    }
                ]
            ),

        evidence:
            JSON.stringify(
                [
                    {
                        source:
                            "https://example.com/about",

                        description:
                            "The company develops software products for business customers."
                    }
                ]
            )
    };


    // --------------------------------------------------
    // Growth signal tests
    // --------------------------------------------------

    const growthSignals =
        getGrowthSignals(
            testCompany
        );


    tests.push(
        runTest(
            "Growth signals should include Hiring rapidly",

            growthSignals.includes(
                "Hiring rapidly"
            )
        )
    );


    tests.push(
        runTest(
            "Growth signals should include score",

            growthSignals.includes(
                "8/10"
            )
        )
    );


    // --------------------------------------------------
    // Operational signal tests
    // --------------------------------------------------

    const operationalSignals =
        getOperationalSignals(
            testCompany
        );


    tests.push(
        runTest(
            "Operational signals should include Google Sheets",

            operationalSignals.includes(
                "Google Sheets"
            )
        )
    );


    tests.push(
        runTest(
            "Operational signals should include additional pain-point trigger",

            operationalSignals.includes(
                "Increasing operational complexity"
            )
        )
    );


    // --------------------------------------------------
    // Evidence tests
    // --------------------------------------------------

    const evidence =
        collectEvidence(
            testCompany
        );


    tests.push(
        runTest(
            "Evidence should include trigger and general evidence",

            evidence.length ===
            4
        )
    );


    tests.push(
        runTest(
            "Evidence should include trigger source",

            evidence.some(
                (item) =>
                    item.source ===
                    "https://example.com/careers"
            )
        )
    );


    tests.push(
        runTest(
            "Evidence should include general company evidence",

            evidence.some(
                (item) =>
                    item.source ===
                    "https://example.com/about"
            )
        )
    );


    // --------------------------------------------------
    // Vertical successful-company output
    // --------------------------------------------------

    const verticalRows =
        createVerticalCompanyRows(
            testCompany
        );


    tests.push(
        runTest(
            "Vertical output should contain 11 required fields",

            verticalRows.length ===
            11
        )
    );


    tests.push(
        runTest(
            "First field should be Website",

            verticalRows[0][0] ===
            "Website = https://example.com"
        )
    );


    tests.push(
        runTest(
            "Output should contain Company = value",

            verticalRows.some(
                (row) =>
                    row[0] ===
                    "Company = Example Company"
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Score = value",

            verticalRows.some(
                (row) =>
                    row[0] ===
                    "Score = 7 / 10"
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Business Type",

            verticalRows.some(
                (row) =>
                    row[0].startsWith(
                        "Business Type = "
                    )
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Services",

            verticalRows.some(
                (row) =>
                    row[0].startsWith(
                        "Services = "
                    )
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Team Size",

            verticalRows.some(
                (row) =>
                    row[0] ===
                    "Team Size = 50-100"
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Growth Signals",

            verticalRows.some(
                (row) =>
                    row[0].startsWith(
                        "Growth Signals = "
                    )
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Operational Signals",

            verticalRows.some(
                (row) =>
                    row[0].startsWith(
                        "Operational Signals = "
                    )
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Evidence",

            verticalRows.some(
                (row) =>
                    row[0].startsWith(
                        "Evidence = "
                    )
            )
        )
    );


    tests.push(
        runTest(
            "Output should contain Reason",

            verticalRows.some(
                (row) =>
                    row[0].startsWith(
                        "Reason = "
                    )
            )
        )
    );


    tests.push(
        runTest(
            "Final field should be Confidence",

            verticalRows[
                verticalRows.length - 1
            ][0] ===
            "Confidence = High"
        )
    );


    // --------------------------------------------------
    // Multiple successful companies
    // --------------------------------------------------

    const secondCompany = {

        ...testCompany,

        id:
            "2",

        company:
            "Example Two",

        website:
            "https://example-two.com",

        company_score:
            5,

        confidence:
            "Medium",

        detected_triggers:
            "[]",

        additional_triggers:
            "[]",

        evidence:
            "[]"
    };


    const multipleRows =
        buildVerticalSummaryRows(
            [
                testCompany,
                secondCompany
            ]
        );


    tests.push(
        runTest(
            "Multiple companies should have blank separator row",

            multipleRows.some(
                (row) =>
                    row.length === 1 &&
                    row[0] === ""
            )
        )
    );


    // --------------------------------------------------
    // Failed-company row tests
    // --------------------------------------------------

    const failedCompanies = [
        {
            website:
                "https://www.monday.com",

            reason:
                "Website request timed out after 30 seconds."
        },

        {
            website:
                "https://blocked-example.com",

            reason:
                "Website returned HTTP 403"
        }
    ];


    const failedRows =
        buildFailedCompanyRows(
            failedCompanies
        );


    tests.push(
        runTest(
            "Failed output should contain Monday.com website",

            failedRows.some(
                (row) =>
                    row[0] ===
                    "Website = https://www.monday.com"
            )
        )
    );


    tests.push(
        runTest(
            "Failed output should contain Status = Failed",

            failedRows.some(
                (row) =>
                    row[0] ===
                    "Status = Failed"
            )
        )
    );


    tests.push(
        runTest(
            "Failed output should preserve failure reason",

            failedRows.some(
                (row) =>
                    row[0] ===
                    "Reason = Website request timed out after 30 seconds."
            )
        )
    );


    tests.push(
        runTest(
            "Multiple failed companies should have blank separator row",

            failedRows.some(
                (row) =>
                    row.length === 1 &&
                    row[0] === ""
            )
        )
    );


    // --------------------------------------------------
    // Trigger detail tests
    // --------------------------------------------------

    const triggerRows =
        buildTriggerRows(
            [
                testCompany
            ]
        );


    tests.push(
        runTest(
            "Trigger detail should contain 3 trigger rows",

            triggerRows.length ===
            3
        )
    );


    tests.push(
        runTest(
            "Trigger detail should contain predefined trigger",

            triggerRows.some(
                (row) =>
                    row.type ===
                    "Predefined"
            )
        )
    );


    tests.push(
        runTest(
            "Trigger detail should contain additional trigger",

            triggerRows.some(
                (row) =>
                    row.type ===
                    "Additional"
            )
        )
    );


    // --------------------------------------------------
    // Evidence detail tests
    // --------------------------------------------------

    const evidenceRows =
        buildEvidenceRows(
            [
                testCompany
            ]
        );


    tests.push(
        runTest(
            "Evidence detail should contain trigger and general evidence",

            evidenceRows.length ===
            4
        )
    );


    tests.push(
        runTest(
            "Evidence detail should contain General Evidence row",

            evidenceRows.some(
                (row) =>
                    row.trigger ===
                    "General Evidence" &&
                    row.trigger_type ===
                    "General"
            )
        )
    );


    tests.push(
        runTest(
            "Evidence detail should preserve general evidence URL",

            evidenceRows.some(
                (row) =>
                    row.source ===
                    "https://example.com/about"
            )
        )
    );


    // --------------------------------------------------
    // Output directory
    // --------------------------------------------------

    const outputDirectory =
        path.join(
            __dirname,
            "..",
            "output",
            "test-csv-writer"
        );


    const outputFilePath =
        path.join(
            outputDirectory,
            "screened-companies.csv"
        );


    if (
        fs.existsSync(
            outputDirectory
        )
    ) {

        fs.rmSync(
            outputDirectory,
            {
                recursive:
                    true,

                force:
                    true
            }
        );
    }


    ensureOutputDirectory(
        outputFilePath
    );


    tests.push(
        runTest(
            "Output directory should be created automatically",

            fs.existsSync(
                outputDirectory
            )
        )
    );


    // --------------------------------------------------
    // Output paths
    // --------------------------------------------------

    const outputPaths =
        getOutputPaths(
            outputFilePath
        );


    tests.push(
        runTest(
            "Main output should be screened-companies.csv",

            path.basename(
                outputPaths.summary
            ) ===
            "screened-companies.csv"
        )
    );


    tests.push(
        runTest(
            "Trigger output should be detected-triggers.csv",

            path.basename(
                outputPaths.triggers
            ) ===
            "detected-triggers.csv"
        )
    );


    tests.push(
        runTest(
            "Evidence output should be evidence.csv",

            path.basename(
                outputPaths.evidence
            ) ===
            "evidence.csv"
        )
    );


    tests.push(
        runTest(
            "Failed output should be failed-companies.csv",

            path.basename(
                outputPaths.failed
            ) ===
            "failed-companies.csv"
        )
    );


    // --------------------------------------------------
    // Full successful write test
    // --------------------------------------------------

    try {

        const writeResult =
            await writeCompanies(
                outputFilePath,
                [
                    testCompany,
                    secondCompany
                ]
            );


        tests.push(
            runTest(
                "Writer should report 2 successful companies",

                writeResult.written ===
                2
            )
        );


        tests.push(
            runTest(
                "screened-companies.csv should exist",

                fs.existsSync(
                    outputPaths.summary
                )
            )
        );


        tests.push(
            runTest(
                "detected-triggers.csv should exist",

                fs.existsSync(
                    outputPaths.triggers
                )
            )
        );


        tests.push(
            runTest(
                "evidence.csv should exist",

                fs.existsSync(
                    outputPaths.evidence
                )
            )
        );


        // --------------------------------------------------
        // Main CSV content
        // --------------------------------------------------

        const summaryContent =
            fs.readFileSync(
                outputPaths.summary,
                "utf8"
            );


        tests.push(
            runTest(
                "Main CSV should use Screening Result header",

                summaryContent.startsWith(
                    "Screening Result"
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Website = value",

                summaryContent.includes(
                    "Website = https://example.com"
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Company = value",

                summaryContent.includes(
                    "Company = Example Company"
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Score = value",

                summaryContent.includes(
                    "Score = 7 / 10"
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Growth Signals = value",

                summaryContent.includes(
                    "Growth Signals = "
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Operational Signals = value",

                summaryContent.includes(
                    "Operational Signals = "
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Evidence = value",

                summaryContent.includes(
                    "Evidence = "
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Reason = value",

                summaryContent.includes(
                    "Reason = "
                )
            )
        );


        tests.push(
            runTest(
                "Main CSV should contain Confidence = High",

                summaryContent.includes(
                    "Confidence = High"
                )
            )
        );


        // --------------------------------------------------
        // Evidence CSV content
        // --------------------------------------------------

        const evidenceContent =
            fs.readFileSync(
                outputPaths.evidence,
                "utf8"
            );


        tests.push(
            runTest(
                "Evidence CSV should contain trigger evidence",

                evidenceContent.includes(
                    "https://example.com/careers"
                )
            )
        );


        tests.push(
            runTest(
                "Evidence CSV should contain general evidence",

                evidenceContent.includes(
                    "https://example.com/about"
                )
            )
        );


        tests.push(
            runTest(
                "Evidence CSV should label general evidence",

                evidenceContent.includes(
                    "General Evidence"
                )
            )
        );


        // --------------------------------------------------
        // Failed-company CSV write test
        // --------------------------------------------------

        const failedWriteResult =
            await writeFailedCompanies(
                outputPaths.failed,
                failedCompanies
            );


        tests.push(
            runTest(
                "Failed writer should report 2 failed companies",

                failedWriteResult.written ===
                2
            )
        );


        tests.push(
            runTest(
                "failed-companies.csv should exist",

                fs.existsSync(
                    outputPaths.failed
                )
            )
        );


        const failedContent =
            fs.readFileSync(
                outputPaths.failed,
                "utf8"
            );


        tests.push(
            runTest(
                "Failed CSV should use Failed Screening Result header",

                failedContent.startsWith(
                    "Failed Screening Result"
                )
            )
        );


        tests.push(
            runTest(
                "Failed CSV should contain Monday.com",

                failedContent.includes(
                    "Website = https://www.monday.com"
                )
            )
        );


        tests.push(
            runTest(
                "Failed CSV should contain Status = Failed",

                failedContent.includes(
                    "Status = Failed"
                )
            )
        );


        tests.push(
            runTest(
                "Failed CSV should contain timeout reason",

                failedContent.includes(
                    "Website request timed out after 30 seconds."
                )
            )
        );


        // --------------------------------------------------
        // Empty successful array
        // --------------------------------------------------

        const emptyResult =
            await writeCompanies(
                outputFilePath,
                []
            );


        tests.push(
            runTest(
                "Empty successful-company array should report 0 written",

                emptyResult.written ===
                0
            )
        );


        tests.push(
            runTest(
                "Empty successful-company array should return null file path",

                emptyResult.filePath ===
                null
            )
        );


        // --------------------------------------------------
        // Empty failed array
        // --------------------------------------------------

        const emptyFailedResult =
            await writeFailedCompanies(
                outputPaths.failed,
                []
            );


        tests.push(
            runTest(
                "Empty failed-company array should report 0 written",

                emptyFailedResult.written ===
                0
            )
        );


        tests.push(
            runTest(
                "Empty failed-company array should return null file path",

                emptyFailedResult.filePath ===
                null
            )
        );


        // --------------------------------------------------
        // Invalid successful input
        // --------------------------------------------------

        let invalidInputThrows =
            false;


        try {

            await writeCompanies(
                outputFilePath,
                null
            );

        } catch (error) {

            invalidInputThrows =
                true;
        }


        tests.push(
            runTest(
                "Invalid successful-company input should throw",

                invalidInputThrows
            )
        );


        // --------------------------------------------------
        // Invalid failed input
        // --------------------------------------------------

        let invalidFailedInputThrows =
            false;


        try {

            await writeFailedCompanies(
                outputPaths.failed,
                null
            );

        } catch (error) {

            invalidFailedInputThrows =
                true;
        }


        tests.push(
            runTest(
                "Invalid failed-company input should throw",

                invalidFailedInputThrows
            )
        );


    } finally {

        if (
            fs.existsSync(
                outputDirectory
            )
        ) {

            fs.rmSync(
                outputDirectory,
                {
                    recursive:
                        true,

                    force:
                        true
                }
            );
        }
    }


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
            "\nCSV writer test completed successfully."
        );

    } else {

        console.log(
            "\nCSV writer test failed."
        );

        process.exitCode =
            1;
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();