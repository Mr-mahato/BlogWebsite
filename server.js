const express = require('express')
const app = express();
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
app.set('view engine', 'ejs');
app.use(cors());

const fs = require('fs');



app.use(session({
    secret:'cristianoRonaldoCR7',
    resave:false,
    saveUninitialized:false
}))

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Replace './uploads/blog-images/' with your desired folder
    },
    filename: function (req, file, cb) {
        // Optionally add a timestamp or unique identifier to avoid overwrites
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage: storage });


app.get('/logout' , (req,res)=>{
    req.session.destroy((err)=>{
        if(err) res.send('internal server error');
        res.redirect('/');
    })
})
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));
app.use(express.static(__dirname + '/public/uploads'));



app.use(express.urlencoded({ extended: true }));


const authorAuth = (req,res,next)=>{
    if(req.session.email && req.session.role){
        next();
    }
    else res.send('You are not authorized');
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
})

app.get('/admin', authorAuth , (req,res)=>{
    console.log('you are here in admin page')
    res.sendFile(__dirname + '/admin.html')
})
app.get('/admin_intro.html',(req,res)=>{
    res.sendFile(__dirname + '/admin_intro.html')
})
app.get('/create_blog.html',authorAuth , (req,res)=>{
    res.sendFile(__dirname + '/create_blog.html')
})


app.post('/create-blog' , authorAuth , upload.single('blogImage') ,  (req,res)=>{
    const {blogName , blogContent }  = req.body;
    console.log(blogName , blogContent);
    const obj = {
        blogName,
        blogContent,
        blogImage:req.file.path,
        creator:req.session.usernamef
    }
    fs.readFile('blog.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('inter nal error occur');
        data = JSON.parse(data);
        data.push(obj);
        fs.writeFile('blog.json' , JSON.stringify(data) , (err)=>{
            if(err) res.send('internal server error');
            res.redirect('/admin');
        })
    })
})
app.get('/signup' , (req,res)=>{
    res.sendFile(__dirname + '/signup.html');
})


app.get('/dashboard' ,authorAuth ,  (req,res)=>{

    let blogData = [];
    fs.readFile('blog.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('internal server error');
        blogData = JSON.parse(data);
        res.render("dashboard" , {role:req.session.role , username:req.session.username , blogData} );
    })
})




app.post('/signup' , (req,res)=>{
    const {username , email , password} = req.body;
    console.log(username , email ,password);
    fs.readFile('user.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('internal server error');
        data = JSON.parse(data);

        const authorObj = {
            username,
            email,
            password,
            role:'author'
        }
        data.push(authorObj);
        fs.writeFile('user.json' , JSON.stringify(data) , (err)=>{
            if(err) res.send('internal server error');
            res.redirect('/');
        })
    })

})
app.post('/login' , (req,res)=>{
    const {email , password} = req.body;
    fs.readFile('user.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('internal server error');
        data = JSON.parse(data);
        const user = data.find(user => user.email === email && user.password === password);
        if(user){
            req.session.email = email;
            req.session.role = user.role;
            req.session.username = user.username;
            res.redirect('/dashboard');
        }else{
            res.send('Invalid email or password');
        }
    })
})
app.listen(3000, () => {
console.log(`Server is running on http://localhost:3000`);
})