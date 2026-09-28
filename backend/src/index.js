require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { loadConfig } = require("./configLoader");
const { readCompanies } = require("./csvReader");

const {
    writeCompanies,
    writeFailedCompanies
} = require("./csvWriter");

const {
    createResearchPrompt
} = require("./screening/researcher");

const {
    configureResearch
} = require("./research/webResearcher");

const {
    researchAllSources
} = require("./research/multiSourceResearcher");

const {
    validateScreeningResult
} = require("./validation/outputValidator");

const {
    detectTriggers,
    detectAdditionalTriggers
} = require("./screening/triggerDetector");

const {
    calculateCompanyScore
} = require("./screening/scoreCalculator");

const {
    askAI,
    parseAIResponse,
    getErrorStatus,
    isDailyQuotaExceeded
} = require("./ai/grokClient");

const {
    formatScreeningResult
} = require("./screening/resultFormatter");


async function main() {

    try {

        console.log(
            "Starting AI Website Screening Agent..."
        );


        // --------------------------------------------------
        // 1. Load configuration
        // --------------------------------------------------

        const config =
            loadConfig();

        configureResearch(
            config.research
        );

        console.log(
            "Configuration loaded successfully."
        );


        // --------------------------------------------------
        // 2. Prepare paths
        // --------------------------------------------------

        const outputDirectory =
            path.join(
                __dirname,
                "..",
                "output"
            );

        const summaryOutputPath =
            path.join(
                outputDirectory,
                "screened-companies.csv"
            );

        const triggerOutputPath =
            path.join(
                outputDirectory,
                "detected-triggers.csv"
            );

        const evidenceOutputPath =
            path.join(
                outputDirectory,
                "evidence.csv"
            );

        const failedOutputPath =
            path.join(
                outputDirectory,
                "failed-companies.csv"
            );

        const outputFiles = [
            summaryOutputPath,
            triggerOutputPath,
            evidenceOutputPath,
            failedOutputPath
        ];


        // --------------------------------------------------
        // 3. Clear previous output files
        // --------------------------------------------------

        let previousOutputCleared =
            false;

        outputFiles.forEach(
            (filePath) => {

                if (
                    fs.existsSync(
                        filePath
                    )
                ) {

                    fs.unlinkSync(
                        filePath
                    );

                    previousOutputCleared =
                        true;
                }
            }
        );

        if (
            previousOutputCleared
        ) {

            console.log(
                "Previous screening output files cleared."
            );
        }


        // --------------------------------------------------
        // 4. Read companies from CSV
        // --------------------------------------------------

        const inputPath =
            path.join(
                __dirname,
                "..",
                "input",
                "companies.csv"
            );

        const companies =
            await readCompanies(
                inputPath
            );

        console.log(
            `Companies loaded: ${companies.length}`
        );

        if (
            companies.length === 0
        ) {

            console.log(
                "No companies found in the input CSV."
            );

            console.log(
                "No output CSV files were created for this run."
            );

            return;
        }


        // --------------------------------------------------
        // 5. Prepare result collections
        // --------------------------------------------------

        const screeningResults = [];

        const failedCompanies = [];

        let dailyQuotaExhausted =
            false;


        // --------------------------------------------------
        // 6. Process every company
        // --------------------------------------------------

        for (
            let i = 0;
            i < companies.length;
            i++
        ) {

            const company =
                companies[i];

            console.log(
                "\n========================================"
            );

            console.log(
                `Processing company ${i + 1} of ${companies.length}`
            );

            console.log(
                "========================================"
            );

            console.log(
                `Website: ${company.website}`
            );


            try {

                // --------------------------------------------------
                // 6.1 Fetch multi-source research
                // --------------------------------------------------

                console.log(
                    "\nResearching official website, public web, and X..."
                );

                const research =
                    await researchAllSources(
                        company
                    );

                console.log(
                    `Multi-source research completed successfully (${research.sources.length} source URLs).`
                );


                // --------------------------------------------------
                // 6.2 Create screening prompt
                // --------------------------------------------------

                const researchPrompt =
                    createResearchPrompt(
                        company,
                        config.screeningPrompt,
                        config.triggers,
                        research.text,
                        config.customPrompt
                    );

                console.log(
                    "Complete screening prompt created successfully."
                );


                // --------------------------------------------------
                // 6.3 Send research to AI
                // --------------------------------------------------

                console.log(
                    `Using AI provider: ${process.env.AI_PROVIDER}`
                );

                console.log(
                    "Sending screening prompt to AI..."
                );

                const aiResponse =
                    await askAI(
                        researchPrompt
                    );

                console.log(
                    "AI response received successfully."
                );


                // --------------------------------------------------
                // 6.4 Parse AI response
                // --------------------------------------------------

                console.log(
                    "Parsing AI response..."
                );

                const aiResult =
                    parseAIResponse(
                        aiResponse
                    );

                console.log(
                    "AI response parsed successfully."
                );


                // --------------------------------------------------
                // 6.5 Validate AI response
                // --------------------------------------------------

                console.log(
                    "Validating AI screening result..."
                );

                const validation =
                    validateScreeningResult(
                        aiResult,
                        {
                            allowedSourceUrls:
                                research.sources.map(
                                    (source) =>
                                        source.url
                                )
                        }
                    );

                if (
                    !validation.valid
                ) {

                    console.error(
                        "AI screening result is invalid."
                    );

                    validation.errors.forEach(
                        (error) => {

                            console.error(
                                `- ${error}`
                            );
                        }
                    );

                    failedCompanies.push({
                        website:
                            company.website,

                        reason:
                            `AI screening result validation failed: ${validation.errors.join("; ")}`
                    });

                    console.log(
                        "Moving to the next company..."
                    );

                    continue;
                }

                console.log(
                    "AI screening result is valid."
                );


                // --------------------------------------------------
                // 6.6 Detect predefined triggers
                // --------------------------------------------------

                console.log(
                    "Detecting predefined triggers..."
                );

                const detectedTriggers =
                    detectTriggers(
                        aiResult,
                        config.triggers
                    );

                console.log(
                    `Predefined triggers detected: ${detectedTriggers.length}`
                );


                // --------------------------------------------------
                // 6.7 Detect additional triggers
                // --------------------------------------------------

                console.log(
                    "Detecting additional triggers..."
                );

                const additionalTriggers =
                    detectAdditionalTriggers(
                        aiResult,
                        config.triggers
                    );

                console.log(
                    `Additional triggers detected: ${additionalTriggers.length}`
                );


                // --------------------------------------------------
                // 6.8 Calculate final company score
                // --------------------------------------------------

                console.log(
                    "Calculating final company score..."
                );

                const companyScore =
                    calculateCompanyScore(
                        detectedTriggers,
                        additionalTriggers
                    );


                // --------------------------------------------------
                // 6.9 Format final result
                // --------------------------------------------------

                console.log(
                    "Formatting final screening result..."
                );

                const formattedResult =
                    formatScreeningResult(
                        company,
                        aiResult,
                        detectedTriggers,
                        additionalTriggers,
                        companyScore
                    );

                console.log(
                    "Final screening result formatted successfully."
                );


                // --------------------------------------------------
                // 6.10 Save successful result
                // --------------------------------------------------

                screeningResults.push(
                    formattedResult
                );

                console.log(
                    `Company score: ${companyScore} / 10`
                );

                console.log(
                    "Company processing completed successfully."
                );


            } catch (companyError) {

                const status =
                    getErrorStatus(
                        companyError
                    );

                const failureReason =
                    companyError?.message ||
                    "Unknown processing error.";


                // --------------------------------------------------
                // Daily AI quota exhaustion
                // --------------------------------------------------

                if (
                    status === 429 &&
                    isDailyQuotaExceeded(
                        companyError
                    )
                ) {

                    dailyQuotaExhausted =
                        true;

                    failedCompanies.push({
                        website:
                            company.website,

                        reason:
                            "AI daily quota has been exhausted."
                    });

                    console.error(
                        `\nFailed to process ${company.website}`
                    );

                    console.error(
                        "AI daily quota has been exhausted."
                    );

                    console.error(
                        "Stopping further company processing because additional AI requests would fail."
                    );

                    break;
                }


                // --------------------------------------------------
                // Normal company-level failure
                // --------------------------------------------------

                failedCompanies.push({
                    website:
                        company.website,

                    reason:
                        failureReason
                });

                console.error(
                    `\nFailed to process ${company.website}`
                );

                console.error(
                    failureReason
                );

                console.log(
                    "Moving to the next company..."
                );
            }
        }


        // --------------------------------------------------
        // 7. Batch summary
        // --------------------------------------------------

        console.log(
            "\n========================================"
        );

        console.log(
            "Screening batch completed."
        );

        console.log(
            `Successful results: ${screeningResults.length}`
        );

        console.log(
            `Failed results: ${failedCompanies.length}`
        );

        console.log(
            `Total companies: ${companies.length}`
        );

        if (
            dailyQuotaExhausted
        ) {

            console.log(
                "Batch stopped early because the AI daily quota was exhausted."
            );
        }

        console.log(
            "========================================"
        );


        // --------------------------------------------------
        // 8. Write failed-company output
        // --------------------------------------------------

        let failedWriteResult = {
            written:
                0,

            filePath:
                null
        };

        if (
            failedCompanies.length > 0
        ) {

            console.log(
                "\nWriting failed company results to CSV..."
            );

            failedWriteResult =
                await writeFailedCompanies(
                    failedOutputPath,
                    failedCompanies
                );

            console.log(
                `Failed-company CSV created successfully: ${failedOutputPath}`
            );
        }


        // --------------------------------------------------
        // 9. Handle zero successful results
        // --------------------------------------------------

        if (
            screeningResults.length === 0
        ) {

            console.log(
                "\nNo successful screening results were generated."
            );

            console.log(
                "No successful-company CSV files were created for this run."
            );

            if (
                failedWriteResult.written > 0
            ) {

                console.log(
                    `Failed companies were saved to: ${failedOutputPath}`
                );
            }

            return;
        }


        // --------------------------------------------------
        // 10. Write successful results
        // --------------------------------------------------

        console.log(
            "\nWriting successful screening results to CSV files..."
        );

        const writeResult =
            await writeCompanies(
                summaryOutputPath,
                screeningResults
            );

        console.log(
            "Successful-company CSV files created successfully."
        );


        // --------------------------------------------------
        // 11. Explain output files
        // --------------------------------------------------

        console.log(
            "\n========================================"
        );

        console.log(
            "YOUR RESULTS ARE READY"
        );

        console.log(
            "========================================"
        );


        console.log(
            "\n1. COMPANY SCREENING RESULTS"
        );

        console.log(
            `Open in Excel: ${writeResult.filePaths.summary}`
        );

        console.log(
            "Contains each successfully screened company in a vertical Field = Value format."
        );


        console.log(
            "\n2. DETECTED TRIGGERS"
        );

        console.log(
            `Open in Excel: ${writeResult.filePaths.triggers}`
        );

        console.log(
            "Contains detailed rows for detected predefined and additional triggers."
        );


        console.log(
            "\n3. EVIDENCE"
        );

        console.log(
            `Open in Excel: ${writeResult.filePaths.evidence}`
        );

        console.log(
            "Contains trigger evidence and general company evidence with source URLs."
        );


        if (
            failedWriteResult.written > 0
        ) {

            console.log(
                "\n4. FAILED COMPANIES"
            );

            console.log(
                `Open in Excel: ${failedOutputPath}`
            );

            console.log(
                "Contains websites that could not be screened and the reason for failure."
            );
        }


        console.log(
            "\nHow to open a CSV file in Excel:"
        );

        console.log(
            "1. Open the project folder."
        );

        console.log(
            "2. Open the output folder."
        );

        console.log(
            "3. Double-click the CSV file you want to view."
        );

        console.log(
            "4. If Windows asks which application to use, choose Microsoft Excel."
        );


        // --------------------------------------------------
        // 12. CSV output summary
        // --------------------------------------------------

        console.log(
            "\n========================================"
        );

        console.log(
            "CSV OUTPUT SUMMARY"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Successful companies written: ${writeResult.written}`
        );

        console.log(
            `Trigger rows written: ${writeResult.triggerRowsWritten}`
        );

        console.log(
            `Evidence rows written: ${writeResult.evidenceRowsWritten}`
        );

        console.log(
            `Failed companies written: ${failedWriteResult.written}`
        );


        // --------------------------------------------------
        // 13. Display successful screening results
        // --------------------------------------------------

        console.log(
            "\n========================================"
        );

        console.log(
            "FINAL SCREENING RESULTS"
        );

        console.log(
            "========================================"
        );

        screeningResults.forEach(
            (result, index) => {

                console.log(
                    `\nCompany ${index + 1}:`
                );

                console.log(
                    `Website: ${result.website}`
                );

                console.log(
                    `Company: ${result.company}`
                );

                console.log(
                    `Score: ${result.company_score} / 10`
                );

                console.log(
                    `Confidence: ${result.confidence}`
                );
            }
        );


        // --------------------------------------------------
        // 14. Display failed websites
        // --------------------------------------------------

        if (
            failedCompanies.length > 0
        ) {

            console.log(
                "\n========================================"
            );

            console.log(
                "FAILED COMPANIES"
            );

            console.log(
                "========================================"
            );

            failedCompanies.forEach(
                (company, index) => {

                    console.log(
                        `\nFailed ${index + 1}:`
                    );

                    console.log(
                        `Website: ${company.website}`
                    );

                    console.log(
                        `Reason: ${company.reason}`
                    );
                }
            );
        }


        console.log(
            "\n========================================"
        );

        if (
            dailyQuotaExhausted
        ) {

            console.log(
                "Batch completed partially because the AI daily quota was exhausted."
            );

        } else if (
            failedCompanies.length > 0
        ) {

            console.log(
                "Batch completed with some company-level failures."
            );

            console.log(
                "Successful and failed results were preserved separately."
            );

        } else {

            console.log(
                "Complete batch screening pipeline completed successfully."
            );
        }

        console.log(
            "========================================"
        );


    } catch (error) {

        console.error(
            "\nApplication Error:"
        );

        console.error(
            error.message
        );
    }
}


main();
