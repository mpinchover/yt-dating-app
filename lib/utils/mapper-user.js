"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datingMatchPrefRecordToEntity = exports.userRecordToEntity = exports.userFirestoreToRecord = exports.userEntityToRecord = void 0;
const userEntityToRecord = (params) => {
    const userRecord = {
        uuid: params.uuid,
        mobile: params.mobile,
        email: params.email,
        verified: params.verified,
        lastSeenAtUtc: params.lastSeenAtUtc,
    };
    return userRecord;
};
exports.userEntityToRecord = userEntityToRecord;
const userFirestoreToRecord = (params) => {
    const userRecord = {
        uuid: params.uuid,
        mobile: params.mobile,
        email: params.email,
        verified: params.verified,
        lastSeenAtUtc: params.lastSeenAtUtc,
        deletedAtUtc: params.deletedAtUtc,
    };
    return userRecord;
};
exports.userFirestoreToRecord = userFirestoreToRecord;
const userRecordToEntity = (params) => {
    const userEntity = {
        uuid: params.uuid,
        mobile: params.mobile,
        email: params.email,
        verified: params.verified,
        lastSeenAtUtc: params.lastSeenAtUtc,
    };
    return userEntity;
};
exports.userRecordToEntity = userRecordToEntity;
const datingMatchPrefRecordToEntity = (params) => {
    const datingPrefEntity = {
        uuid: params.uuid,
        userUuid: params.userUuid,
        genderPreference: params.genderPreference,
        gender: params.gender,
        ageMinPreference: params.ageMinPreference,
        ageMaxPreference: params.ageMaxPreference,
        zipcode: params.zipcode,
        zipcodePreference: params.zipcodePreference,
        age: params.age,
    };
    return datingPrefEntity;
};
exports.datingMatchPrefRecordToEntity = datingMatchPrefRecordToEntity;
//# sourceMappingURL=mapper-user.js.map