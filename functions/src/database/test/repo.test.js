const { testAdd } = require("../repo.ts");
const { Repo } = require("../repo");
const expect = require("chai").expect;
var sinonChai = require("sinon-chai");
const sinon = require("sinon");
// const test = require("firebase-functions-test")();
// const wrapped = test.wrap(testAdd);

describe("testing like records", () => {
  it("testing get like record", (done) => {
    const mockData = {
      data: sinon.stub().returns(mockPreferences),
      name: "MATT",
    };

    const mockResults = [mockData];

    const mockDB = {
      collection: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      get: sinon.stub().resolves(mockResults),
    };
    const repo = new Repo({ db: mockDB });
    repo.getLikeRecord();

    done();
  });

  it("getDatingPreferencesByUuid", (done) => {
    const mockPreferences = {
      prefs: "some-preferences",
    };

    const mockData = {
      data: sinon.stub().returns(mockPreferences),
      name: "MATT",
    };

    const mockResults = [mockData];
    const mockDB = {
      collection: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      get: sinon.stub().resolves(mockResults),
    };

    const userRepo = new UserRepo({ db: mockDB });
    const res = userRepo.getDatingPreferencesByUuid("some-uuid");

    sinon.assert.calledWithExactly(
      mockDB.collection,
      "dating_match_preferences"
    );
    sinon.assert.calledWithExactly(mockDB.where, "userUUID", "==", "some-uuid");
    // sinon.assert.calledWithExactly(mockDB.doc, 'someDoc');
    sinon.assert.calledOnce(mockDB.get);
    // sinon.assert.calledOnce(mockData.data);
    // sinon.assert.calledOnce(mockData.data);

    done();
  });
});

// error case
// https://stackoverflow.com/questions/66868604/how-to-mock-firestore-with-mocha
