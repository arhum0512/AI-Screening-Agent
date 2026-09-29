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
    writeCustomQueryResults
} = require("./customCsvWriter");

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

const {
    processCustomQuery
} = require("./screening/customQueryProcessor");

const {
    evaluateCustomScoring
} = require("./screening/customScoringEvaluator");


async function runScreening(options = {}) {

    const companiesPath =
        options.companiesPath;

    const dependencies =
        options.dependencies ||
        {};

    const selectedSources =
        options.selectedSources;

    if (
        Array.isArray(selectedSources) &&
        selectedSources.length === 0
    ) {
        throw new Error(
            "Please select at least one research source."
        );
    }


    const promptPath =
        options.promptPath ||
        null;


    const triggersPath =
        options.triggersPath ||
        null;


    const scoringInstructions =
        String(
            options.scoringInstructions ||
            ""
        ).trim();


    const outputDirectory =
        options.outputDirectory ||
        path.join(
            __dirname,
            "..",
            "output"
        );


    if (
        !companiesPath
    ) {

        throw new Error(
            "Company CSV path is required."
        );
    }


    if (
        !fs.existsSync(
            companiesPath
        )
    ) {

        throw new Error(
            `Company CSV file not found: ${companiesPath}`
        );
    }


    // --------------------------------------------------
    // Load configuration
    // --------------------------------------------------

    const config =
        loadConfig({
            promptPath,
            triggersPath
        });


    configureResearch(
        config.research
    );


    const mode =
        config.customPrompt
            ? "custom_query"
            : "standard";


    // --------------------------------------------------
    // Prepare output paths
    // --------------------------------------------------

    if (
        !fs.existsSync(
            outputDirectory
        )
    ) {

        fs.mkdirSync(
            outputDirectory,
            {
                recursive: true
            }
        );
    }


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


    const customResultsOutputPath =
        path.join(
            outputDirectory,
            "custom-results.csv"
        );


    const customEvidenceOutputPath =
        path.join(
            outputDirectory,
            "custom-evidence.csv"
        );


    const legacyCustomOutputPath =
        path.join(
            outputDirectory,
            "custom-query-results.csv"
        );


    const outputFiles = [
        summaryOutputPath,
        triggerOutputPath,
        evidenceOutputPath,
        failedOutputPath,
        customResultsOutputPath,
        customEvidenceOutputPath,
        legacyCustomOutputPath
    ];


    // --------------------------------------------------
    // Clear previous output
    // --------------------------------------------------

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
            }
        }
    );


    // --------------------------------------------------
    // Read company CSV
    // --------------------------------------------------

    const companies =
        await readCompanies(
            companiesPath
        );


    if (
        companies.length === 0
    ) {

        return {

            mode,

            success:
                false,

            message:
                "No valid companies found in the uploaded CSV.",

            totalCompanies:
                0,

            successfulCompanies:
                0,

            failedCompanies:
                0,

            results:
                [],

            failures:
                [],

            files:
                {}
        };
    }


    // --------------------------------------------------
    // Result collections
    // --------------------------------------------------

    const screeningResults = [];

    const failedCompanies = [];

    let dailyQuotaExhausted =
        false;


    // --------------------------------------------------
    // Process companies
    // --------------------------------------------------

    for (
        let i = 0;
        i < companies.length;
        i++
    ) {

        const company =
            companies[i];


        try {

            console.log(
                "\n========================================"
            );

            console.log(
                `Processing company ${i + 1}/${companies.length}`
            );

            console.log(
                `Website: ${company.website}`
            );

            console.log(
                "========================================\n"
            );


            // --------------------------------------------------
            // Research official website, public web, and X
            // --------------------------------------------------

            console.log(
                `Researching official website, public web, and X: ${company.website}`
            );


            const combinedResearch =
                await researchAllSources(
                    company,
                    selectedSources,
                    dependencies
                );


            console.log(
                `Multi-source research completed. Sources found: ${combinedResearch.sources.length}`
            );


            const allowedSourceUrls =
                combinedResearch.sources.map(
                    (source) =>
                        source.url
                );


            // --------------------------------------------------
            // Focused custom-query mode
            // --------------------------------------------------

            if (mode === "custom_query") {

                const customResult =
                    await processCustomQuery({
                        company,
                        query:
                            config.customPrompt,
                        researchText:
                            combinedResearch.text,
                        scoringInstructions,
                        allowedSourceUrls,
                        askAI:
                            dependencies.askAI,
                        parseAIResponse:
                            dependencies.parseAIResponse
                    });

                screeningResults.push(
                    customResult
                );

                console.log(
                    `Custom query completed successfully: ${company.website}`
                );

                continue;
            }


            // --------------------------------------------------
            // Build final AI screening prompt
            // --------------------------------------------------

            const researchPrompt =
                createResearchPrompt(
                    company,
                    config.screeningPrompt,
                    config.triggers,
                    combinedResearch.text,
                    config.customPrompt
                );


            console.log(
                "Final screening prompt created."
            );


            // --------------------------------------------------
            // AI request
            // --------------------------------------------------

            const aiResponse =
                await (
                    dependencies.askAI ||
                    askAI
                )(
                    researchPrompt
                );


            // --------------------------------------------------
            // Parse AI result
            // --------------------------------------------------

            const aiResult =
                parseAIResponse(
                    aiResponse
                );


            // --------------------------------------------------
            // Validate AI result
            // --------------------------------------------------

            const validation =
                validateScreeningResult(
                    aiResult,
                    {
                        allowedSourceUrls:
                            allowedSourceUrls
                    }
                );


            if (
                !validation.valid
            ) {

                failedCompanies.push({

                    website:
                        company.website,

                    reason:
                        `AI screening result validation failed: ${validation.errors.join("; ")}`
                });


                continue;
            }


            // --------------------------------------------------
            // Detect configured triggers
            // --------------------------------------------------

            const detectedTriggers =
                detectTriggers(
                    aiResult,
                    config.triggers
                );


            // --------------------------------------------------
            // Detect additional triggers
            // --------------------------------------------------

            const additionalTriggers =
                detectAdditionalTriggers(
                    aiResult,
                    config.triggers
                );


            // --------------------------------------------------
            // Calculate backend score
            // --------------------------------------------------

            let companyScore =
                calculateCompanyScore(
                    detectedTriggers,
                    additionalTriggers
                );


            let customScore =
                null;


            if (scoringInstructions) {

                customScore =
                    await evaluateCustomScoring({
                        company,
                        researchText:
                            combinedResearch.text,
                        scoringInstructions,
                        allowedSourceUrls,
                        askAI:
                            dependencies.askAI,
                        parseAIResponse:
                            dependencies.parseAIResponse
                    });

                companyScore =
                    customScore.value;
            }


            // --------------------------------------------------
            // Format final result
            // --------------------------------------------------

            const formattedResult =
                formatScreeningResult(
                    company,
                    aiResult,
                    detectedTriggers,
                    additionalTriggers,
                    companyScore
                );


            if (customScore) {

                formattedResult.scoring_mode =
                    "manual";

                formattedResult.scoring_reason =
                    customScore.reason;

                formattedResult.scoring_evidence =
                    JSON.stringify(
                        customScore.evidence
                    );
            }


            screeningResults.push(
                formattedResult
            );


            console.log(
                `Company screening completed successfully: ${company.website}`
            );


        } catch (companyError) {

            const status =
                getErrorStatus(
                    companyError
                );


            const failureReason =
                companyError?.message ||
                "Unknown processing error.";


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


                break;
            }


            failedCompanies.push({

                website:
                    company.website,

                reason:
                    failureReason
            });


            console.error(
                `Company screening failed: ${company.website}`
            );

            console.error(
                failureReason
            );
        }
    }


    // --------------------------------------------------
    // Write failed output
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

        failedWriteResult =
            await writeFailedCompanies(
                failedOutputPath,
                failedCompanies
            );
    }


    // --------------------------------------------------
    // Write successful output
    // --------------------------------------------------

    let writeResult = {

        written:
            0,

        filePath:
            null,

        filePaths:
            null,

        triggerRowsWritten:
            0,

        evidenceRowsWritten:
            0
    };


    if (
        screeningResults.length > 0
    ) {

        if (mode === "custom_query") {

            const customWriteResult =
                await writeCustomQueryResults(
                    customResultsOutputPath,
                    customEvidenceOutputPath,
                    screeningResults
                );

            writeResult = {
                written:
                    customWriteResult.written,
                filePath:
                    customWriteResult.resultsPath,
                filePaths: {
                    summary:
                        customWriteResult.resultsPath,
                    triggers:
                        null,
                    evidence:
                        customWriteResult.evidencePath
                },
                triggerRowsWritten:
                    0,
                evidenceRowsWritten:
                    customWriteResult.evidenceRowsWritten
            };

        } else {

            writeResult =
                await writeCompanies(
                    summaryOutputPath,
                    screeningResults
                );
        }
    }


    // --------------------------------------------------
    // Return dashboard-friendly result
    // --------------------------------------------------

    return {

        mode,

        success:
            screeningResults.length > 0,

        message:
            screeningResults.length > 0
                ? "Screening completed."
                : "Screening completed with no successful company results.",

        totalCompanies:
            companies.length,

        successfulCompanies:
            screeningResults.length,

        failedCompanies:
            failedCompanies.length,

        dailyQuotaExhausted,

        configSources:
            {
                ...config.sources,
                manualScoring:
                    Boolean(
                        scoringInstructions
                    )
            },

        selectedSources:
            Array.isArray(selectedSources)
                ? selectedSources.map(
                    (source) => ({
                        id: source.id,
                        name: source.name,
                        domain: source.domain,
                        type: source.type
                    })
                )
                : [],

        results:
            screeningResults,

        customSummary:
            mode === "custom_query"
                ? {
                    companiesProcessed:
                        screeningResults.length,
                    questionsAnswered:
                        screeningResults.reduce(
                            (
                                total,
                                result
                            ) =>
                                total + result.answers.length,
                            0
                        ),
                    score:
                        screeningResults.length === 1
                            ? screeningResults[0].score
                            : null
                }
                : null,

        failures:
            failedCompanies,

        files: {

            summary:
                writeResult.filePaths?.summary ||
                null,

            triggers:
                writeResult.filePaths?.triggers ||
                null,

            evidence:
                writeResult.filePaths?.evidence ||
                null,

            customResults:
                mode === "custom_query"
                    ? writeResult.filePaths?.summary || null
                    : null,

            customEvidence:
                mode === "custom_query"
                    ? writeResult.filePaths?.evidence || null
                    : null,

            failed:
                failedWriteResult.filePath ||
                null
        },

        counts: {

            triggerRows:
                writeResult.triggerRowsWritten ||
                0,

            evidenceRows:
                writeResult.evidenceRowsWritten ||
                0
        }
    };
}


module.exports = {
    runScreening
};
