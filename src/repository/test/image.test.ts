require("reflect-metadata");
import { user } from "firebase-functions/v1/auth";
import { ImageRecord } from "../../types/image";

const { Repo } = require("../repo");
var mysql = require("mysql2/promise");
const expect = require("chai").expect;

describe("user test suite", async () => {
  const r = new Repo();
  let conn;

  before(async () => {
    try {
      conn = await mysql.createConnection({
        host: "localhost",
        port: "3308",
        user: "test",
        password: "test",
        database: "test",
      });
      r.db = conn;
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  after(() => {
    conn.end();
  });

  beforeEach(async () => {
    await conn.beginTransaction();
  });

  afterEach(async () => {
    await conn.rollback();
  });

  describe("image testing suite", () => {
    // todo - handle submitting image out of order?
    // TODO - use the utils function to generate the s3 bucket link and test with that
    it("create an image, query image by position and user uuid, query images by user uuid", async () => {
      const userUuid = "user-uuid";
      const imageUuid = "image-uuid";
      const secondImageUuid = "another-image-uuid";
      const mediaStorageLink = "media-storage-link";
      const secondMediaStorageLink = "second-media-storage-link";
      const positionIndex = 0;
      const secondPositionIndex = 1;
      const mediaStorageKey = "media-storage-key";
      const secondMediaStorageKey = "second-media-storage-key";

      const newImage: ImageRecord = {
        uuid: imageUuid,
        user_uuid: userUuid,
        media_storage_link: mediaStorageLink,
        media_storage_key: mediaStorageKey,
        position_index: positionIndex,
      };

      await r.createImage(newImage);
      let images = await r.getImagesByUserUuid(userUuid);

      expect(images).to.not.be.null;
      expect(images.length).equal(1);
      expect(images[0].user_uuid).equal(userUuid);
      expect(images[0].media_storage_link).equal(mediaStorageLink);
      expect(images[0].media_storage_key).equal(mediaStorageKey);
      expect(images[0].position_index).equal(0);
      expect(images[0].uuid).equal(imageUuid);

      let imageByPositionAndUuid = await r.getImageByIndexAndUserUuid(
        0,
        userUuid
      );
      expect(imageByPositionAndUuid).to.not.be.null;
      expect(imageByPositionAndUuid.user_uuid).equal(userUuid);
      expect(imageByPositionAndUuid.media_storage_link).equal(mediaStorageLink);
      expect(imageByPositionAndUuid.position_index).equal(0);
      expect(imageByPositionAndUuid.uuid).equal(imageUuid);

      const secondImage: ImageRecord = {
        uuid: secondImageUuid,
        user_uuid: userUuid,
        media_storage_link: secondMediaStorageLink,
        position_index: secondPositionIndex,
        media_storage_key: secondMediaStorageKey,
      };
      await r.createImage(secondImage);

      images = await r.getImagesByUserUuid(userUuid);

      expect(images).to.not.be.null;
      expect(images.length).equal(2);
      expect(images[0].user_uuid).equal(userUuid);
      expect(images[0].media_storage_link).equal(mediaStorageLink);
      expect(images[0].media_storage_key).equal(mediaStorageKey);
      expect(images[0].position_index).equal(0);
      expect(images[0].uuid).equal(imageUuid);
      expect(images[1].user_uuid).equal(userUuid);
      expect(images[1].media_storage_link).equal(secondMediaStorageLink);
      expect(images[1].media_storage_key).equal(secondMediaStorageKey);
      expect(images[1].position_index).equal(1);
      expect(images[1].uuid).equal(secondImageUuid);

      imageByPositionAndUuid = await r.getImageByIndexAndUserUuid(1, userUuid);
      expect(imageByPositionAndUuid).to.not.be.null;
      expect(imageByPositionAndUuid.user_uuid).equal(userUuid);
      expect(imageByPositionAndUuid.media_storage_link).equal(
        secondMediaStorageLink
      );
      expect(imageByPositionAndUuid.media_storage_key).equal(
        secondMediaStorageKey
      );
      expect(imageByPositionAndUuid.position_index).equal(1);
      expect(imageByPositionAndUuid.uuid).equal(secondImageUuid);
    });

    // TODO - add in a link to the bucket as well
    it("create an image, update the image, query it", async () => {
      const userUuid = "user-uuid";
      const imageOne = "image-uuid";
      const imageTwo = "image-uuid-2";
      const linkOne = "media-storage-link";
      const keyOne = "media-storage-link";
      const linkTwo = "media-storage-link-2";
      const keyTwo = "media-storage-key-2";
      const updatedLink = "updated-media-link";
      const updatedKey = "updated-media-key";
      const positionOne = 0;
      const positionTwo = 1;

      const newImage: ImageRecord = {
        uuid: imageOne,
        user_uuid: userUuid,
        media_storage_key: keyOne,
        media_storage_link: linkOne,
        position_index: positionOne,
      };

      const newImageTwo: ImageRecord = {
        uuid: imageTwo,
        user_uuid: userUuid,
        media_storage_key: keyTwo,
        media_storage_link: linkTwo,
        position_index: positionTwo,
      };

      await r.createImage(newImage);
      await r.createImage(newImageTwo);

      newImage.media_storage_link = updatedLink;
      newImage.media_storage_key = updatedKey;
      await r.updateImage(newImage);

      let images = await r.getImagesByUserUuid(userUuid);
      images.sort(function (a, b) {
        return a.position_index - b.position_index;
      });

      expect(images).to.not.be.null;
      expect(images.length).equal(2);
      expect(images[0].user_uuid).equal(userUuid);
      expect(images[0].media_storage_link).equal(updatedLink);
      expect(images[0].media_storage_key).equal(updatedKey);
      expect(images[0].position_index).equal(0);
      expect(images[0].uuid).equal(imageOne);
      expect(images[1].user_uuid).equal(userUuid);
      expect(images[1].media_storage_link).equal(linkTwo);
      expect(images[1].media_storage_key).equal(keyTwo);
      expect(images[1].position_index).equal(1);
      expect(images[1].uuid).equal(imageTwo);
    });
  });
});
