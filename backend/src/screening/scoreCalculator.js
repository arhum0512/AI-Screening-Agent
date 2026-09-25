function calculateCompanyScore(detectedTriggers, additionalTriggers) {
    const allTriggers = [
        ...(detectedTriggers || []),
        ...(additionalTriggers || [])
    ];

    if (allTriggers.length === 0) {
        return 0;
    }

    const totalScore = allTriggers.reduce((total, trigger) => {
        return total + Number(trigger.score || 0);
    }, 0);

    const averageScore = totalScore / allTriggers.length;

    return Number(averageScore.toFixed(2));
}

module.exports = {
    calculateCompanyScore
};