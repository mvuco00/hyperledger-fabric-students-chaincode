/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

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

  // CreateAsset issues a new asset to the world state with given details.
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

  // ReadAsset returns the asset stored in the world state with given id.
  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  // UpdateAsset updates an existing asset in the world state with provided parameters.
  async UpdateAsset(ctx, id, name, collage, grade) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }

    // overwriting original asset with new asset
    const updatedAsset = {
      ID: id,
      Name: name,
      Collage: collage,
      Grade: grade,
    };
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
  }

  // DeleteAsset deletes an given asset from the world state.
  async DeleteAsset(ctx, id) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return ctx.stub.deleteState(id);
  }

  // AssetExists returns true when asset with given ID exists in world state.
  async AssetExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }

  // TransferAsset updates the owner field of asset with given id in the world state.
  async TransferAsset(ctx, id, collage) {
    const assetString = await this.ReadAsset(ctx, id);
    const asset = JSON.parse(assetString);
    asset.Collage = collage;
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
  }

  // GetAllAssets returns all assets found in the world state.
  async GetAllAssets(ctx) {
    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
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
}

module.exports = AssetTransfer;
