const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vz4h6lc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    const categoryCollection = client.db('DBFurniture').collection('FurnitureCategory');
    const productCollection = client.db('DBFurniture').collection('product');


    app.get('/categories', async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const categories = await cursor.toArray();
      res.send(categories)
    });

    app.get('/category', async (req, res) => {
      const query = {};
      const result = await categoryCollection.find(query).project({ title: 1 }).toArray();
      res.send(result)
    })

    // products
    app.get('/products', async (req, res) => {
      const query = {};
      const product = await productCollection.find(query).sort({_id: -1 }).toArray();
      res.send(product);
    });
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { categoryId: id };
      const product = await productCollection.find(query).toArray();
      res.send(product);
    });


    app.post('/products', async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
});


  }
  finally {

  }

}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
  res.send('used-resale-Furniture  server is running')
})

app.listen(port, () => {
  console.log(`used-resale-Furniture server running on ${port}`);
})