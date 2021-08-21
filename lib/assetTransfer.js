"use strict";

const { Contract } = require("fabric-contract-api");

class AssetTransfer extends Contract {
  async InitLedger(ctx) {
    const assets = [
      {
        ID: "0001",
        Name: "Marija Vuco",
        Collage: "FESB",
        Grade: 4.67,
      },
      {
        ID: "0002",
        Name: "Nikola Vlasic",
        Collage: "FESB",
        Grade: 3.67,
      },
      {
        ID: "0003",
        Name: "Matea Vida",
        Collage: "PMF",
        Grade: 3.2,
      },
      {
        ID: "0004",
        Name: "Ivan Madrid",
        Collage: "Kopilica",
        Grade: 3.9,
      },
      {
        ID: "0005",
        Name: "Leo Rondo",
        Collage: "PMF",
        Grade: 3.6,
      },
      {
        ID: "0006",
        Name: "Max Barcolo",
        Collage: "Kopilica",
        Grade: 2.8,
      },
    ];

    for (const asset of assets) {
      asset.docType = "asset";
      await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
      console.info(`Asset ${asset.ID} initialized`);
    }
  }

  async CreateAsset(ctx, id, name, collage, grade) {
    const asset = {
      ID: id,
      Name: name,
      Collage: collage,
      Grade: grade,
    };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    return JSON.stringify(asset);
  }

  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  async UpdateAsset(ctx, id, name, collage, grade) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }

    const updatedAsset = {
      ID: id,
      Name: name,
      Collage: collage,
      Grade: grade,
    };
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
  }

  async DeleteAsset(ctx, id) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return ctx.stub.deleteState(id);
  }

  async AssetExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }

  async TransferAsset(ctx, id, collage) {
    const assetString = await this.ReadAsset(ctx, id);
    const asset = JSON.parse(assetString);
    asset.Collage = collage;
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
  }

  async GetAllAssets(ctx) {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push({ Key: result.value.key, Record: record });
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }

  async GetAssetHistory(ctx, id) {
    let resultsIterator = await ctx.stub.getHistoryForKey(id);
    let results = await this._GetAllResults(resultsIterator, true);

    return JSON.stringify(results);
  }

  async _GetAllResults(iterator, isHistory) {
    let allResults = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString("utf8"));
        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.txId;
          jsonRes.Timestamp = res.value.timestamp;
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString("utf8"));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString("utf8");
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString("utf8"));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString("utf8");
          }
        }
        allResults.push(jsonRes);
      }
      res = await iterator.next();
    }
    iterator.close();
    return allResults;
  }
}

module.exports = AssetTransfer;
