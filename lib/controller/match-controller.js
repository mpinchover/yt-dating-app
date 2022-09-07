"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fast_levenshtein_1 = require("fast-levenshtein");
class MatchController {
    constructor(p) {
        this.getCandidatesForUser = async (user) => {
            let candidateMatchingItems = await this.getCandidateMatchingItems(user);
            if (candidateMatchingItems.length == 0) {
                throw new Error("no candidates available for provided filters");
            }
            let userMatchingItem = this.generateUserMatchingItem(user);
            // sanitize the text
            userMatchingItem = this.prepareMatchingItem(userMatchingItem);
            for (let i = 0; i < candidateMatchingItems.length; i++) {
                candidateMatchingItems[i] = this.prepareMatchingItem(candidateMatchingItems[i]);
            }
            const scoredCandidates = this.scoreCandidates(userMatchingItem, candidateMatchingItems);
            const topCandidates = this.getTopCandidates(scoredCandidates);
            if (topCandidates.length > 5)
                return topCandidates.slice(0, 5);
            return topCandidates;
        };
        // return top user uuids
        this.getTopCandidates = (scoredCandidates) => {
            // sort by value
            const topScoredCandidates = [...scoredCandidates.keys()].sort((a, b) => scoredCandidates[b] - scoredCandidates[a]);
            return topScoredCandidates;
        };
        this.generateUserMatchingItem = (user) => {
            const res = {
                userUuid: user.uuid,
                videoEntities: user.videoEntities,
            };
            return res;
        };
        this.getCandidateMatchingItems = async (user) => {
            // first get candidates that have already been matched to this user
            // then get the candidates that have been blocked by this user
            // make sure to get prefernces that do not show either of those
            const alreadyMatchedUserUUIDs = await this.repo.getUserUuidsMatchedToUuid(user.uuid);
            const blockedByUserUUIDs = await this.repo.getUsersWhoBlockedThisUuid(user.uuid);
            const userUUIDsToFilterOut = [
                ...alreadyMatchedUserUUIDs,
                ...blockedByUserUUIDs,
            ];
            const uDatingPref = await this.repo.getDatingPreferencesByUuid(user.uuid);
            user.userDatingPreference = uDatingPref;
            const searchFilter = this.createSearchFilter(user, userUUIDsToFilterOut);
            const candidateProfiles = await this.repo.getUserProfileEntities(searchFilter);
            const candidateMatchingItems = [];
            for (const candidateProfile of candidateProfiles) {
                const matchingItem = this.generateUserMatchingItem(candidateProfile);
                candidateMatchingItems.push(matchingItem);
            }
            return candidateMatchingItems;
        };
        this.createSearchFilter = (user, userUuidsToFilterOut) => {
            const filter = {
                gender: user.userDatingPreference.gender,
                genderPreference: user.userDatingPreference.genderPreference,
                age: user.userDatingPreference.age,
                ageMinPreference: user.userDatingPreference.ageMinPreference,
                ageMaxPreference: user.userDatingPreference.ageMaxPreference,
                userUuidsToFilterOut: userUuidsToFilterOut,
            };
            return filter;
        };
        this.scoreCandidates = (userMatchingItem, candidateMatchingItems) => {
            const scores = new Map();
            const userVideoDescription = this.getAllTextDescriptionFromVideoEntities(userMatchingItem.videoEntities);
            const userVideoTitle = this.getAllTextTitleFromVideoEntities(userMatchingItem.videoEntities);
            const userChannelIds = this.getChannelIds(userMatchingItem.videoEntities);
            const userCategoryIds = this.getCategoryIds(userMatchingItem.videoEntities);
            const userCategoryTopics = this.getCategoryTopics(userMatchingItem.videoEntities);
            for (let i = 0; i < candidateMatchingItems.length; i++) {
                const candidate = candidateMatchingItems[i];
                const cUUID = candidate.userUuid;
                scores.set(cUUID, 0);
                const candidateVideoEntities = candidate.videoEntities;
                const candidateVideoDescription = this.getAllTextDescriptionFromVideoEntities(candidateVideoEntities);
                const candidateVideoTitle = this.getAllTextTitleFromVideoEntities(candidate.videoEntities);
                const videoDescriptionScore = this.scoreVideoDescriptions(userVideoDescription, candidateVideoDescription);
                scores.set(candidate.userUuid, scores.get(cUUID) + videoDescriptionScore);
                const videoTitleScore = this.scoreVideoTitles(userVideoTitle, candidateVideoTitle);
                scores.set(candidate.userUuid, scores.get(cUUID) + videoTitleScore);
                // remember to do null checks everywhere
                const candidateChannelIds = this.getChannelIds(candidate.videoEntities);
                const channelIDScore = this.scoreChannelID(userChannelIds, candidateChannelIds);
                scores.set(candidate.userUuid, scores.get(cUUID) + channelIDScore);
                const candidateCategoryIds = this.getCategoryIds(candidate.videoEntities);
                const categoryIDScore = this.scoreCategoryID(userCategoryIds, candidateCategoryIds);
                scores.set(candidate.userUuid, scores.get(cUUID) + categoryIDScore);
                const candidateCategoryTopics = this.getCategoryTopics(candidate.videoEntities);
                const categoryTopicScore = this.scoreCategoryTopic(userCategoryTopics, candidateCategoryTopics);
                scores.set(cUUID, scores.get(cUUID) + categoryTopicScore);
            }
            return scores;
        };
        this.getCategoryTopics = (videoEntities) => {
            const topics = [];
            videoEntities.forEach((v) => {
                v.topicCategories.forEach((topic) => {
                    topics.push(topic);
                });
            });
            return topics;
        };
        this.getChannelIds = (videoEntities) => {
            const channelIds = [];
            videoEntities.forEach((v) => {
                channelIds.push(v.channelId);
            });
            return channelIds;
        };
        this.getCategoryIds = (videoEntities) => {
            const ids = [];
            videoEntities.forEach((v) => {
                ids.push(v.categoryId);
            });
            return ids;
        };
        this.numSameChannelId = (userChannelId, candidateChannelId) => {
            let count = 0;
            userChannelId.forEach((u) => {
                candidateChannelId.forEach((c) => {
                    if (u === c) {
                        count++;
                    }
                });
            });
            return count;
        };
        // return a count for how many times the category ids are equal
        this.numSameCategoryId = (userCategoryId, candidateCategoryId) => {
            let count = 0;
            userCategoryId.forEach((u) => {
                candidateCategoryId.forEach((c) => {
                    if (u === c) {
                        count++;
                    }
                });
            });
            return count;
        };
        // returns an array of strings, where each string is a description of a video
        this.getAllTextDescriptionFromVideoEntities = (videos) => {
            const videoDescriptions = [];
            videos.forEach((video) => {
                const videoDescription = this.getAllTextDescriptionFromVideoEntity(video);
                if (videoDescription || videoDescription.length > 0)
                    videoDescriptions.push(videoDescription);
            });
            return videoDescriptions;
        };
        this.getAllTextDescriptionFromVideoEntity = (video) => {
            if (!video.description || video.description === "")
                return "";
            const description = video.description.toLowerCase();
            return description;
        };
        // returns an array of strings where each string is title of a video
        this.getAllTextTitleFromVideoEntities = (videos) => {
            const videoTitles = [];
            videos.forEach((video) => {
                const videoTitle = this.getAllTextDescriptionFromVideoEntity(video);
                if (videoTitle.length > 0)
                    videoTitles.push(videoTitle);
            });
            return videoTitles;
        };
        this.getAllTextTitleFromVideoEntity = (video) => {
            if (!video.videoTitle || video.videoTitle === "")
                return "";
            const videoTitle = video.videoTitle.toLowerCase();
            return videoTitle;
        };
        // you want to make sure you are filtering out anything not alphanumeric
        // maybe even filter out words like 'a', 'and',
        // do levenshtein distance
        // these are currently lists of strings
        this.scoreVideoDescriptions = (uText, cText) => {
            const uMap = new Map();
            const cMap = new Map();
            for (const desc of uText) {
                const words = desc.split(" ");
                for (const w of words) {
                    if (!uMap.has(w))
                        uMap.set(w, 0);
                    uMap.set(w, uMap.get(w) + 1);
                }
            }
            for (const desc of cText) {
                const words = desc.split(" ");
                for (const w of words) {
                    if (!cMap.has(w))
                        cMap.set(w, 0);
                    cMap.set(w, cMap.get(w) + 1);
                }
            }
            let count = 0;
            for (const key of uMap.keys()) {
                // if they both had this word, then take the max of how often it was repeated in one
                if (cMap.has(key))
                    count += Math.max(uMap[key], cMap[key]);
            }
            return count;
        };
        this.scoreVideoTitles = (uText, cText) => {
            return this.scoreVideoDescriptions(uText, cText);
        };
        // score % of how many channels are the same
        this.scoreChannelID = (uChannelIDs, cChannelIDs) => {
            if (uChannelIDs.length == 0 || cChannelIDs.length == 0)
                return 0;
            const numSameChannel = this.numSameChannelId(uChannelIDs, cChannelIDs);
            return numSameChannel / Math.max(uChannelIDs.length, cChannelIDs.length);
        };
        // score % of how many category ids are the same
        this.scoreCategoryID = (uCategoryIDs, cCategoryIDs) => {
            if (uCategoryIDs.length == 0 || cCategoryIDs.length == 0)
                return 0;
            const numSameChannel = this.numSameCategoryId(uCategoryIDs, cCategoryIDs);
            return numSameChannel / Math.max(uCategoryIDs.length, cCategoryIDs.length);
        };
        // score % of how many category topics are the same
        this.scoreCategoryTopic = (uCategoryTopics, cCategoryTopics) => {
            if (uCategoryTopics.length == 0 || cCategoryTopics.length == 0)
                return 0;
            const numSameChannel = this.numSameCategoryTopic(uCategoryTopics, cCategoryTopics);
            return (numSameChannel / Math.max(uCategoryTopics.length, cCategoryTopics.length));
        };
        this.numSameCategoryTopic = (userCategoryId, candidateCategoryId) => {
            let count = 0;
            userCategoryId.forEach((u) => {
                candidateCategoryId.forEach((c) => {
                    const levScore = fast_levenshtein_1.default.get(u, c);
                    if (levScore < 2)
                        count++; // they are similar words
                });
            });
            return count;
        };
        this.prepareMatchingItem = (matchingItem) => {
            for (let i = 0; i < matchingItem.videoEntities.length; i++) {
                const videoEntity = matchingItem.videoEntities[i];
                videoEntity.description = this.sanitizeMatchingItemText(videoEntity.description.split(" "));
                videoEntity.videoTitle = this.sanitizeMatchingItemText(videoEntity.videoTitle.split(" "));
                matchingItem.videoEntities[i] = videoEntity;
            }
            return matchingItem;
        };
        this.sanitizeMatchingItemText = (text) => {
            const sanitizedWords = [];
            const regex = /[^A-Za-z0-9]/g;
            for (let w of text) {
                if (!wordsSet.has(w)) {
                    w.replace(regex, "");
                    sanitizedWords.push(w);
                }
            }
            return sanitizedWords.join(" ");
        };
        this.repo = p.repo;
    }
}
const wordsSet = new Set([
    "and",
    "the",
    "a",
    "that",
    "this",
    "it",
    "in",
    "for",
]);
//# sourceMappingURL=match-controller.js.map