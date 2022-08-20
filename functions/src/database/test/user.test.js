const { testAdd } = require("../user.ts");

const expect = require("chai").expect;
// const test = require("firebase-functions-test")();
// const wrapped = test.wrap(testAdd);

describe("testing the add function", () => {
  it("addition worked correctly", (done) => {
    const res = testAdd(4, 5);
    expect(res).to.equal(10);
    done();
  });
});
