import { UserEntity, DatingMatchPreferencesEntity } from "../types/user";
import { Repo } from "../database/repo";
import { AWSGateway } from "../gateway/aws";
import { userEntityToRecord } from "../utils/mapper-user";
import { v4 as uuidv4 } from "uuid";
import { LikeRecord, MatchRecord } from "../types/match";

export interface UserControllerParams {
  // db: any;
  repo: Repo;

  awsGateway: AWSGateway;
}

export class UserController {
  repo: Repo;
  awsGateway: AWSGateway;

  constructor(p: UserControllerParams) {
    this.repo = p.repo;
    this.awsGateway = p.awsGateway;
  }

  /*
  1) create user
  2) get email/text to create a password
  3) run validation in handler

  */
  createUser = async (params: createUserParams) => {
    const newUuid = uuidv4();
    const userEntity: UserEntity = {
      uuid: newUuid,
      mobile: params.mobile,
      email: params.email,
      verified: false,
    };

    // convert to userRecord
    const userRecord = userEntityToRecord(userEntity);
    await this.repo.createUser(userRecord);
  };

  verifyUser = async () => {};

  createUserPassword = async () => {};

  deleteUser = async (params: deleteUserParams) => {
    await this.repo.deleteUser(params.uuid);
  };

  // pass in maybe some enum and map the enum to what you're updating
  updateUser = async (params: updateUserParams) => {
    params.updates.forEach((update) => {
      if (update.updateType == userUpdateType.UPDATE_ACCOUNT_SETTINGS) {
      }
    });
  };

  likeProfile = async (params: likeProfileParams) => {
    // first make sure this profile is not a current match
    const existingMatch = await this.repo.getMatchRecordByUuids(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    if (existingMatch) throw new Error("profile has already been matched");
    // then make sure these two people haven't blocked each other

    const blockedRecord = await this.repo.getBlockedByUserUuids(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    if (blockedRecord) throw new Error("this profile has been blocked");
    // check to see if the other party has already liked this profile
    // if so, create a match
    const likeRecord = await this.repo.getLikeRecord(
      params.initiatorUuid,
      params.likedProfileUuid
    );
    const likeParams: LikeRecord = {
      initiatorUuid: params.initiatorUuid,
      receiverUuid: params.likedProfileUuid,
    };
    if (likeRecord) {
      // create like and match in tx

      // if we see there is a like already made
      // then that person is the initiator
      const matchParams: MatchRecord = {
        initiatorUuid: params.likedProfileUuid, // they already liked the initiator
        responderUuid: params.initiatorUuid,
        matchedUsersUuids: [params.initiatorUuid, params.likedProfileUuid],
      };
      await this.repo.createLikeAndMatchRecords(likeParams, matchParams);
      return;
    }
    await this.repo.createLikeRecord(likeParams);
    // then either let the other client poll or let them create a websocket
  };

  getProfileByUUID = async (params: getProfileByUUIDParams) => {
    return await this.repo.getProfileByUserUUID(params.uuid);
  };

  blockProfileByUUID = async () => {};

  //   getDatingPreferencesByUuid = async (
  //     uuid: string
  //   ): Promise<DatingMatchPreferencesEntity> => {
  //     const datingMatchPreferencesSnapshot = await this.db
  //       .collection("dating_match_preferences")
  //       .where("userUUID", "==", uuid)
  //       .get();

  //     const prefs: DatingMatchPreferencesEntity = {};
  //     if (datingMatchPreferencesSnapshot.length > 0) {
  //       const data = datingMatchPreferencesSnapshot[0].data();
  //       prefs.uuid = data.uuid;
  //       prefs.userUuid = data.userUuid;
  //       prefs.genderPreference = data.genderPreference;
  //       prefs.gender = data.gender;
  //       prefs.age = data.age;
  //       prefs.ageMinPreference = data.ageMinPreference;
  //       prefs.ageMaxPreference = data.ageMaxPreference;
  //       prefs.zipcode = data.zipcode;
  //       prefs.zipcodePreference = data.zipcodePreference;
  //     }
  //     return prefs;
  //   };
}

interface deleteUserParams {
  uuid: string;
}

interface createUserParams {
  mobile?: string;
  email?: string;
}

interface getProfileByUUIDParams {
  uuid: string;
}

enum userUpdateType {
  UPDATE_ACCOUNT_SETTINGS, // pass, email, mobile
  UPDATE_DATING_PREFERENCES,
  UPDATE_MEDIA_LINKS, // youtube links
  UPDATE_PICTURE_ORDER, // pics, other stuff
  ADD_PICTURE,
  DELETE_PICTURE,
}

interface updateUserParam {
  updateType: userUpdateType;
  mobile?: string;
  email?: string;
  newPassword: string;
  newPasswordConfirm: string;
  newEmail: string;
  newMobile: string; // need new confirmation
  //  newPics:
}

interface updateUserParams {
  updates: updateUserParam[];
}

interface likeProfileParams {
  initiatorUuid: string;
  likedProfileUuid: string;
}
