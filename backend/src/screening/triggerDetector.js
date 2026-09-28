/**
 * AI Website Screening Agent
 * ---------------------------------------------
 * Trigger Detector
 *
 * Responsibilities:
 *
 * 1. Build a normalized list of configured triggers.
 * 2. Match AI-detected predefined triggers safely.
 * 3. Always enforce the configured score for predefined triggers.
 * 4. Process AI-discovered additional triggers.
 * 5. Prevent configured triggers from being duplicated as
 *    additional triggers.
 * 6. Validate additional-trigger categories and scores.
 * 7. Remove duplicate triggers.
 *
 * IMPORTANT:
 *
 * This module does NOT calculate the final company score.
 * Final company scoring is handled by scoreCalculator.js.
 *
 * This module also does NOT invent triggers from general evidence.
 * A trigger must first be identified by the AI.
 */


// --------------------------------------------------
// Allowed trigger categories
// --------------------------------------------------

const VALID_CATEGORIES = [
    "growth",
    "pain_point",
    "workflow_tool"
];


// --------------------------------------------------
// Normalize text for safer trigger matching
// --------------------------------------------------

function normalizeTriggerName(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }


    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[_-]/g, " ")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


// --------------------------------------------------
// Normalize category
// --------------------------------------------------

function normalizeCategory(category) {

    if (!category) {
        return "";
    }


    const normalized =
        String(category)
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");


    // Support a few harmless AI formatting variations.

    if (
        normalized === "growth" ||
        normalized === "growth_trigger" ||
        normalized === "growth_triggers"
    ) {
        return "growth";
    }


    if (
        normalized === "pain_point" ||
        normalized === "pain_points" ||
        normalized === "painpoint" ||
        normalized === "painpoints" ||
        normalized === "operational" ||
        normalized === "operational_pain_point"
    ) {
        return "pain_point";
    }


    if (
        normalized === "workflow_tool" ||
        normalized === "workflow_tools" ||
        normalized === "workflow" ||
        normalized === "tool" ||
        normalized === "tools"
    ) {
        return "workflow_tool";
    }


    return "";
}


// --------------------------------------------------
// Convert configuration into one trigger list
// --------------------------------------------------

function getPredefinedTriggers(triggers) {

    if (!triggers) {
        return [];
    }


    return [

        ...(triggers.growth_triggers || []).map(
            (trigger) => ({
                name: trigger.name,
                normalizedName:
                    normalizeTriggerName(
                        trigger.name
                    ),
                category: "growth",
                score: Number(trigger.score)
            })
        ),


        ...(triggers.pain_point_triggers || []).map(
            (trigger) => ({
                name: trigger.name,
                normalizedName:
                    normalizeTriggerName(
                        trigger.name
                    ),
                category: "pain_point",
                score: Number(trigger.score)
            })
        ),


        ...(triggers.workflow_tool_triggers || []).map(
            (trigger) => ({
                name: trigger.name,
                normalizedName:
                    normalizeTriggerName(
                        trigger.name
                    ),
                category: "workflow_tool",
                score: Number(trigger.score)
            })
        )

    ];
}


// --------------------------------------------------
// Find configured trigger by name
// --------------------------------------------------

function findPredefinedTrigger(
    triggerName,
    predefinedTriggers
) {

    const normalizedName =
        normalizeTriggerName(
            triggerName
        );


    if (!normalizedName) {
        return null;
    }


    return (
        predefinedTriggers.find(
            (trigger) =>
                trigger.normalizedName ===
                normalizedName
        ) || null
    );
}


// --------------------------------------------------
// Normalize evidence
// --------------------------------------------------

function normalizeEvidence(evidence) {

    if (!Array.isArray(evidence)) {
        return [];
    }


    return evidence
        .filter(
            (item) =>
                item &&
                typeof item === "object"
        )
        .map(
            (item) => ({
                source:
                    typeof item.source === "string"
                        ? item.source.trim()
                        : "",

                description:
                    typeof item.description === "string"
                        ? item.description.trim()
                        : ""
            })
        )
        .filter(
            (item) =>
                item.source &&
                item.description
        );
}


// --------------------------------------------------
// Merge evidence without obvious duplicates
// --------------------------------------------------

function mergeEvidence(
    existingEvidence,
    newEvidence
) {

    const combined = [
        ...normalizeEvidence(
            existingEvidence
        ),
        ...normalizeEvidence(
            newEvidence
        )
    ];


    const uniqueEvidence = [];
    const seen = new Set();


    for (const evidence of combined) {

        const key =
            `${evidence.source.toLowerCase()}|${evidence.description.toLowerCase()}`;


        if (seen.has(key)) {
            continue;
        }


        seen.add(key);

        uniqueEvidence.push(
            evidence
        );
    }


    return uniqueEvidence;
}


// --------------------------------------------------
// Detect configured/predefined triggers
// --------------------------------------------------

function detectTriggers(
    aiResult,
    triggers
) {

    const predefinedTriggers =
        getPredefinedTriggers(
            triggers
        );


    const aiDetectedTriggers =
        Array.isArray(
            aiResult?.detected_triggers
        )
            ? aiResult.detected_triggers
            : [];


    const detectedTriggerMap =
        new Map();


    for (
        const aiTrigger
        of aiDetectedTriggers
    ) {

        if (
            !aiTrigger ||
            typeof aiTrigger !== "object"
        ) {
            continue;
        }


        if (
            !aiTrigger.name ||
            typeof aiTrigger.name !== "string"
        ) {
            continue;
        }


        const predefinedTrigger =
            findPredefinedTrigger(
                aiTrigger.name,
                predefinedTriggers
            );


        /*
         * If the AI placed an unknown trigger inside
         * detected_triggers, do not treat it as a
         * predefined trigger.
         *
         * Unknown/new triggers belong in
         * additional_triggers.
         */
        if (!predefinedTrigger) {
            continue;
        }


        const key =
            predefinedTrigger.normalizedName;


        const evidence =
            normalizeEvidence(
                aiTrigger.evidence
            );


        /*
         * IMPORTANT:
         *
         * Ignore the AI-provided score for predefined
         * triggers.
         *
         * The configured score from triggers.json is
         * always authoritative.
         */
        if (
            detectedTriggerMap.has(key)
        ) {

            const existing =
                detectedTriggerMap.get(
                    key
                );


            existing.evidence =
                mergeEvidence(
                    existing.evidence,
                    evidence
                );


            continue;
        }


        detectedTriggerMap.set(
            key,
            {
                name:
                    predefinedTrigger.name,

                category:
                    predefinedTrigger.category,

                score:
                    predefinedTrigger.score,

                evidence:
                    evidence
            }
        );
    }


    return Array.from(
        detectedTriggerMap.values()
    );
}


// --------------------------------------------------
// Keep additional-trigger score inside 0–10
// --------------------------------------------------

function normalizeAdditionalScore(score) {

    const numericScore =
        Number(score);


    if (
        !Number.isFinite(
            numericScore
        )
    ) {
        return 0;
    }


    if (numericScore < 0) {
        return 0;
    }


    if (numericScore > 10) {
        return 10;
    }


    return numericScore;
}


// --------------------------------------------------
// Detect additional / newly discovered triggers
// --------------------------------------------------

function detectAdditionalTriggers(
    aiResult,
    triggers
) {

    const predefinedTriggers =
        getPredefinedTriggers(
            triggers
        );


    const aiAdditionalTriggers =
        Array.isArray(
            aiResult?.additional_triggers
        )
            ? aiResult.additional_triggers
            : [];


    const additionalTriggerMap =
        new Map();


    for (
        const aiTrigger
        of aiAdditionalTriggers
    ) {

        if (
            !aiTrigger ||
            typeof aiTrigger !== "object"
        ) {
            continue;
        }


        if (
            !aiTrigger.name ||
            typeof aiTrigger.name !== "string"
        ) {
            continue;
        }


        const triggerName =
            aiTrigger.name.trim();


        if (!triggerName) {
            continue;
        }


        const normalizedName =
            normalizeTriggerName(
                triggerName
            );


        /*
         * Check whether this "additional" trigger is
         * actually already configured.
         *
         * If it is configured, it must not be counted
         * again as an additional trigger.
         */
        const alreadyConfigured =
            predefinedTriggers.some(
                (trigger) =>
                    trigger.normalizedName ===
                    normalizedName
            );


        if (alreadyConfigured) {
            continue;
        }


        const category =
            normalizeCategory(
                aiTrigger.category
            );


        /*
         * Additional triggers must belong to one of
         * the three supported categories.
         */
        if (
            !VALID_CATEGORIES.includes(
                category
            )
        ) {
            continue;
        }


        const score =
            normalizeAdditionalScore(
                aiTrigger.score
            );


        const reason =
            typeof aiTrigger.reason === "string"
                ? aiTrigger.reason.trim()
                : "";


        const evidence =
            normalizeEvidence(
                aiTrigger.evidence
            );


        /*
         * Use category + normalized name as the key.
         *
         * This prevents the same AI-discovered trigger
         * from being counted multiple times.
         */
        const key =
            `${category}:${normalizedName}`;


        if (
            additionalTriggerMap.has(
                key
            )
        ) {

            const existing =
                additionalTriggerMap.get(
                    key
                );


            existing.evidence =
                mergeEvidence(
                    existing.evidence,
                    evidence
                );


            /*
             * Keep the stronger reason if the duplicate
             * provides a more detailed explanation.
             */
            if (
                reason.length >
                existing.reason.length
            ) {
                existing.reason =
                    reason;
            }


            /*
             * If duplicates somehow contain different
             * scores, keep the higher supported score.
             */
            if (
                score >
                existing.score
            ) {
                existing.score =
                    score;
            }


            continue;
        }


        additionalTriggerMap.set(
            key,
            {
                name:
                    triggerName,

                category:
                    category,

                score:
                    score,

                reason:
                    reason,

                evidence:
                    evidence
            }
        );
    }


    return Array.from(
        additionalTriggerMap.values()
    );
}


// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
    detectTriggers,
    detectAdditionalTriggers,
    getPredefinedTriggers,
    normalizeTriggerName,
    normalizeCategory
};
