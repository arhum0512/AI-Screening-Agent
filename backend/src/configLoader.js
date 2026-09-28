const fs = require("fs");
const path = require("path");


/*
 * Load all application configuration files.
 *
 * The default screening prompt is always preserved.
 *
 * If the dashboard supplies a custom prompt,
 * that prompt is loaded separately and the pipeline
 * uses it to select focused custom-query mode.
 */
function loadConfig(options = {}) {

    const configPath =
        path.join(
            __dirname,
            "..",
            "config"
        );


    // --------------------------------------------------
    // Optional custom file paths
    // --------------------------------------------------

    const customPromptPath =
        options.promptPath ||
        null;

    const customTriggersPath =
        options.triggersPath ||
        null;


    // --------------------------------------------------
    // Triggers / scoring configuration
    // --------------------------------------------------

    const defaultTriggersPath =
        path.join(
            configPath,
            "triggers.json"
        );

    const triggersPath =
        customTriggersPath ||
        defaultTriggersPath;


    if (
        !fs.existsSync(
            triggersPath
        )
    ) {

        throw new Error(
            `Trigger configuration file not found: ${triggersPath}`
        );
    }


    let triggers;


    try {

        triggers =
            JSON.parse(
                fs.readFileSync(
                    triggersPath,
                    "utf8"
                )
            );

    } catch (error) {

        throw new Error(
            `Unable to load trigger configuration: ${error.message}`
        );
    }


    // --------------------------------------------------
    // Default/base screening prompt
    // --------------------------------------------------

    const defaultPromptPath =
        path.join(
            configPath,
            "screening-prompt.md"
        );


    if (
        !fs.existsSync(
            defaultPromptPath
        )
    ) {

        throw new Error(
            `Default screening prompt file not found: ${defaultPromptPath}`
        );
    }


    const screeningPrompt =
        fs.readFileSync(
            defaultPromptPath,
            "utf8"
        );


    if (
        !screeningPrompt.trim()
    ) {

        throw new Error(
            "Default screening prompt file is empty."
        );
    }


    // --------------------------------------------------
    // Optional custom screening instructions
    // --------------------------------------------------

    let customPrompt =
        "";


    if (
        customPromptPath
    ) {

        if (
            !fs.existsSync(
                customPromptPath
            )
        ) {

            throw new Error(
                `Custom screening prompt file not found: ${customPromptPath}`
            );
        }


        customPrompt =
            fs.readFileSync(
                customPromptPath,
                "utf8"
            );


        if (
            !customPrompt.trim()
        ) {

            throw new Error(
                "Custom screening prompt is empty."
            );
        }
    }


    // --------------------------------------------------
    // Output schema
    // --------------------------------------------------

    const schemaPath =
        path.join(
            configPath,
            "output-schema.json"
        );


    if (
        !fs.existsSync(
            schemaPath
        )
    ) {

        throw new Error(
            `Output schema file not found: ${schemaPath}`
        );
    }


    let outputSchema;


    try {

        outputSchema =
            JSON.parse(
                fs.readFileSync(
                    schemaPath,
                    "utf8"
                )
            );

    } catch (error) {

        throw new Error(
            `Unable to load output schema: ${error.message}`
        );
    }


    // --------------------------------------------------
    // Research configuration
    // --------------------------------------------------

    const researchPath =
        path.join(
            configPath,
            "research.json"
        );


    if (
        !fs.existsSync(
            researchPath
        )
    ) {

        throw new Error(
            `Research configuration file not found: ${researchPath}`
        );
    }


    let research;


    try {

        research =
            JSON.parse(
                fs.readFileSync(
                    researchPath,
                    "utf8"
                )
            );

    } catch (error) {

        throw new Error(
            `Unable to load research configuration: ${error.message}`
        );
    }


    // --------------------------------------------------
    // Return all configuration
    // --------------------------------------------------

    return {

        // Mandatory base prompt
        screeningPrompt,

        // Optional user-provided instructions
        customPrompt,

        triggers,

        outputSchema,

        research,

        sources: {

            prompt:
                customPromptPath
                    ? "custom"
                    : "default",

            scoring:
                customTriggersPath
                    ? "custom"
                    : "default",

            defaultPromptPath,

            customPromptPath,

            triggersPath
        }
    };
}


module.exports = {
    loadConfig
};
