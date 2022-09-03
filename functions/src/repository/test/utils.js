module.exports.clearTables = async (db) => {
  const collNames = await db.listCollections().toArray();
  collNames.forEach(async (col) => {
    await db.collection(col.name).drop();
  });
};
