/**
 * AI Website Screening Agent
 * --------------------------------------------------
 * AI Output Validator
 *
 * Responsibilities:
 *
 * 1. Validate the main AI response structure.
 * 2. Validate company information fields.
 * 3. Validate detected triggers.
 * 4. Validate additional triggers.
 * 5. Validate trigger evidence.
 * 6. Validate top-level evidence.
 * 7. Validate categories and scores.
 * 8. Validate confidence values.
 *
 * This validator does NOT calculate company scores.
 * It only checks whether the AI response is safe
 * and structurally usable by the rest of the pipeline.
 */


// --------------------------------------------------
// Supported trigger categories
// --------------------------------------------------

const VALID_TRIGGER_CATEGORIES = [
    "growth",
    "pain_point",
    "workflow_tool"
];


// --------------------------------------------------
// Supported confidence values
// --------------------------------------------------

const VALID_CONFIDENCE_VALUES = [
    "High",
    "Medium",
    "Low"
];


// --------------------------------------------------
// Required top-level fields
// --------------------------------------------------

const REQUIRED_FIELDS = [
    "website",
    "company",
    "business_type",
    "services",
    "team_size",
    "detected_triggers",
    "additional_triggers",
    "evidence",
    "reason",
    "confidence"
];


// --------------------------------------------------
// Fields the AI must NOT return
// --------------------------------------------------

const FORBIDDEN_SCORE_FIELDS = [
    "company_score",
    "final_company_score",
    "overall_score",
    "total_score",
    "screening_score"
];


// --------------------------------------------------
// Helper: check non-empty string
// --------------------------------------------------

function isNonEmptyString(value) {

    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}


// --------------------------------------------------
// Validate one evidence object
// --------------------------------------------------

function validateEvidenceItem(
    evidence,
    context
) {

    const errors = [];


    if (
        !evidence ||
        typeof evidence !== "object" ||
        Array.isArray(evidence)
    ) {

        errors.push(
            `${context}: evidence item must be an object.`
        );

        return errors;
    }


    if (
        !isNonEmptyString(
            evidence.source
        )
    ) {

        errors.push(
            `${context}: evidence source is required.`
        );
    }


    if (
        !isNonEmptyString(
            evidence.description
        )
    ) {

        errors.push(
            `${context}: evidence description is required.`
        );
    }


    return errors;
}


// --------------------------------------------------
// Validate evidence array
// --------------------------------------------------

function validateEvidenceArray(
    evidence,
    context,
    requireEvidence = false
) {

    const errors = [];


    if (!Array.isArray(evidence)) {

        errors.push(
            `${context}: evidence must be an array.`
        );

        return errors;
    }


    if (
        requireEvidence &&
        evidence.length === 0
    ) {

        errors.push(
            `${context}: at least one evidence item is required.`
        );
    }


    evidence.forEach(
        (item, index) => {

            errors.push(
                ...validateEvidenceItem(
                    item,
                    `${context} evidence[${index}]`
                )
            );

        }
    );


    return errors;
}


// --------------------------------------------------
// Validate predefined trigger
// --------------------------------------------------

function validateDetectedTrigger(
    trigger,
    index
) {

    const errors = [];

    const context =
        `detected_triggers[${index}]`;


    if (
        !trigger ||
        typeof trigger !== "object" ||
        Array.isArray(trigger)
    ) {

        errors.push(
            `${context}: trigger must be an object.`
        );

        return errors;
    }


    // Trigger name

    if (
        !isNonEmptyString(
            trigger.name
        )
    ) {

        errors.push(
            `${context}: trigger name is required.`
        );
    }


    // Category

    if (
        !VALID_TRIGGER_CATEGORIES.includes(
            trigger.category
        )
    ) {

        errors.push(
            `${context}: invalid category "${trigger.category}".`
        );
    }


    // Score

    if (
        typeof trigger.score !== "number" ||
        !Number.isFinite(trigger.score) ||
        trigger.score < 0 ||
        trigger.score > 10
    ) {

        errors.push(
            `${context}: score must be a number between 0 and 10.`
        );
    }


    // Evidence

    errors.push(
        ...validateEvidenceArray(
            trigger.evidence,
            context,
            true
        )
    );


    return errors;
}


// --------------------------------------------------
// Validate additional trigger
// --------------------------------------------------

function validateAdditionalTrigger(
    trigger,
    index
) {

    const errors = [];

    const context =
        `additional_triggers[${index}]`;


    if (
        !trigger ||
        typeof trigger !== "object" ||
        Array.isArray(trigger)
    ) {

        errors.push(
            `${context}: trigger must be an object.`
        );

        return errors;
    }


    // Trigger name

    if (
        !isNonEmptyString(
            trigger.name
        )
    ) {

        errors.push(
            `${context}: trigger name is required.`
        );
    }


    // Category

    if (
        !VALID_TRIGGER_CATEGORIES.includes(
            trigger.category
        )
    ) {

        errors.push(
            `${context}: invalid category "${trigger.category}".`
        );
    }


    // Score

    if (
        typeof trigger.score !== "number" ||
        !Number.isFinite(trigger.score) ||
        trigger.score < 0 ||
        trigger.score > 10
    ) {

        errors.push(
            `${context}: score must be a number between 0 and 10.`
        );
    }


    // Reason

    if (
        !isNonEmptyString(
            trigger.reason
        )
    ) {

        errors.push(
            `${context}: reason is required.`
        );
    }


    // Evidence

    errors.push(
        ...validateEvidenceArray(
            trigger.evidence,
            context,
            true
        )
    );


    return errors;
}


// --------------------------------------------------
// Validate services array
// --------------------------------------------------

function validateServices(
    services
) {

    const errors = [];


    if (!Array.isArray(services)) {

        errors.push(
            "services must be an array."
        );

        return errors;
    }


    services.forEach(
        (service, index) => {

            if (
                !isNonEmptyString(
                    service
                )
            ) {

                errors.push(
                    `services[${index}] must be a non-empty string.`
                );
            }

        }
    );


    return errors;
}


// --------------------------------------------------
// Check duplicate triggers
// --------------------------------------------------

function validateDuplicateTriggers(
    triggers,
    fieldName
) {

    const errors = [];
    const seen = new Set();


    if (!Array.isArray(triggers)) {
        return errors;
    }


    triggers.forEach(
        (trigger, index) => {

            if (
                !trigger ||
                !isNonEmptyString(
                    trigger.name
                )
            ) {
                return;
            }


            const key =
                trigger.name
                    .trim()
                    .toLowerCase();


            if (seen.has(key)) {

                errors.push(
                    `${fieldName}[${index}]: duplicate trigger "${trigger.name}".`
                );

            } else {

                seen.add(key);

            }

        }
    );


    return errors;
}


// --------------------------------------------------
// Validate complete screening result
// --------------------------------------------------

function validateScreeningResult(
    result
) {

    const errors = [];


    // --------------------------------------------------
    // Result must be an object
    // --------------------------------------------------

    if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
    ) {

        return {
            valid: false,
            errors: [
                "Screening result must be an object."
            ]
        };
    }


    // --------------------------------------------------
    // Required fields
    // --------------------------------------------------

    for (
        const field
        of REQUIRED_FIELDS
    ) {

        if (
            result[field] === undefined ||
            result[field] === null
        ) {

            errors.push(
                `Missing field: ${field}`
            );
        }
    }


    /*
     * Stop here if required fields are missing.
     * This prevents later validation from producing
     * confusing secondary errors.
     */
    if (errors.length > 0) {

        return {
            valid: false,
            errors
        };
    }


    // --------------------------------------------------
    // AI must not calculate final company score
    // --------------------------------------------------

    for (
        const field
        of FORBIDDEN_SCORE_FIELDS
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                result,
                field
            )
        ) {

            errors.push(
                `Forbidden AI field returned: ${field}`
            );
        }
    }


    // --------------------------------------------------
    // Website
    // --------------------------------------------------

    if (
        !isNonEmptyString(
            result.website
        )
    ) {

        errors.push(
            "website must be a non-empty string."
        );
    }


    // --------------------------------------------------
    // Company
    // --------------------------------------------------

    if (
        !isNonEmptyString(
            result.company
        )
    ) {

        errors.push(
            "company must be a non-empty string."
        );
    }


    // --------------------------------------------------
    // Business type
    // --------------------------------------------------

    if (
        !isNonEmptyString(
            result.business_type
        )
    ) {

        errors.push(
            "business_type must be a non-empty string."
        );
    }


    // --------------------------------------------------
    // Services
    // --------------------------------------------------

    errors.push(
        ...validateServices(
            result.services
        )
    );


    // --------------------------------------------------
    // Team size
    // --------------------------------------------------

    if (
        !isNonEmptyString(
            result.team_size
        )
    ) {

        errors.push(
            "team_size must be a non-empty string."
        );
    }


    // --------------------------------------------------
    // Detected triggers
    // --------------------------------------------------

    if (
        !Array.isArray(
            result.detected_triggers
        )
    ) {

        errors.push(
            "detected_triggers must be an array."
        );

    } else {

        result.detected_triggers.forEach(
            (trigger, index) => {

                errors.push(
                    ...validateDetectedTrigger(
                        trigger,
                        index
                    )
                );

            }
        );


        errors.push(
            ...validateDuplicateTriggers(
                result.detected_triggers,
                "detected_triggers"
            )
        );
    }


    // --------------------------------------------------
    // Additional triggers
    // --------------------------------------------------

    if (
        !Array.isArray(
            result.additional_triggers
        )
    ) {

        errors.push(
            "additional_triggers must be an array."
        );

    } else {

        result.additional_triggers.forEach(
            (trigger, index) => {

                errors.push(
                    ...validateAdditionalTrigger(
                        trigger,
                        index
                    )
                );

            }
        );


        errors.push(
            ...validateDuplicateTriggers(
                result.additional_triggers,
                "additional_triggers"
            )
        );
    }


    // --------------------------------------------------
    // Top-level evidence
    // --------------------------------------------------

    errors.push(
        ...validateEvidenceArray(
            result.evidence,
            "top-level",
            false
        )
    );


    // --------------------------------------------------
    // Overall reason
    // --------------------------------------------------

    if (
        !isNonEmptyString(
            result.reason
        )
    ) {

        errors.push(
            "reason must be a non-empty string."
        );
    }


    // --------------------------------------------------
    // Confidence
    // --------------------------------------------------

    if (
        !VALID_CONFIDENCE_VALUES.includes(
            result.confidence
        )
    ) {

        errors.push(
            "confidence must be High, Medium, or Low."
        );
    }


    // --------------------------------------------------
    // Return validation result
    // --------------------------------------------------

    return {
        valid:
            errors.length === 0,

        errors
    };
}


// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
    validateScreeningResult,
    validateEvidenceItem,
    validateEvidenceArray,
    validateDetectedTrigger,
    validateAdditionalTrigger
};
