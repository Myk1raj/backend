const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require("os");
const { error } = require("console");
app.use(express.json());
app.use(cors());
mongo_db='mongodb+srv://myk_raj:0050@cluster0.ddurdrx.mongodb.net/ecommerce';
// database connection with mongoose
mongoose.connect(mongo_db);


// api creation

app.get("/", (req, res) => {
    res.send("Hello from server");
})
app.listen(port, (error) => {
    if(!error){
        console.log(`Server is running on port ${port}`);
    } else {
        console.log("Error while running server");
    }
})
// Route to get all products
app.get("/allproducts", async (req, res) => { 
    try {
        const products = await Product.find({});
        console.log("All products");
        res.send(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// image stroage engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
})

const upload = multer({
    storage: storage
})
// creating uploda endpoint
app.use('/images',express.static('upload/images'))

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        profile_url: `http://localhost:4000/images/${req.file.filename}`
    })
})

// // schema creation
const Product = mongoose.model("Product", {
    id:{
        type: Number,
        require: true
    },
    name:{
        type: String,
        require: true
    },
    image:{
        type: String,
        require: true
    },
    category:{
        type: String,
        require: true
    },
    new_price:{
        type: Number,
        require: true
    },
    old_price:{
        type: Number,
        require: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    available_s:{
        type: Number,
        default: true
    },
    available_m:{
        type: Number,
        default: true
    },
    available_l:{
        type: Number,
        default: true
    },
    
})
// adding products
app.post("/addproduct",async (req, res) => {
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id= last_product.id + 1;
    }
    else{
        id=1;
    }
    const product= new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
        available_s:req.body.available_s,
        available_m:req.body.available_m,
        available_l:req.body.available_l,
    })
    console.log(product);
    console.log("done");
    await product.save();
    res.json({
        success:true,
        name:req.body.name
    })


})
// delete products
app.post("/removeproduct",async (req, res) => {
    await Product.findOneAndDelete({id:req.body.id});
    console.log("removed");
    res.json({
        success:true,
        name:req.body.name
    })
})






//creatin user schema
 const users=mongoose.model("users",{
    name:{
        type:String,
        require:true
    },
     username:{
         type:String,
         require:true,
         unique:true
     },
     password:{
         type:String,
         require:true
     },
     cartData:{
        type:Array

     },
     date:{
         type:Date,
         default:Date.now
     }
 })

 //creating user

    app.post('/createuser',async (req, res) => {
        let check = await users.findOne({username:req.body.username});
        if(check){
            return res.status(400).json({
                success:false,
                error:"Username already exists"
            })
        }
        
        let cart = []; // Initialize an empty array

        for (let i = 0; i < 300; i++) {
            cart[i] = {
                "s": 0, // Initialize 's' property to 0
                "m": 0, // Initialize 'm' property to 0
                "l": 0  // Initialize 'l' property to 0
             };
        }
        console.log(cart);

        const user= new users({
            name:req.body.name,
            username:req.body.username,
            password:req.body.password,
            cartData:cart
        })
        await user.save();
        
        const data={
            user:{
                id: user.id
            }
        }
        const token = jwt.sign(data, "secret_ecom");
        res.json({success:true,token:token})
    })

//endpoint for user login
app.post('/login',async (req, res) => {
    let user = await users.findOne({username:req.body.username});
    if(!user){
        return res.status(400).json({
            success:false,
            error:"Invalid username Please register"
        })
    }else{
        const compare= req.body.password === user.password;
        if(compare){
            const data={
                user:{
                    id: user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token:token})
    }else{
        return res.status(400).json({
            success:false,
            error:"Invalid Password"
        })
    }
}
})


//creating api for new collectin
app.get("/newcollection", async (req, res) => {
    let products = await Product.find({});
    let newcollection=products.slice(1).slice(-8);
    console.log("new collection fetched");
    res.send(newcollection);
})

//popular in women
app.get("/popularwomen", async (req, res) => {
    let products = await Product.find({category:"women"});
    let popularwomen= products.slice(1,5);
    console.log("popular in women fetched");
    res.send(popularwomen);
})

// Middleware to fetch user from JWT token
const fetchuser = (req, res, next) => {
    const token = req.header('auth_token');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }
    try {
        const data = jwt.verify(token, 'secret_ecom');
        req.user = data.user;
        next();
    } catch (error) {
        return res.status(401).send({ error: "Invalid token" });
    }
}



// addtocart
app.post("/add",fetchuser, async (req, res) => {
    console.log(req.body,req.user);
    res.send("done");
    let A = await users.findOne({_id:req.user.id});
    let size;
    if(req.body.size==0){
        size="s";
    }else if(req.body.size==1){
        size="m";
    }else{
        size="l";
    }
    A.cartData[req.body.id][size]++;
    await users.findByIdAndUpdate({_id:req.user.id},{cartData:A.cartData});
    console.log(A.cartData[req.body.id]);
});
//remove from cart









app.post("/remove",fetchuser, async (req, res) => {
    console.log("this is from remove",req.body);
    res.send("done");
    let A = await users.findOne({_id:req.user.id});
    let size;
    if(req.body.size==0){
        size="s";
    }else if(req.body.size==1){
        size="m";
    }else{
        size="l";
    }
    A.cartData[req.body.id][size]--;
    await users.findByIdAndUpdate({_id:req.user.id},{cartData:A.cartData});
})
app.get("/getcart", fetchuser, async (req, res) => {
    try {
        let cart = [];
        for (let i = 0; i < 300; i++) {
            cart.push([
                { id: i, size: "S", quantity: 0 },
                { id: i, size: "M", quantity: 0 },
                { id: i, size: "L", quantity: 0 }
            ]);
        }
        const user = await users.findOne({ _id: req.user.id });
        if (user) {
            console.log("User found");
            for (let i = 0; i < 300; i++) {
                if (user.cartData[i]["s"] > 0) {
                    cart[i][0]["quantity"] = user.cartData[i]["s"];
                }
                if (user.cartData[i]["m"] > 0) {
                    cart[i][1]["quantity"] = user.cartData[i]["m"];
                }
                if (user.cartData[i]["l"] > 0) {
                    cart[i][2]["quantity"] = user.cartData[i]["l"];
                }
            }
        } else {
            console.log("User not found");
        }
        res.send(cart);
    } catch (error) {
        console.error("Error fetching user's cart:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

//employee schema
const employees=mongoose.model("employees",{
    name:{
        type:String,
        require:true
    },
    phone:{
        type:Number,
        require:true
    },
     username:{
         type:String,
         require:true,
         unique:true
     },
     password:{
         type:String,
         require:true
     },
     branchID:{
        type:Number,
     },
     date:{
         type:Date,
         default:Date.now
     }
 })
 //create emp
 app.post('/craeteemp',async (req, res) => {

    let check = await employees.findOne({username:req.body.username});
    if(check){
        return res.status(400).json({
            success:false,
            error:"Username already exists"
        })
    }
    
    const employee= new employees({
        name:req.body.name,
        phone:req.body.phone,
        username:req.body.username,
        password:req.body.password,
        branchID:req.body.branch
    })
    await employee.save();
    
    const data={
        user:{
            id: employee.id
        }
    }
    const token = jwt.sign(data, "secret_emp");
    res.json({success:true,token:token})
})

//login employee
app.post('/loginemp',async (req, res) => {
    let employee = await employees.findOne({username:req.body.username});
    if(!employee){
        return res.status(400).json({
            success:false,
            error:"Invalid username Please register"
        })
    }else{
        const compare= req.body.password === employee.password;
        if(compare){
            const data={
                employee:{
                    id: employee.id
                }
            }
            const token = jwt.sign(data,'secret_emp');
            res.json({success:true,token:token})
    }else{
        return res.status(400).json({
            success:false,
            error:"Invalid Password"
        })
    }
}
})

//middleware for employee
const fetchemployee = (req, res, next) => {
    const token = req.header('auth_token');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }
    try {
        const data = jwt.verify(token, 'secret_emp');
        req.employee = data.employee;
        next();
    } catch (error) {
        return res.status(401).send({ error: "Invalid token" });
    }
}
//list users
app.get("/listusers",async (req, res) => {
    let user = await users.find({});
    res.send(user);
})
//delete user
app.post("/removeuser",async (req, res) => {
    await users.findOneAndDelete({username:req.body.username});
    res.json({
        success:true,
        name:req.body.name
    })
})

//list employees
app.get("/listemployees",async (req, res) => {
    let employee = await employees.find({});
    res.send(employee);
})
//delete employee
app.post("/removeemployee",async (req, res) => {
    await employees.findOneAndDelete({username:req.body.username});
    res.json({
        success:true,
        name:req.body.name
    })
})

//user info
app.get("/getinfo",fetchuser,async (req, res) => {
    
    const user = await users.findOne({ _id: req.user.id});
    if(user){
        res.send(user);
    }else{
        res.send("user not found");
    }
})

//phone number schema
const contact=mongoose.model("contact",{
    
    phone:{
        type:Array,
        require:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }
})

//add phone number
app.post("/addphone", fetchuser, async (req, res) => {
    let mayank =true;
    let array =[];
    console.log("just before",req.body.phone);
    let phonee = await contact.findOne({ "userID": req.user.id });
    if(phonee){
        console.log("found user")
    }
    if (phonee) {
        console.log("creating array")
        array=phonee.phone;
        for(let i=0;i<array.length;i++){
            if(array[i]==req.body.phone){
                console.log("found matchcing phone number");
                mayank=false;
                console.log("mayank",mayank);
                res.json({
                    success:false,
                    error:"Phone number already exists"
                })
                break;
            }   
        
        }
        if(mayank){
            console.log("adding new phone number same nahi mila");
            phonee.phone.push(req.body.phone);
            await phonee.save();
            res.json({
                success:true,
                phone:req.body.phone,
                error:"New Phone number added in your Id"
            })
        }
    } else {
        console.log("creating new phone number for new user");
      const user = await users.findOne({ _id: req.user.id });
      let ph=[];
        ph.push(req.body.phone);
        const phone1 = new contact({
        phone: ph,
        userID: user._id
      })
      await phone1.save();
        res.json({
            success: true,
            phone: req.body.phone,
            error: "New Phone number added in your Id"
        })
  }
})
// remove phone number
app.post("/removephone", fetchuser, async (req, res) => {
    let phonee = await contact.findOne({ userID: req.user.id });    
    if (phonee) {
        let index = phonee.phone.indexOf(req.body.phone);
        if (index > -1) {
            phonee.phone.splice(index, 1);
        }
        await phonee.save();
    }
})

//get phone number
app.post("/getphone", fetchemployee, async (req, res) => {
    
    console.log("user.id",req.employee.id);
    console .log("user",req.body.id);
    const phonee = await contact.findOne({ userID: req.body.id });
    if (phonee) {
        console.log("phonee",phonee.phone);
        res.send(phonee.phone);
    } else {
        res.send([]);
    }
})