const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Hamim_742:Hamim%40742@cluster0.bls3tyg.mongodb.net/basione_db?appName=Cluster0";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db('basione_db');
    const orderCollection = db.collection('Order');

    // Find all orders with null or missing guestOrderToken
    const orders = await orderCollection.find({
      $or: [
        { guestOrderToken: null },
        { guestOrderToken: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${orders.length} orders with null or missing guestOrderToken.`);

    // Check if there are existing indexes on Order
    const indexes = await orderCollection.indexes();
    console.log("Current indexes on Order:", JSON.stringify(indexes, null, 2));

    // Let's update each order to have a unique token or delete them if they are test data,
    // or just delete the guestOrderToken field completely to see if MongoDB allows it.
    // Actually, in MongoDB, a unique index requires that no two documents have null for the indexed field.
    // If the field is missing (does not exist), MongoDB unique index allows multiple documents NOT to have the field.
    // But if the field exists and is set to null, it counts as a duplicate value!
    // So we can unset the guestOrderToken field for all documents where it is null!
    
    const result = await orderCollection.updateMany(
      { guestOrderToken: null },
      { $unset: { guestOrderToken: "" } }
    );
    console.log(`Unset guestOrderToken for ${result.modifiedCount} orders.`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
