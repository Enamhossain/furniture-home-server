const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vz4h6lc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).send('unauthorized access')
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  })
}
async function run() {
  try {
    const categoryCollection = client.db('DBFurniture').collection('FurnitureCategory');
    const productCollection = client.db('DBFurniture').collection('product');
    const usersCollection = client.db('DBFurniture').collection('users');
    const BookingCollection = client.db('DBFurniture').collection('Booking');

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }




    //jwt 

    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2h' })
        return res.send({ accessToken: token })
      }
      res.status(403).send({ accessToken: '' })
    });




        // products
        app.get('/products', async (req, res) => {
          const query = {};
          const product = await productCollection.find(query).sort({ _id: -1 }).toArray();
          res.send(product);
    });
    app.get('/myproducts', async (req, res) => {
          let query = {};
          if (req.query.email) {
                query = {
                      email: req.query.email
                }
          }
          const cursor = productCollection.find(query);
          const products = await cursor.toArray();
          res.send(products)
    });

    app.post('/products', async (req, res) => {
          const product = req.body;
          const result = await productCollection.insertOne(product);
          res.send(result);
    });

    app.delete('/products/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const product = await productCollection.deleteOne(query);
          res.send(product)
    });

    app.get('/products/:id', async (req, res) => {
          const id = req.params.id;
          const query = { categoryId: id };
          const product = await productCollection.find(query).toArray();
          res.send(product);
    });

    //user

    app.get('/users', async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users)
    });

    app.get('/users/buyers', async (req, res) => {
      const query = { role: 'Buyer' };
      const buyers = await usersCollection.find(query).toArray();
      res.send(buyers)
    });

    app.delete('/users/buyers/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const buyers = await usersCollection.deleteOne(query);
      res.send(buyers)
    });

    app.get('/users/sellers', async (req, res) => {
      const query = { role: 'Seller' };
      const sellers = await usersCollection.find(query).toArray();
      res.send(sellers)
    });

    app.delete('/users/sellers/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const seller = await usersCollection.deleteOne(query);
      res.send(seller)
    });

    app.patch('/users/sellers/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verifiedSeller: 'Verify'
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    });

    app.post('/users', async (req, res) => {
      const query = req.body;
      const result = await usersCollection.insertOne(query);
      res.send(result);
    });

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'admin' });
    });

    app.get('/users/seller/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === 'Seller' });
    });

    //make admin
    app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    });

    app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result)
    })

    //booking 


    app.post('/booking', async (req, res) => {
      const booking = req.body
      const query = {
        product: booking.product,
        price: booking.price,
        name: booking.name,
        email: booking.name,
        phone: booking.phone,
        location: booking.location
      }

      const alreadyBooked = await BookingCollection.find(booking).toArray()

      if (alreadyBooked.length) {
        const message = "Already booking this Product"
        return res.send({ acknowledged: false, message })
      }

      const result = await BookingCollection.insertOne(booking)
      res.send(result)
    })

    app.get('/booking', async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const cursor = BookingCollection.find(query);
      const products = await cursor.toArray();
      res.send(products)
    });

    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id:  new ObjectId(id) };
      const booking = await BookingCollection.deleteOne(query);
      res.send(booking)
    });

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
      const product = await productCollection.find(query).sort({ _id: -1 }).toArray();
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