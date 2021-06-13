/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";
const sinon = require("sinon");
const chai = require("chai");
const sinonChai = require("sinon-chai");
const expect = chai.expect;

const { Context } = require("fabric-contract-api");
const { ChaincodeStub } = require("fabric-shim");

const AssetTransfer = require("../lib/assetTransfer.js");

let assert = sinon.assert;
chai.use(sinonChai);

describe("Asset Transfer Basic Tests", () => {
  let transactionContext, chaincodeStub, asset;
  beforeEach(() => {
    transactionContext = new Context();

    chaincodeStub = sinon.createStubInstance(ChaincodeStub);
    transactionContext.setChaincodeStub(chaincodeStub);

    chaincodeStub.putState.callsFake((key, value) => {
      if (!chaincodeStub.states) {
        chaincodeStub.states = {};
      }
      chaincodeStub.states[key] = value;
    });

    chaincodeStub.getState.callsFake(async (key) => {
      let ret;
      if (chaincodeStub.states) {
        ret = chaincodeStub.states[key];
      }
      return Promise.resolve(ret);
    });

    chaincodeStub.deleteState.callsFake(async (key) => {
      if (chaincodeStub.states) {
        delete chaincodeStub.states[key];
      }
      return Promise.resolve(key);
    });

    chaincodeStub.getStateByRange.callsFake(async () => {
      function* internalGetStateByRange() {
        if (chaincodeStub.states) {
          // Shallow copy
          const copied = Object.assign({}, chaincodeStub.states);

          for (let key in copied) {
            yield { value: copied[key] };
          }
        }
      }

      return Promise.resolve(internalGetStateByRange());
    });

    asset = {
      ID: "0001",
      Name: "Marija Vuco",
      Collage: "FESB",
      Grade: 4.67,
    };
  });

  describe("Test InitLedger", () => {
    it("should return error on InitLedger", async () => {
      chaincodeStub.putState.rejects("failed inserting key");
      let assetTransfer = new AssetTransfer();
      try {
        await assetTransfer.InitLedger(transactionContext);
        assert.fail("InitLedger should have failed");
      } catch (err) {
        expect(err.name).to.equal("failed inserting key");
      }
    });

    it("should return success on InitLedger", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.InitLedger(transactionContext);
      let ret = JSON.parse((await chaincodeStub.getState("asset1")).toString());
      expect(ret).to.eql(Object.assign({ docType: "asset" }, asset));
    });
  });

  describe("Test CreateAsset", () => {
    it("should return error on CreateAsset", async () => {
      chaincodeStub.putState.rejects("failed inserting key");

      let assetTransfer = new AssetTransfer();
      try {
        await assetTransfer.CreateAsset(
          transactionContext,
          asset.ID,
          asset.Name,
          asset.Collage,
          asset.Grade
        );
        assert.fail("CreateAsset should have failed");
      } catch (err) {
        expect(err.name).to.equal("failed inserting key");
      }
    });

    it("should return success on CreateAsset", async () => {
      let assetTransfer = new AssetTransfer();

      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      let ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
      expect(ret).to.eql(asset);
    });
  });

  describe("Test ReadAsset", () => {
    it("should return error on ReadAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      try {
        await assetTransfer.ReadAsset(transactionContext, "0002");
        assert.fail("ReadAsset should have failed");
      } catch (err) {
        expect(err.message).to.equal("The asset 0002 does not exist");
      }
    });

    it("should return success on ReadAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
      expect(ret).to.eql(asset);
    });
  });

  describe("Test UpdateAsset", () => {
    it("should return error on UpdateAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      try {
        await assetTransfer.UpdateAsset(
          transactionContext,
          "0007",
          "Ana Danza",
          "PMF",
          4.5
        );
        assert.fail("UpdateAsset should have failed");
      } catch (err) {
        expect(err.message).to.equal("The asseT 0007 does not exist");
      }
    });

    it("should return success on UpdateAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      await assetTransfer.UpdateAsset(
        transactionContext,
        "0001",
        "Marija Vuco",
        "FESB",
        4.67
      );
      let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
      let expected = {
        ID: "0001",
        Name: "Marija Vuco",
        Collage: "FESB",
        Grade: 4.67,
      };
      expect(ret).to.eql(expected);
    });
  });

  describe("Test DeleteAsset", () => {
    it("should return error on DeleteAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      try {
        await assetTransfer.DeleteAsset(transactionContext, "0002");
        assert.fail("DeleteAsset should have failed");
      } catch (err) {
        expect(err.message).to.equal("The asset 0002 does not exist");
      }
    });

    it("should return success on DeleteAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      await assetTransfer.DeleteAsset(transactionContext, asset.ID);
      let ret = await chaincodeStub.getState(asset.ID);
      expect(ret).to.equal(undefined);
    });
  });

  describe("Test TransferAsset", () => {
    it("should return error on TransferAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      try {
        await assetTransfer.TransferAsset(transactionContext, "0002", "FESB");
        assert.fail("DeleteAsset should have failed");
      } catch (err) {
        expect(err.message).to.equal("The asset 0002 does not exist");
      }
    });

    it("should return success on TransferAsset", async () => {
      let assetTransfer = new AssetTransfer();
      await assetTransfer.CreateAsset(
        transactionContext,
        asset.ID,
        asset.Name,
        asset.Collage,
        asset.Grade
      );

      await assetTransfer.TransferAsset(transactionContext, asset.ID, "FESB");
      let ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
      expect(ret).to.eql(Object.assign({}, asset, { Collage: "FESB" }));
    });
  });

  describe("Test GetAllAssets", () => {
    it("should return success on GetAllAssets", async () => {
      let assetTransfer = new AssetTransfer();

      await assetTransfer.CreateAsset(
        transactionContext,
        "0001",
        "Marija Vuco",
        "FESB",
        4.67
      );
      await assetTransfer.CreateAsset(
        transactionContext,
        "0002",
        "Nikola Vlasic",
        "FESB",
        3.67
      );
      await assetTransfer.CreateAsset(
        transactionContext,
        "0003",
        "Matea Vida",
        "PMF",
        3.2
      );
      await assetTransfer.CreateAsset(
        transactionContext,
        "0004",
        "Ivan Madrid",
        "Kopilica",
        3.9
      );

      let ret = await assetTransfer.GetAllAssets(transactionContext);
      ret = JSON.parse(ret);
      expect(ret.length).to.equal(4);

      let expected = [
        {
          Record: {
            ID: "0001",
            Name: "Marija Vuco",
            Collage: "FESB",
            Grade: 4.67,
          },
        },
        {
          Record: {
            ID: "0002",
            Name: "Nikola Vlasic",
            Collage: "FESB",
            Grade: 3.67,
          },
        },
        {
          Record: {
            ID: "0003",
            Name: "Matea Vida",
            Collage: "PMF",
            Grade: 3.2,
          },
        },
        {
          Record: {
            ID: "0004",
            Name: "Ivan Madrid",
            Collage: "Kopilica",
            Grade: 3.9,
          },
        },
      ];

      expect(ret).to.eql(expected);
    });

    it("should return success on GetAllAssets for non JSON value", async () => {
      let assetTransfer = new AssetTransfer();

      chaincodeStub.putState.onFirstCall().callsFake((key, value) => {
        if (!chaincodeStub.states) {
          chaincodeStub.states = {};
        }
        chaincodeStub.states[key] = "non-json-value";
      });

      await assetTransfer.CreateAsset(
        transactionContext,
        "0001",
        "Marija Vuco",
        "FESB",
        4.67
      );
      await assetTransfer.CreateAsset(
        transactionContext,
        "0002",
        "Nikola Vlasic",
        "FESB",
        3.67
      );
      await assetTransfer.CreateAsset(
        transactionContext,
        "0003",
        "Matea Vida",
        "PMF",
        3.2
      );
      await assetTransfer.CreateAsset(
        transactionContext,
        "0004",
        "Ivan Madrid",
        "Kopilica",
        3.9
      );

      let ret = await assetTransfer.GetAllAssets(transactionContext);
      ret = JSON.parse(ret);
      expect(ret.length).to.equal(4);

      let expected = [
        { Record: "non-json-value" },
        {
          Record: {
            ID: "0001",
            Name: "Marija Vuco",
            Collage: "FESB",
            Grade: 4.67,
          },
        },
        {
          Record: {
            ID: "0002",
            Name: "Nikola Vlasic",
            Collage: "FESB",
            Grade: 3.67,
          },
        },
        {
          Record: {
            ID: "0003",
            Name: "Matea Vida",
            Collage: "PMF",
            Grade: 3.2,
          },
        },
      ];

      expect(ret).to.eql(expected);
    });
  });
});
