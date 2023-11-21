const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
   //middleWares 
   //verify the token
   const verifyToken=(req,res,next)=>{
    // console.log(req.headers.authorization);
    if(!req.headers.authorization){
     return res.status(401).send({message:"Unauthorized"})
    }
    const token=req.headers.authorization.split(' ')[1]
    jwt.verify(token,process.env.Access_Token,(err,decoded)=>{
      if(err){
      return  res.status(401).send({message:"Unauthorized"})
      }
      req.decoded=decoded
      next()
    })
   }
   //verify admin
   const verifyAdmin=async(req,res,next)=>{
    const email=req.decoded.email;
    const query={email:email}
    const user=await usersCollection.findOne(query)
    const isAdmin=user?.role==='admin';
    if(!isAdmin){
      return res.status(403).send('forbidden')
    }
    next()

   }

    //auth related apis (post tokens)
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token=jwt.sign(user,process.env.Access_Token,{expiresIn:'100h'})
      res.send({token})
    })


    //get the menus
    app.get('/menu',async(req,res)=>{
        const result=await menuCollection.find().toArray()
        res.send(result)
    })
    //get the menu for specific id
    app.get('/menu/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:id}
      const result=await menuCollection.findOne(query)
      res.send(result)
    })
    //patch
    app.patch('/menu/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:id};
      const item=req.body;
      const updatedDoc={
        $set:{
          name:item.name,
          price:item.price,
          category:item.category,
          image:item.image,
          recipe:item.recipe
        }
      }
      const result=await menuCollection.updateOne(filter,updatedDoc)
    })
    //post
    app.post('/menu',verifyToken,verifyAdmin,async(req,res)=>{
      const menus=req.body;
      const result=await menuCollection.insertOne(menus);
      res.send(result)
    })
    //delete
    app.delete('/menu/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id=req.params.id;
      const query={_id:id};
      // console.log(query);
      const result=await menuCollection.deleteOne(query)
      res.send(result);
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
    //get the user's cart  only 
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

    //post the users and with google already have the email
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
    app.get('/users',verifyToken,verifyAdmin,async (req,res)=>{
      
      const result=await usersCollection.find().toArray()
      res.send(result)
    })
    //delete a user
    app.delete('/users/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await usersCollection.deleteOne(query)
      res.send(result)

    })
    //make admin so set role as Admin

    app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
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
    //get the admin 
    app.get('/users/admin/:email',verifyToken,async(req,res)=>{
      const email=req.params.email;
      if(email !==req.decoded.email){
        res.status(403).send({message:'forbidden'})
      }
      const query={email:email}
      const user=await usersCollection.findOne(query)
      let isAdmin=false
      if(user){
        isAdmin=user.role==='admin'
      }
       res.send({isAdmin})
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





