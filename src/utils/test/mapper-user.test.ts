import { expect } from "chai";

import { datingMatchPrefRecordToEntity } from "../mapper-user";
import {
  DatingMatchPreferencesRecord,
  DatingMatchPreferencesEntity,
} from "../../types/user";

describe("test user mappers", () => {
  it("test datingMatchPrefRecordToEntity", () => {
    const datingMatchPrefRecord: DatingMatchPreferencesRecord = {
      uuid: "some-uuid",
      gender_preference_man: true,
      gender_preference_woman: false,
      gender_woman: true,
      gender_man: false,
      age_min_preference: 20,
      age_max_preference: 100,
      zipcode: "01939",
      zipcode_preference: "03290",
      age: 30,
    };
    const res = datingMatchPrefRecordToEntity(datingMatchPrefRecord);
    expect(datingMatchPrefRecord.uuid).to.equal(res.uuid);
    expect(datingMatchPrefRecord.gender_preference_man).to.equal(
      res.genderPreferenceMan
    );
    expect(datingMatchPrefRecord.gender_preference_woman).to.equal(
      res.genderPreferenceWoman
    );
    expect(datingMatchPrefRecord.gender_man).to.equal(res.genderMan);
    expect(datingMatchPrefRecord.gender_woman).to.equal(res.genderWoman);
    expect(datingMatchPrefRecord.age_min_preference).to.equal(
      res.ageMinPreference
    );
    expect(datingMatchPrefRecord.age_max_preference).to.equal(
      res.ageMaxPreference
    );
    expect(datingMatchPrefRecord.zipcode).to.equal(res.zipcode);
    expect(datingMatchPrefRecord.zipcode_preference).to.equal(
      res.zipcodePreference
    );
    expect(datingMatchPrefRecord.age).to.equal(res.age);
  });
});
