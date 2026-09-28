const {
    isValidSourceUrl,
    normalizeSourceUrl,
    validateEvidenceArray
} = require("./outputValidator");


function isNonEmptyString(value) {

    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}


function validateEvidenceProvenance(
    evidence,
    context,
    allowedSourceUrls
) {

    const errors = [];

    if (!Array.isArray(evidence)) {
        return errors;
    }

    const allowed =
        new Set(
            (allowedSourceUrls || [])
                .filter(
                    isValidSourceUrl
                )
                .map(
                    normalizeSourceUrl
                )
        );

    evidence.forEach(
        (item, index) => {

            if (
                isValidSourceUrl(
                    item?.source
                ) &&
                !allowed.has(
                    normalizeSourceUrl(
                        item.source
                    )
                )
            ) {

                errors.push(
                    `${context} evidence[${index}]: source URL was not present in the supplied research.`
                );
            }
        }
    );

    return errors;
}


function validateCustomScore(
    score,
    context = "score",
    allowedSourceUrls = []
) {

    const errors = [];

    if (
        !score ||
        typeof score !== "object" ||
        Array.isArray(score)
    ) {

        return {
            valid:
                false,
            errors: [
                `${context} must be an object.`
            ]
        };
    }

    if (
        typeof score.value !== "number" ||
        !Number.isFinite(score.value) ||
        score.value < 0 ||
        score.value > 10
    ) {

        errors.push(
            `${context}.value must be a number between 0 and 10.`
        );
    }

    if (score.max !== 10) {

        errors.push(
            `${context}.max must be exactly 10.`
        );
    }

    if (!isNonEmptyString(score.reason)) {

        errors.push(
            `${context}.reason is required.`
        );
    }

    errors.push(
        ...validateEvidenceArray(
            score.evidence,
            context,
            false
        ),
        ...validateEvidenceProvenance(
            score.evidence,
            context,
            allowedSourceUrls
        )
    );

    return {
        valid:
            errors.length === 0,
        errors
    };
}


function validateCustomQueryResult(
    result,
    options = {}
) {

    const errors = [];

    if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
    ) {

        return {
            valid:
                false,
            errors: [
                "Custom query result must be an object."
            ]
        };
    }

    const allowedFields =
        new Set([
            "company",
            "website",
            "answers",
            "score"
        ]);

    Object.keys(result).forEach(
        (field) => {

            if (!allowedFields.has(field)) {

                errors.push(
                    `Unexpected custom query field: ${field}`
                );
            }
        }
    );

    if (!isNonEmptyString(result.company)) {
        errors.push(
            "company must be a non-empty string."
        );
    }

    if (!isValidSourceUrl(result.website)) {
        errors.push(
            "website must be an absolute HTTP(S) URL."
        );
    }

    if (
        !Array.isArray(result.answers) ||
        result.answers.length === 0
    ) {

        errors.push(
            "answers must contain at least one answer."
        );

    } else {

        result.answers.forEach(
            (answer, index) => {

                const context =
                    `answers[${index}]`;

                if (
                    !answer ||
                    typeof answer !== "object" ||
                    Array.isArray(answer)
                ) {

                    errors.push(
                        `${context} must be an object.`
                    );

                    return;
                }

                if (!isNonEmptyString(answer.question)) {
                    errors.push(
                        `${context}.question is required.`
                    );
                }

                if (!isNonEmptyString(answer.answer)) {
                    errors.push(
                        `${context}.answer is required.`
                    );
                }

                errors.push(
                    ...validateEvidenceArray(
                        answer.evidence,
                        context,
                        false
                    ),
                    ...validateEvidenceProvenance(
                        answer.evidence,
                        context,
                        options.allowedSourceUrls
                    )
                );
            }
        );
    }

    if (
        !Object.prototype.hasOwnProperty.call(
            result,
            "score"
        )
    ) {

        errors.push(
            "Missing field: score"
        );

    } else if (options.requireScore) {

        const scoreValidation =
            validateCustomScore(
                result.score,
                "score",
                options.allowedSourceUrls
            );

        errors.push(
            ...scoreValidation.errors
        );

    } else if (
        result.score !== null &&
        result.score !== undefined
    ) {

        errors.push(
            "score must be null when custom scoring was not requested."
        );
    }

    return {
        valid:
            errors.length === 0,
        errors
    };
}


module.exports = {
    validateCustomQueryResult,
    validateCustomScore,
    validateEvidenceProvenance
};
