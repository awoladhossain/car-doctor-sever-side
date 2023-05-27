const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS)

// Routes
// docUser
// Hvj5UtJ5pw8ul7Jj
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.secxzoo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT =(req,res,next)=>{
  console.log('hitting  verifyJWT');
  console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if(!authorization)
  {
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  const token = authorization.split(' ')[1];
  console.log('token inside verify JWT', token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(error, decoded)=>{
    if(error)
    {
      return res.status(403).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
  

    const serviceCollection = client.db('CarDoctors').collection('services');
    const bookingCollection = client.db('CarDoctors').collection('bookings');

    // jwt collection or generate: data will be receive from client side  //! JWT
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
      console.log(token);
      res.send({token});
    })

    // service collection
    app.get('/services',async(req,res)=>{
      const cursor  = serviceCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option={
        projection: {title:1, price:1, service_id:1, img:1},
      };
      const result = await serviceCollection.findOne(query,option);
      res.send(result);
    })
    // bookings 
    app.get('/bookings',verifyJWT,async(req,res)=>{
      console.log(req.headers.authorization);
      const decoded = req.decoded;
      console.log('came back after verify', decoded);

      if(decoded.email !== req.query.email)
      {
        return res.status(403).send({error: true , message:"forbidden access"})
      }

      let query ={};
      if(req.query?.email){
        query = {customerEmail: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })
    app.post('/bookings', async(req,res)=>{
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.patch('/bookings/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedBooking = req.body;
      console.log(updatedBooking);

      const updatedDoc ={
        $set:{
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter,updatedDoc);
      res.send(result);
    })

    app.delete('/bookings/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Car Doctor is running');
})
app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
})