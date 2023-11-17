const express = require('express');
const cors = require('cors');
const app=express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port =process.env.PORT  || 5000
//middle ware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ej2tmfe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const menuCollection=client.db('bistro').collection('menu')
    const reviewsCollection=client.db('bistro').collection('reviews')
    const cartCollection=client.db('bistro').collection('carts')
    const usersCollection=client.db('bistro').collection('users')
    //get the menus
    app.get('/menu',async(req,res)=>{
        const result=await menuCollection.find().toArray()
        res.send(result)
    })
    //get the reviews
    app.get('/reviews',async(req,res)=>{
        const result=await reviewsCollection.find().toArray()
        res.send(result)
    })
    //cart 
    app.post('/carts',async(req,res)=>{
      const cartItem=req.body;
      const result=await cartCollection.insertOne(cartItem)
      res.send(result)
    
    })
    //get the user only 
    app.get('/carts',async(req,res)=>{
      const email=req.query.email
      const query={email:email}
      const result=await cartCollection.find(query).toArray();
      res.send(result)
    })
    //delete 
    app.delete('/carts/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await cartCollection.deleteOne(query)
      res.send(result)
    })

    //user
    app.post('/users',async(req,res)=>{
      const user=req.body;
      //if the user already added for google
      const query={email:user.email};
      const existingUser=await usersCollection.findOne(query);
      if(existingUser){
        return res.send({message:'User already added',insertedId:null})
      }
      const result=await usersCollection.insertOne(user)
      res.send(result)

    })
    //get the users
    app.get('/users',async (req,res)=>{
      const result=await usersCollection.find().toArray()
      res.send(result)
    })
    //delete a user
    app.delete('/users/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await usersCollection.deleteOne(query)
      res.send(result)

    })
    //make admin 
    app.patch('/users/admin/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)}
      const updatedDoc={
        $set:{
          role:'admin'
        }
      }
      const result=await usersCollection.updateOne(filter,updatedDoc)
      res.send(result)
      
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send("bistro boss is running")

})
app.listen(port, ()=>{
    console.log("Server is running");
})




