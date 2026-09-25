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
    configureResearch,
    researchWebsite
} = require("./research/webResearcher");

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


async function runScreening(options = {}) {

    const companiesPath =
        options.companiesPath;

    const promptPath =
        options.promptPath ||
        null;

    const triggersPath =
        options.triggersPath ||
        null;

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


    const outputFiles = [
        summaryOutputPath,
        triggerOutputPath,
        evidenceOutputPath,
        failedOutputPath
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

            // Research website
            const research =
                await researchWebsite(
                    company.website
                );


            // Build AI prompt
           const researchPrompt =
    createResearchPrompt(
        company,
        config.screeningPrompt,
        config.triggers,
        research.text,
        config.customPrompt
    );


            // AI request
            const aiResponse =
                await askAI(
                    researchPrompt
                );


            // Parse AI result
            const aiResult =
                parseAIResponse(
                    aiResponse
                );


            // Validate AI result
            const validation =
                validateScreeningResult(
                    aiResult
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


            // Detect configured triggers
            const detectedTriggers =
                detectTriggers(
                    aiResult,
                    config.triggers
                );


            // Detect additional triggers
            const additionalTriggers =
                detectAdditionalTriggers(
                    aiResult,
                    config.triggers
                );


            // Calculate backend score
            const companyScore =
                calculateCompanyScore(
                    detectedTriggers,
                    additionalTriggers
                );


            // Format final result
            const formattedResult =
                formatScreeningResult(
                    company,
                    aiResult,
                    detectedTriggers,
                    additionalTriggers,
                    companyScore
                );


            screeningResults.push(
                formattedResult
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

        writeResult =
            await writeCompanies(
                summaryOutputPath,
                screeningResults
            );
    }


    // --------------------------------------------------
    // Return dashboard-friendly result
    // --------------------------------------------------

    return {

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
            config.sources,

        results:
            screeningResults,

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