import { v4 as uuidv4 } from "uuid";

export const getUser = (gender, genderPref, age) => {
  const userUuid = uuidv4();
  const videoUuid = uuidv4();
  const dmpUuid = uuidv4();

  return {
    user: {
      uuid: userUuid,
      mobile: "8607664545",
      email: "test@gmail.com",
      verified: true,
    },
    videos: [
      {
        uuid: videoUuid,
        video_id: "video-id-1",
        channel_id: "channel-id-1",
        video_title: "video-title-1",
        video_description: "video-description-1",
        category_id: "category-id-1",
        topic_categories: "topic-categories-1",
      },
    ],
    datingMatchPreferences: {
      uuid: dmpUuid,
      user_uuid: userUuid,
      gender: gender,
      gender_preference: genderPref,
      age_min_preference: 20,
      age_max_preference: 50,
      zipcode: "06117",
      zipcode_preference: "11217",
      age: age,
    },
  };
};
