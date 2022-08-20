// get everyone in the surrounding zip codes
exports.getCandidatesForMatching = (user) => {
    // for now just get everyone in the state
    let candidateSearchFilters = getCandidateSearchFilters(user);
    let candidateMatchingItems = getCandidates(candidateSearchFilters);
    if (candidateMatchingItems.length == 0) {
        candidateSearchFilters = getWiderCandidateSearchFilters(user);
        candidateMatchingItems = getCandidates(candidateSearchFilters);
        if (candidateMatchingItems.length == 0) {
            throw new Error("no candidates available for provided filters");
        }
    }
    candidateIDToScore = {};
    for (let i = 0; i < candidateMatchingItems.length; i++) {
        const candidate = candidateMatchingItems[i];
        // check if they have already been matched
        const candidateAlreadyMatched = getMatchByIDs(candidate, user);
        // if they have been matched in the last two weeks, ignore this candidate
        if (candidateAlreadyMatched &&
            timeInLastTwoWeeks(candidateAlreadyMatched.timeCreated)) {
            continue;
        }
        const candidateScore = scoreCandidate(candidate);
        candidateIDToScore[candidate.id] = candidateScore;
    }
    // sort candidates and pick the first one
};
// get user_dating_match_preferences
exports.getCandidateSearchFilters = (user) => {
};
//# sourceMappingURL=match-controller.js.map