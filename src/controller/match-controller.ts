import { UserEntity, DatingMatchPreferencesEntity } from "../types/user";
import {
  UserMatchingItemEntity,
  UserProfileSearchFilterRecord,
} from "../types/match";
import { VideoEntity } from "../types/video";
import { Repo } from "../repository/repo";
import levenshtein from "fast-levenshtein";
import { userRecordConstructor } from "firebase-functions/v1/auth";

export interface MatchControllerParams {
  repo: Repo;
}

class MatchController {
  repo: Repo;

  constructor(p: MatchControllerParams) {
    this.repo = p.repo;
  }

  getCandidatesForUser = async (user: UserEntity) => {
    let candidateMatchingItems = await this.getCandidateMatchingItems(user);
    if (candidateMatchingItems.length == 0) {
      throw new Error("no candidates available for provided filters");
    }

    let userMatchingItem = this.generateUserMatchingItem(user);

    // sanitize the text
    userMatchingItem = this.prepareMatchingItem(userMatchingItem);

    for (let i = 0; i < candidateMatchingItems.length; i++) {
      candidateMatchingItems[i] = this.prepareMatchingItem(
        candidateMatchingItems[i]
      );
    }

    const scoredCandidates: Map<string, number> = this.scoreCandidates(
      userMatchingItem,
      candidateMatchingItems
    );

    const topCandidates = this.getTopCandidates(scoredCandidates);
    if (topCandidates.length > 5) return topCandidates.slice(0, 5);
    return topCandidates;
  };

  // return top user uuids
  getTopCandidates = (scoredCandidates: Map<string, number>): string[] => {
    // sort by value
    const topScoredCandidates: string[] = [...scoredCandidates.keys()].sort(
      (a, b) => scoredCandidates[b] - scoredCandidates[a]
    );
    return topScoredCandidates;
  };

  generateUserMatchingItem = (user: UserEntity): UserMatchingItemEntity => {
    const res: UserMatchingItemEntity = {
      userUuid: user.uuid,
      videoEntities: user.videoEntities,
    };
    return res;
  };

  getCandidateMatchingItems = async (
    user: UserEntity
  ): Promise<UserMatchingItemEntity[]> => {
    // first get candidates that have already been matched to this user
    // then get the candidates that have been blocked by this user
    // make sure to get prefernces that do not show either of those

    const alreadyMatchedUserUUIDs: string[] =
      await this.repo.getUserUuidsMatchedToUuid(user.uuid);

    const blockedByUserUUIDs: string[] =
      await this.repo.getUsersWhoBlockedThisUuid(user.uuid);

    const userUUIDsToFilterOut: string[] = [
      ...alreadyMatchedUserUUIDs,
      ...blockedByUserUUIDs,
    ];

    const uDatingPref = await this.repo.getDatingPreferencesByUuid(user.uuid);
    user.userDatingPreference = uDatingPref;
    const searchFilter: UserProfileSearchFilterRecord = this.createSearchFilter(
      user,
      userUUIDsToFilterOut
    );

    const candidateProfiles: UserEntity[] =
      await this.repo.getUserProfileEntities(searchFilter);

    const candidateMatchingItems: UserMatchingItemEntity[] = [];
    for (const candidateProfile of candidateProfiles) {
      const matchingItem = this.generateUserMatchingItem(candidateProfile);
      candidateMatchingItems.push(matchingItem);
    }
    return candidateMatchingItems;
  };

  createSearchFilter = (
    user: UserEntity,
    userUuidsToFilterOut: string[]
  ): UserProfileSearchFilterRecord => {
    const filter: UserProfileSearchFilterRecord = {
      gender: user.userDatingPreference.gender,
      genderPreference: user.userDatingPreference.genderPreference,
      age: user.userDatingPreference.age,
      ageMinPreference: user.userDatingPreference.ageMinPreference,
      ageMaxPreference: user.userDatingPreference.ageMaxPreference,
      userUuidsToFilterOut: userUuidsToFilterOut,
    };
    return filter;
  };

  scoreCandidates = (
    userMatchingItem: UserMatchingItemEntity,
    candidateMatchingItems: UserMatchingItemEntity[]
  ): Map<string, number> => {
    const scores = new Map<string, number>();

    const userVideoDescription = this.getAllTextDescriptionFromVideoEntities(
      userMatchingItem.videoEntities
    );
    const userVideoTitle = this.getAllTextTitleFromVideoEntities(
      userMatchingItem.videoEntities
    );
    const userChannelIds: string[] = this.getChannelIds(
      userMatchingItem.videoEntities
    );
    const userCategoryIds: number[] = this.getCategoryIds(
      userMatchingItem.videoEntities
    );
    const userCategoryTopics: string[] = this.getCategoryTopics(
      userMatchingItem.videoEntities
    );

    for (let i = 0; i < candidateMatchingItems.length; i++) {
      const candidate = candidateMatchingItems[i];
      const cUUID = candidate.userUuid;

      scores.set(cUUID, 0);

      const candidateVideoEntities = candidate.videoEntities;
      const candidateVideoDescription =
        this.getAllTextDescriptionFromVideoEntities(candidateVideoEntities);
      const candidateVideoTitle = this.getAllTextTitleFromVideoEntities(
        candidate.videoEntities
      );

      const videoDescriptionScore = this.scoreVideoDescriptions(
        userVideoDescription,
        candidateVideoDescription
      );
      scores.set(candidate.userUuid, scores.get(cUUID) + videoDescriptionScore);

      const videoTitleScore = this.scoreVideoTitles(
        userVideoTitle,
        candidateVideoTitle
      );
      scores.set(candidate.userUuid, scores.get(cUUID) + videoTitleScore);

      // remember to do null checks everywhere
      const candidateChannelIds: string[] = this.getChannelIds(
        candidate.videoEntities
      );
      const channelIDScore = this.scoreChannelID(
        userChannelIds,
        candidateChannelIds
      );
      scores.set(candidate.userUuid, scores.get(cUUID) + channelIDScore);

      const candidateCategoryIds: number[] = this.getCategoryIds(
        candidate.videoEntities
      );

      const categoryIDScore = this.scoreCategoryID(
        userCategoryIds,
        candidateCategoryIds
      );
      scores.set(candidate.userUuid, scores.get(cUUID) + categoryIDScore);

      const candidateCategoryTopics: string[] = this.getCategoryTopics(
        candidate.videoEntities
      );

      const categoryTopicScore = this.scoreCategoryTopic(
        userCategoryTopics,
        candidateCategoryTopics
      );

      scores.set(cUUID, scores.get(cUUID) + categoryTopicScore);
    }
    return scores;
  };

  getCategoryTopics = (videoEntities: VideoEntity[]): string[] => {
    const topics: string[] = [];
    videoEntities.forEach((v) => {
      v.topicCategories.forEach((topic) => {
        topics.push(topic);
      });
    });
    return topics;
  };

  getChannelIds = (videoEntities: VideoEntity[]): string[] => {
    const channelIds: string[] = [];
    videoEntities.forEach((v) => {
      channelIds.push(v.channelId);
    });
    return channelIds;
  };

  getCategoryIds = (videoEntities: VideoEntity[]): number[] => {
    const ids: number[] = [];
    videoEntities.forEach((v) => {
      ids.push(v.categoryId);
    });
    return ids;
  };

  numSameChannelId = (
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
  numSameCategoryId = (
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
  getAllTextDescriptionFromVideoEntities = (
    videos: VideoEntity[]
  ): string[] => {
    const videoDescriptions: string[] = [];
    videos.forEach((video) => {
      const videoDescription = this.getAllTextDescriptionFromVideoEntity(video);
      if (videoDescription || videoDescription.length > 0)
        videoDescriptions.push(videoDescription);
    });
    return videoDescriptions;
  };

  getAllTextDescriptionFromVideoEntity = (video: VideoEntity): string => {
    if (!video.description || video.description === "") return "";
    const description = video.description.toLowerCase();
    return description;
  };

  // returns an array of strings where each string is title of a video
  getAllTextTitleFromVideoEntities = (videos: VideoEntity[]): string[] => {
    const videoTitles: string[] = [];
    videos.forEach((video) => {
      const videoTitle = this.getAllTextDescriptionFromVideoEntity(video);
      if (videoTitle.length > 0) videoTitles.push(videoTitle);
    });
    return videoTitles;
  };

  getAllTextTitleFromVideoEntity = (video: VideoEntity): string => {
    if (!video.videoTitle || video.videoTitle === "") return "";
    const videoTitle = video.videoTitle.toLowerCase();
    return videoTitle;
  };

  // you want to make sure you are filtering out anything not alphanumeric
  // maybe even filter out words like 'a', 'and',
  // do levenshtein distance
  // these are currently lists of strings
  scoreVideoDescriptions = (uText: string[], cText: string[]): number => {
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

  scoreVideoTitles = (uText: string[], cText: string[]): number => {
    return this.scoreVideoDescriptions(uText, cText);
  };

  // score % of how many channels are the same
  scoreChannelID = (uChannelIDs: string[], cChannelIDs: string[]): number => {
    if (uChannelIDs.length == 0 || cChannelIDs.length == 0) return 0;
    const numSameChannel = this.numSameChannelId(uChannelIDs, cChannelIDs);

    return numSameChannel / Math.max(uChannelIDs.length, cChannelIDs.length);
  };

  // score % of how many category ids are the same
  scoreCategoryID = (
    uCategoryIDs: number[],
    cCategoryIDs: number[]
  ): number => {
    if (uCategoryIDs.length == 0 || cCategoryIDs.length == 0) return 0;
    const numSameChannel = this.numSameCategoryId(uCategoryIDs, cCategoryIDs);

    return numSameChannel / Math.max(uCategoryIDs.length, cCategoryIDs.length);
  };

  // score % of how many category topics are the same
  scoreCategoryTopic = (
    uCategoryTopics: string[],
    cCategoryTopics: string[]
  ): number => {
    if (uCategoryTopics.length == 0 || cCategoryTopics.length == 0) return 0;
    const numSameChannel = this.numSameCategoryTopic(
      uCategoryTopics,
      cCategoryTopics
    );

    return (
      numSameChannel / Math.max(uCategoryTopics.length, cCategoryTopics.length)
    );
  };

  numSameCategoryTopic = (
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

  prepareMatchingItem = (
    matchingItem: UserMatchingItemEntity
  ): UserMatchingItemEntity => {
    for (let i = 0; i < matchingItem.videoEntities.length; i++) {
      const videoEntity = matchingItem.videoEntities[i];

      videoEntity.description = this.sanitizeMatchingItemText(
        videoEntity.description.split(" ")
      );
      videoEntity.videoTitle = this.sanitizeMatchingItemText(
        videoEntity.videoTitle.split(" ")
      );
      matchingItem.videoEntities[i] = videoEntity;
    }
    return matchingItem;
  };

  sanitizeMatchingItemText = (text: string[]): string => {
    const sanitizedWords: string[] = [];
    const regex = /[^A-Za-z0-9]/g;

    for (let w of text) {
      if (!wordsSet.has(w)) {
        w.replace(regex, "");
        sanitizedWords.push(w);
      }
    }

    return sanitizedWords.join(" ");
  };
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
