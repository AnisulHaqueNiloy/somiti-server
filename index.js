const express = require('express')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
var cors = require('cors')
const port = 3000

app.use(cors());
app.use(express.json())

// j7ScYJznV1kide3P
// somitiDB


const uri = "mongodb+srv://somitiDB:j7ScYJznV1kide3P@cluster0.co3ydzz.mongodb.net/?appName=Cluster0";



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {

        await client.connect();

        const somitiDB = client.db("somitiDB");
        const userCollection = somitiDB.collection("users");
        const paymentsCollection = somitiDB.collection("payments");
        const memberCollection = somitiDB.collection("members");




        app.post('/members', async (req, res) => {
            const members = req.body;
            const result = await memberCollection.insertOne(members);
            res.send(result);
        })

        app.get('/members', async (req, res) => {
            const search = req.query.search || "";
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            // নাম অনুযায়ী ফিল্টার করার কুয়েরি
            const query = {
                name: { $regex: search, $options: 'i' } // 'i' মানে ছোট হাতের বা বড় হাতের অক্ষর গ্রাহ্য করবে না
            };

            const result = await memberCollection.find(query)
                .skip(page * size)
                .limit(size)
                .toArray();

            const count = await memberCollection.countDocuments(query);
            res.send({ result, count });
        });


        // একটি নির্দিষ্ট মেম্বারের তথ্য আপডেট করার API
        app.patch('/members/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedMember = req.body;

            // ডাটাবেসে যা যা আপডেট হবে তার একটি অবজেক্ট তৈরি
            const updateDoc = {
                $set: {
                    name: updatedMember.name,
                    mobile: updatedMember.mobile,
                    participantsCount: updatedMember.participantsCount,
                    image: updatedMember.image,
                    idNo: updatedMember.idNo
                },
            };


            try {
                const result = await memberCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Update failed", error });
            }
        });


        // ব্যাকএন্ডে এই রাউটটি নিশ্চিত করুন
        // পেমেন্ট চেক করার এপিআই (এটি পেমেন্ট পোস্ট করার আগে রাখুন)
        app.get('/payments/check', async (req, res) => {
            try {
                const { memberId, month } = req.query;

                if (!memberId || !month) {
                    return res.status(400).send({ message: "Missing query parameters" });
                }

                // ডাটাবেজে স্ট্রিং হিসেবে চেক করা হচ্ছে
                const query = {
                    memberId: memberId,
                    month: month
                };

                const existingPayment = await paymentsCollection.findOne(query);

                if (existingPayment) {
                    return res.send({ exists: true });
                }
                res.send({ exists: false });
            } catch (error) {
                console.error("Check Error:", error);
                res.status(500).send({ message: "Internal Server Error", error });
            }
        });


        // টাকা জমার ডেটা সেভ করার জন্য
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            payment.status = "pending";
            const result = await paymentsCollection.insertOne(payment);
            res.send(result);
        });

        // ২. সব পেমেন্ট দেখার API (অ্যাডমিন ড্যাশবোর্ডের জন্য)
        app.get('/admin/all-payments', async (req, res) => {
            const result = await paymentsCollection.find().toArray();
            res.send(result);
        });

        // ৩. পেমেন্ট স্ট্যাটাস আপডেট করার API (Approve/Reject)
        app.patch('/payments/status/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body; // ফ্রন্টএন্ড থেকে 'approved' বা 'rejected' আসবে
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status: status },
            };
            const result = await paymentsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });



        app.get('/users/:email/role', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ role: user?.role || 'user' })
        })

        // change user role api 
        app.patch('/users/role/:id', async (req, res) => {
            const id = req.params.id;
            const { role } = req.body;
            const query = { _id: new ObjectId(id) }
            const updateUser = {
                $set: {
                    role: role
                }
            }
            const result = await userCollection.updateOne(query, updateUser)
            res.send(result)

        })

        // user post api
        app.post('/users', async (req, res) => {
            const userData = req.body;
            userData.role = "user";
            userData.createdAt = new Date();

            const email = userData.email;
            const userExists = await userCollection.findOne({ email })

            if (userExists) {
                return res.send({ message: 'user exists' })
            }

            const result = await userCollection.insertOne(userData);

            res.send(result);
        })

        app.get('/users', async (req, res) => {
            const cursor = userCollection.find({})
            const result = await cursor.toArray();
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// somitiDb
// TNfL3e1k09nGgpk7