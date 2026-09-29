require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    runScreening
} = require("./src/screeningPipeline");

const {
    readResearchSources,
    addResearchSource,
    deleteResearchSource,
    resolveResearchSources
} = require("./src/researchSourceRegistry");


const app = express();

const PORT =
    process.env.PORT ||
    5050;


// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// --------------------------------------------------
// Upload directory
// --------------------------------------------------

const uploadDirectory =
    path.join(
        __dirname,
        "uploads"
    );

if (
    !fs.existsSync(
        uploadDirectory
    )
) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );
}


// --------------------------------------------------
// Dashboard output directory
// --------------------------------------------------

const dashboardOutputDirectory =
    path.join(
        __dirname,
        "output",
        "dashboard"
    );

if (
    !fs.existsSync(
        dashboardOutputDirectory
    )
) {

    fs.mkdirSync(
        dashboardOutputDirectory,
        {
            recursive: true
        }
    );
}


// --------------------------------------------------
// React production build directory
// --------------------------------------------------

const frontendDistDirectory =
    path.join(
        __dirname,
        "..",
        "frontend",
        "dist"
    );

const frontendIndexFile =
    path.join(
        frontendDistDirectory,
        "index.html"
    );


// --------------------------------------------------
// Multer storage
// --------------------------------------------------

const storage =
    multer.diskStorage({

        destination:
            (
                req,
                file,
                callback
            ) => {

                callback(
                    null,
                    uploadDirectory
                );
            },

        filename:
            (
                req,
                file,
                callback
            ) => {

                const safeOriginalName =
                    file.originalname
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            "-"
                        );

                const uniqueName =
                    `${Date.now()}-${safeOriginalName}`;

                callback(
                    null,
                    uniqueName
                );
            }
    });


// --------------------------------------------------
// Upload middleware
// --------------------------------------------------

const upload =
    multer({
        storage:
            storage
    });


// --------------------------------------------------
// Helper: safely delete temporary file
// --------------------------------------------------

function deleteFileSafely(filePath) {

    if (
        !filePath
    ) {

        return;
    }


    try {

        if (
            fs.existsSync(
                filePath
            )
        ) {

            fs.unlinkSync(
                filePath
            );
        }

    } catch (error) {

        console.error(
            `Unable to remove temporary file: ${filePath}`
        );
    }
}


// --------------------------------------------------
// Helper: create temporary manual website CSV
// --------------------------------------------------

function createManualWebsiteCsv(websitesText) {

    const websites =
        String(
            websitesText ||
            ""
        )
            .split(/\r?\n/)
            .map(
                (website) =>
                    website.trim()
            )
            .filter(
                Boolean
            );


    if (
        websites.length === 0
    ) {

        throw new Error(
            "Please enter at least one website."
        );
    }


    const rows = [
        "website"
    ];


    websites.forEach(
        (website) => {

            const escapedWebsite =
                website.replace(
                    /"/g,
                    '""'
                );

            rows.push(
                `"${escapedWebsite}"`
            );
        }
    );


    const filePath =
        path.join(
            uploadDirectory,
            `${Date.now()}-manual-websites.csv`
        );


    fs.writeFileSync(
        filePath,
        rows.join("\n"),
        "utf8"
    );


    return {
        filePath,
        count:
            websites.length
    };
}


// --------------------------------------------------
// Helper: create temporary manual prompt file
// --------------------------------------------------

function createManualPromptFile(promptText) {

    const cleanedPrompt =
        String(
            promptText ||
            ""
        ).trim();


    if (
        !cleanedPrompt
    ) {

        throw new Error(
            "Manual screening prompt cannot be empty."
        );
    }


    const filePath =
        path.join(
            uploadDirectory,
            `${Date.now()}-manual-screening-prompt.md`
        );


    fs.writeFileSync(
        filePath,
        cleanedPrompt,
        "utf8"
    );


    return filePath;
}


// --------------------------------------------------
// Health route
// --------------------------------------------------

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            success:
                true,

            message:
                "AI Website Screening Agent backend is running."
        });
    }
);


// --------------------------------------------------
// Dynamic research source registry
// --------------------------------------------------

app.get(
    "/api/research-sources",
    (req, res) => {
        try {
            return res.json({
                success: true,
                sources: readResearchSources()
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);


app.post(
    "/api/research-sources",
    async (req, res) => {
        try {
            const source = await addResearchSource(req.body);

            return res.status(201).json({
                success: true,
                source
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);


app.delete(
    "/api/research-sources/:id",
    async (req, res) => {
        try {
            const source = await deleteResearchSource(req.params.id);

            return res.json({
                success: true,
                source
            });
        } catch (error) {
            return res.status(error.status || 400).json({
                success: false,
                message: error.message
            });
        }
    }
);


// --------------------------------------------------
// Downloadable screening files
// --------------------------------------------------

const downloadableFiles = {

    summary:
        "screened-companies.csv",

    triggers:
        "detected-triggers.csv",

    evidence:
        "evidence.csv",

    "custom-results":
        "custom-results.csv",

    "custom-evidence":
        "custom-evidence.csv",

    failed:
        "failed-companies.csv"
};


// --------------------------------------------------
// Download result route
// --------------------------------------------------

app.get(
    "/api/download/:type",
    (req, res) => {

        const type =
            req.params.type;


        const fileName =
            downloadableFiles[
                type
            ];


        if (
            !fileName
        ) {

            return res
                .status(
                    400
                )
                .json({

                    success:
                        false,

                    message:
                        "Invalid download type."
                });
        }


        const filePath =
            path.join(
                dashboardOutputDirectory,
                fileName
            );


        if (
            !fs.existsSync(
                filePath
            )
        ) {

            return res
                .status(
                    404
                )
                .json({

                    success:
                        false,

                    message:
                        "Requested result file is not available."
                });
        }


        return res.download(
            filePath,
            fileName
        );
    }
);


// --------------------------------------------------
// Screening route
// --------------------------------------------------

app.post(
    "/api/upload",

    upload.fields([
        {
            name:
                "companies",

            maxCount:
                1
        },

        {
            name:
                "prompt",

            maxCount:
                1
        },

        {
            name:
                "scoring",

            maxCount:
                1
        }
    ]),

    async (req, res) => {

        const companiesFile =
            req.files?.companies?.[0] ||
            null;

        const promptFile =
            req.files?.prompt?.[0] ||
            null;

        const scoringFile =
            req.files?.scoring?.[0] ||
            null;


        const websitesText =
            req.body?.websitesText?.trim() ||
            "";

        const promptText =
            req.body?.promptText?.trim() ||
            "";

        const scoringText =
            req.body?.scoringText?.trim() ||
            "";

        let selectedSourceIds;

        try {
            selectedSourceIds =
                typeof req.body?.selectedSources === "string"
                    ? JSON.parse(req.body.selectedSources)
                    : req.body?.selectedSources;
        } catch (error) {
            selectedSourceIds = null;
        }


        let companiesPath =
            null;

        let promptPath =
            null;

        let triggersPath =
            null;


        let manualCompaniesPath =
            null;

        let manualPromptPath =
            null;

        try {

            let selectedSources;

            try {
                selectedSources = resolveResearchSources(selectedSourceIds);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            // --------------------------------------------------
            // Validate company input
            // --------------------------------------------------

            if (
                companiesFile &&
                websitesText
            ) {

                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Choose either a company CSV file or manual website entry, not both."
                    });
            }


            if (
                !companiesFile &&
                !websitesText
            ) {

                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Upload a company CSV or enter at least one website manually."
                    });
            }


            // --------------------------------------------------
            // Validate prompt input
            // --------------------------------------------------

            if (
                promptFile &&
                promptText
            ) {

                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Choose either an uploaded prompt or a manually written prompt, not both."
                    });
            }


            // --------------------------------------------------
            // Validate scoring input
            // --------------------------------------------------

            if (
                scoringFile &&
                scoringText
            ) {

                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Choose either an uploaded scoring file or manually written scoring instructions, not both."
                    });
            }


            // --------------------------------------------------
            // Prepare company input
            // --------------------------------------------------

            let companyInputDescription;


            if (
                companiesFile
            ) {

                companiesPath =
                    companiesFile.path;

                companyInputDescription =
                    companiesFile.originalname;

            } else {

                const manualCompanies =
                    createManualWebsiteCsv(
                        websitesText
                    );

                manualCompaniesPath =
                    manualCompanies.filePath;

                companiesPath =
                    manualCompanies.filePath;

                companyInputDescription =
                    `${manualCompanies.count} manually entered website(s)`;
            }


            // --------------------------------------------------
            // Prepare prompt input
            // --------------------------------------------------

            let promptDescription;


            if (
                promptFile
            ) {

                promptPath =
                    promptFile.path;

                promptDescription =
                    promptFile.originalname;

            } else if (
                promptText
            ) {

                manualPromptPath =
                    createManualPromptFile(
                        promptText
                    );

                promptPath =
                    manualPromptPath;

                promptDescription =
                    "Manual screening prompt";

            } else {

                promptPath =
                    null;

                promptDescription =
                    "Using default screening prompt";
            }


            // --------------------------------------------------
            // Prepare scoring input
            // --------------------------------------------------

            let scoringDescription;


            if (
                scoringFile
            ) {

                triggersPath =
                    scoringFile.path;

                scoringDescription =
                    scoringFile.originalname;

            } else if (
                scoringText
            ) {

                triggersPath =
                    null;

                scoringDescription =
                    "Manual scoring instructions";

            } else {

                triggersPath =
                    null;

                scoringDescription =
                    "Using default scoring configuration";
            }


            // --------------------------------------------------
            // Console information
            // --------------------------------------------------

            console.log(
                "\n========================================"
            );

            console.log(
                "DASHBOARD SCREENING REQUEST RECEIVED"
            );

            console.log(
                "========================================"
            );

            console.log(
                `Company input: ${companyInputDescription}`
            );

            console.log(
                `Prompt: ${promptDescription}`
            );

            console.log(
                `Scoring: ${scoringDescription}`
            );


            // --------------------------------------------------
            // Run real screening pipeline
            // --------------------------------------------------

            const result =
                await runScreening({

                    companiesPath,

                    promptPath,

                    triggersPath,

                    scoringInstructions:
                        scoringText,

                    selectedSources,

                    outputDirectory:
                        dashboardOutputDirectory
                });


            // --------------------------------------------------
            // Return dashboard result
            // --------------------------------------------------

            return res.json({

                mode:
                    result.mode,

                success:
                    result.success,

                message:
                    result.message,

                uploadedFiles: {

                    companies:
                        companyInputDescription,

                    prompt:
                        promptDescription,

                    scoring:
                        scoringDescription
                },

                inputMethods: {

                    companies:
                        companiesFile
                            ? "file"
                            : "manual",

                    prompt:
                        promptFile
                            ? "file"
                            : promptText
                                ? "manual"
                                : "default",

                    scoring:
                        scoringFile
                            ? "file"
                            : scoringText
                                ? "manual"
                                : "default"
                },

                summary: {

                    totalCompanies:
                        result.totalCompanies,

                    successfulCompanies:
                        result.successfulCompanies,

                    failedCompanies:
                        result.failedCompanies,

                    dailyQuotaExhausted:
                        result.dailyQuotaExhausted
                },

                configSources:
                    result.configSources,

                selectedSources:
                    result.selectedSources,

                results:
                    result.mode === "custom_query"
                        ? []
                        : result.results,

                customSummary:
                    result.customSummary
                        ? {
                            companiesProcessed:
                                result.customSummary.companiesProcessed,
                            questionsAnswered:
                                result.customSummary.questionsAnswered,
                            score:
                                result.customSummary.score
                                    ? {
                                        value:
                                            result.customSummary.score.value,
                                        max:
                                            result.customSummary.score.max
                                    }
                                    : null
                        }
                        : null,

                failures:
                    result.failures,

                files:
                    result.mode === "custom_query"
                        ? {
                            customResults:
                                Boolean(
                                    result.files.customResults
                                ),
                            customEvidence:
                                Boolean(
                                    result.files.customEvidence
                                ),
                            failed:
                                Boolean(
                                    result.files.failed
                                )
                        }
                        : result.files
            });


        } catch (error) {

            console.error(
                "\nDashboard screening failed:"
            );

            console.error(
                error.message
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        error.message ||
                        "Screening failed."
                });


        } finally {

            // --------------------------------------------------
            // Clean uploaded and temporary input files
            // --------------------------------------------------

            deleteFileSafely(
                companiesFile?.path
            );

            deleteFileSafely(
                promptFile?.path
            );

            deleteFileSafely(
                scoringFile?.path
            );

            deleteFileSafely(
                manualCompaniesPath
            );

            deleteFileSafely(
                manualPromptPath
            );

        }
    }
);


// --------------------------------------------------
// Serve React production files
// --------------------------------------------------

if (
    fs.existsSync(
        frontendDistDirectory
    )
) {

    app.use(
        express.static(
            frontendDistDirectory
        )
    );


    // --------------------------------------------------
    // React SPA fallback
    // --------------------------------------------------

    app.use(
        (req, res, next) => {

            if (
                req.method !== "GET"
            ) {

                return next();
            }


            if (
                req.path.startsWith(
                    "/api/"
                )
            ) {

                return next();
            }


            if (
                !fs.existsSync(
                    frontendIndexFile
                )
            ) {

                return next();
            }


            return res.sendFile(
                frontendIndexFile
            );
        }
    );

} else {

    // --------------------------------------------------
    // Development fallback when React build does not exist
    // --------------------------------------------------

    app.get(
        "/",
        (req, res) => {

            res.json({
                success:
                    true,

                message:
                    "AI Website Screening Agent backend is running. React production build was not found."
            });
        }
    );
}


// --------------------------------------------------
// API 404 handler
// --------------------------------------------------

app.use(
    "/api",
    (req, res) => {

        return res
            .status(
                404
            )
            .json({

                success:
                    false,

                message:
                    "API endpoint not found."
            });
    }
);


// --------------------------------------------------
// Start server
// --------------------------------------------------

if (require.main === module) {
    app.listen(
        PORT,
        () => {

        console.log(
            `Backend server running on http://localhost:${PORT}`
        );


        if (
            fs.existsSync(
                frontendIndexFile
            )
        ) {

            console.log(
                "React production frontend is being served by Express."
            );

        } else {

            console.log(
                "React production build not found. Run npm run build inside frontend."
            );
        }
        }
    );
}

module.exports = {
    app
};
