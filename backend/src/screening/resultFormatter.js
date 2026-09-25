/*
 * Screening Result Formatter
 *
 * This module converts the internal screening result
 * into a clean structure that can later be written
 * to the output CSV file.
 *
 * Keeping this logic separate makes the application
 * easier to maintain and modify.
 */


/*
 * Format one company's screening result.
 */
function formatScreeningResult(
    company,
    aiResult,
    detectedTriggers,
    additionalTriggers,
    companyScore
) {

    return {

        /*
         * Original company information
         */
        id: company.id || "",
        website: company.website || "",


        /*
         * Company information discovered by AI
         */
        company: aiResult.company || "",
        business_type:
            aiResult.business_type || "",

        services:
            Array.isArray(aiResult.services)
                ? aiResult.services.join(", ")
                : "",

        team_size:
            aiResult.team_size || "Unknown",


        /*
         * Trigger information
         */
        detected_triggers:
            JSON.stringify(
                detectedTriggers
            ),

        additional_triggers:
            JSON.stringify(
                additionalTriggers
            ),


        /*
         * Final calculated company score
         */
        company_score:
            companyScore,


        /*
         * Supporting information
         */
        evidence:
            JSON.stringify(
                aiResult.evidence || []
            ),

        reason:
            aiResult.reason || "",

        confidence:
            aiResult.confidence || ""

    };
}


module.exports = {
    formatScreeningResult
};