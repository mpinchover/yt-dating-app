import { UserEntity, DatingMatchPreferencesEntity } from "../types/user";
import {
  UserMatchingItemEntity,
  UserProfileSearchFilterRecord,
} from "../types/match";
import { VideoEntity } from "../types/video";
import {
  getDatingPreferencesByUuid,
  getUserUUIDsMatchedToUUID,
  getUserUUIDsBlockedByUserUUID,
  getUserProfileEntities,
} from "../database/user";
import levenshtein from "fast-levenshtein";
import { userRecordConstructor } from "firebase-functions/v1/auth";

exports.getCandidatesForUser = async (user: UserEntity) => {
  let candidateMatchingItems = await getCandidateMatchingItems(user);
  if (candidateMatchingItems.length == 0) {
    throw new Error("no candidates available for provided filters");
  }

  let userMatchingItem = generateUserMatchingItem(user);

  // sanitize the text
  userMatchingItem = prepareMatchingItem(userMatchingItem);

  for (let i = 0; i < candidateMatchingItems.length; i++) {
    candidateMatchingItems[i] = prepareMatchingItem(candidateMatchingItems[i]);
  }

  const scoredCandidates: Map<string, number> = scoreCandidates(
    userMatchingItem,
    candidateMatchingItems
  );

  const topCandidates = getTopCandidates(scoredCandidates);
  if (topCandidates.length > 5) return topCandidates.slice(0, 5);
  return topCandidates;
};

// return top user uuids
const getTopCandidates = (scoredCandidates: Map<string, number>): string[] => {
  // sort by value
  const topScoredCandidates: string[] = [...scoredCandidates.keys()].sort(
    (a, b) => scoredCandidates[b] - scoredCandidates[a]
  );
  return topScoredCandidates;
};

export const generateUserMatchingItem = (
  user: UserEntity
): UserMatchingItemEntity => {
  const res: UserMatchingItemEntity = {
    userUUID: user.UUID,
    videoEntities: user.videoEntities,
  };
  return res;
};

export const getCandidateMatchingItems = async (
  user: UserEntity
): Promise<UserMatchingItemEntity[]> => {
  // first get candidates that have already been matched to this user
  // then get the candidates that have been blocked by this user
  // make sure to get prefernces that do not show either of those

  const alreadyMatchedUserUUIDs: string[] = await getUserUUIDsMatchedToUUID(
    user.UUID
  );
  const blockedByUserUUIDs: string[] = await getUserUUIDsBlockedByUserUUID(
    user.UUID
  );

  const userUUIDsToFilterOut: string[] = [
    ...alreadyMatchedUserUUIDs,
    ...blockedByUserUUIDs,
  ];

  const uDatingPref = await getDatingPreferencesByUuid(user.UUID);
  user.userDatingPreference = uDatingPref;
  const searchFilter: UserProfileSearchFilterRecord = createSearchFilter(
    user,
    userUUIDsToFilterOut
  );

  const candidateProfiles: UserEntity[] = await getUserProfileEntities(
    searchFilter
  );

  const candidateMatchingItems: UserMatchingItemEntity[] = [];
  for (const candidateProfile of candidateProfiles) {
    const matchingItem = generateUserMatchingItem(candidateProfile);
    candidateMatchingItems.push(matchingItem);
  }
  return candidateMatchingItems;
};

const createSearchFilter = (
  user: UserEntity,
  userUUIDsToFilterOut: string[]
): UserProfileSearchFilterRecord => {
  const filter: UserProfileSearchFilterRecord = {
    gender: user.userDatingPreference.gender,
    genderPreference: user.userDatingPreference.genderPreference,
    age: user.userDatingPreference.age,
    ageMinPreference: user.userDatingPreference.ageMinPreference,
    ageMaxPreference: user.userDatingPreference.ageMaxPreference,
    userUUIDsToFilterOut: userUUIDsToFilterOut,
  };
  return filter;
};

export const scoreCandidates = (
  userMatchingItem: UserMatchingItemEntity,
  candidateMatchingItems: UserMatchingItemEntity[]
): Map<string, number> => {
  const scores = new Map<string, number>();

  const userVideoDescription = getAllTextDescriptionFromVideoEntities(
    userMatchingItem.videoEntities
  );
  const userVideoTitle = getAllTextTitleFromVideoEntities(
    userMatchingItem.videoEntities
  );
  const userChannelIds = [];
  userMatchingItem.videoEntities.forEach((v) => {
    userChannelIds.push(v.channelId);
  });
  const userCategoryIds = [];
  userMatchingItem.videoEntities.forEach((v) => {
    userCategoryIds.push(v.categoryId);
  });
  const userCategoryTopics = [];
  userMatchingItem.videoEntities.forEach((v) => {
    v.topicCategories.forEach((topic) => {
      userCategoryTopics.push(topic);
    });
  });

  for (let i = 0; i < candidateMatchingItems.length; i++) {
    const candidate = candidateMatchingItems[i];
    const cUUID = candidate.userUUID;

    scores.set(cUUID, 0);

    const candidateVideoEntities = candidate.videoEntities;
    const candidateVideoDescription = getAllTextDescriptionFromVideoEntities(
      candidateVideoEntities
    );
    const candidateVideoTitle = getAllTextTitleFromVideoEntities(
      candidate.videoEntities
    );

    const videoDescriptionScore = scoreVideoDescriptions(
      userVideoDescription,
      candidateVideoDescription
    );
    scores.set(candidate.userUUID, scores.get(cUUID) + videoDescriptionScore);

    const videoTitleScore = scoreVideoTitles(
      userVideoTitle,
      candidateVideoTitle
    );
    scores.set(candidate.userUUID, scores.get(cUUID) + videoTitleScore);

    // remember to do null checks everywhere
    const candidateChannelIds = [];
    candidate.videoEntities.forEach((v) => {
      candidateChannelIds.push(v.channelId);
    });
    const channelIDScore = scoreChannelID(userChannelIds, candidateChannelIds);
    scores.set(candidate.userUUID, scores.get(cUUID) + channelIDScore);

    const candidateCategoryIds = [];
    candidate.videoEntities.forEach((v) => {
      candidateCategoryIds.push(v.categoryId);
    });

    const categoryIDScore = scoreCategoryID(
      userCategoryIds,
      candidateCategoryIds
    );
    scores.set(candidate.userUUID, scores.get(cUUID) + categoryIDScore);

    const candidateCategoryTopics = [];
    candidate.videoEntities.forEach((v) => {
      v.topicCategories.forEach((topic) => {
        candidateCategoryTopics.push(topic);
      });
    });

    const categoryTopicScore = scoreCategoryTopic(
      userCategoryTopics,
      candidateCategoryTopics
    );
    scores.set(cUUID, scores.get(cUUID) + categoryTopicScore);
  }
  return scores;
};

// return a count for how many times the channel id is the same
const numSameChannelId = (
  userChannelId: string[],
  candidateChannelId: string[]
) => {
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
const numSameCategoryId = (
  userCategoryId: number[],
  candidateCategoryId: number[]
) => {
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
export const getAllTextDescriptionFromVideoEntities = (
  videos: VideoEntity[]
): string[] => {
  const videoDescriptions: string[] = [];
  videos.forEach((video) => {
    const videoDescription = getAllTextDescriptionFromVideoEntity(video);
    if (videoDescription || videoDescription.length > 0)
      videoDescriptions.push(videoDescription);
  });
  return videoDescriptions;
};

export const getAllTextDescriptionFromVideoEntity = (
  video: VideoEntity
): string => {
  if (!video.description || video.description === "") return "";
  const description = video.description.toLowerCase();
  return description;
};

// returns an array of strings where each string is title of a video
export const getAllTextTitleFromVideoEntities = (
  videos: VideoEntity[]
): string[] => {
  const videoTitles: string[] = [];
  videos.forEach((video) => {
    const videoTitle = getAllTextDescriptionFromVideoEntity(video);
    if (videoTitle.length > 0) videoTitles.push(videoTitle);
  });
  return videoTitles;
};

export const getAllTextTitleFromVideoEntity = (video: VideoEntity): string => {
  if (!video.videoTitle || video.videoTitle === "") return "";
  const videoTitle = video.videoTitle.toLowerCase();
  return videoTitle;
};

// you want to make sure you are filtering out anything not alphanumeric
// maybe even filter out words like 'a', 'and',
// do levenshtein distance
// these are currently lists of strings
const scoreVideoDescriptions = (uText: string[], cText: string[]): number => {
  const uMap = new Map();
  const cMap = new Map();

  for (const desc of uText) {
    const words = desc.split(" ");
    for (const w of words) {
      if (!uMap.has(w)) uMap.set(w, 0);
      uMap.set(w, uMap.get(w) + 1);
    }
  }

  for (const desc of cText) {
    const words = desc.split(" ");
    for (const w of words) {
      if (!cMap.has(w)) cMap.set(w, 0);
      cMap.set(w, cMap.get(w) + 1);
    }
  }

  let count = 0;
  for (const key of uMap.keys()) {
    // if they both had this word, then take the max of how often it was repeated in one
    if (cMap.has(key)) count += Math.max(uMap[key], cMap[key]);
  }
  return count;
};

const scoreVideoTitles = (uText: string[], cText: string[]): number => {
  return scoreVideoDescriptions(uText, cText);
};

// score % of how many channels are the same
const scoreChannelID = (
  uChannelIDs: string[],
  cChannelIDs: string[]
): number => {
  if (uChannelIDs.length == 0 || cChannelIDs.length == 0) return 0;
  const numSameChannel = numSameChannelId(uChannelIDs, cChannelIDs);

  return numSameChannel / Math.max(uChannelIDs.length, cChannelIDs.length);
};

// score % of how many category ids are the same
const scoreCategoryID = (
  uCategoryIDs: number[],
  cCategoryIDs: number[]
): number => {
  if (uCategoryIDs.length == 0 || cCategoryIDs.length == 0) return 0;
  const numSameChannel = numSameCategoryId(uCategoryIDs, cCategoryIDs);

  return numSameChannel / Math.max(uCategoryIDs.length, cCategoryIDs.length);
};

// score % of how many category topics are the same
const scoreCategoryTopic = (
  uCategoryTopics: string[],
  cCategoryTopics: string[]
): number => {
  if (uCategoryTopics.length == 0 || cCategoryTopics.length == 0) return 0;
  const numSameChannel = numSameCategoryTopic(uCategoryTopics, cCategoryTopics);

  return (
    numSameChannel / Math.max(uCategoryTopics.length, cCategoryTopics.length)
  );
};

const numSameCategoryTopic = (
  userCategoryId: string[],
  candidateCategoryId: string[]
) => {
  let count = 0;
  userCategoryId.forEach((u) => {
    candidateCategoryId.forEach((c) => {
      const levScore = levenshtein.get(u, c);
      if (levScore < 2) count++; // they are similar words
    });
  });
  return count;
};

const prepareMatchingItem = (
  matchingItem: UserMatchingItemEntity
): UserMatchingItemEntity => {
  for (let i = 0; i < matchingItem.videoEntities.length; i++) {
    const videoEntity = matchingItem.videoEntities[i];

    videoEntity.description = sanitizeMatchingItemText(
      videoEntity.description.split(" ")
    );
    videoEntity.videoTitle = sanitizeMatchingItemText(
      videoEntity.videoTitle.split(" ")
    );
    matchingItem.videoEntities[i] = videoEntity;
  }
  return matchingItem;
};

const sanitizeMatchingItemText = (text: string[]): string => {
  const sanitizedWords: string[] = [];
  const regex = /[^A-Za-z0-9]/g;

  for (let w of text) {
    if (w.length > 3) {
      w.replace(regex, "");
      sanitizedWords.push(w);
    }
  }

  return sanitizedWords.join(" ");
};
