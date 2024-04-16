const express = require('express')
const app = express();
const path = require('path');
const session = require
('express-session');
const cors = require('cors');
const multer = require('multer');
app.set('view engine', 'ejs');
app.use(cors());

const fs = require('fs');
app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname + '/public/uploads'))

app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret:'cristianoRonaldoCR7',
    resave:true,
    saveUninitialized:true
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



const adminAuth = (req,res,next)=>{
    if(req.session.email && req.session.role=='admin'){
        next();
    }
    else res.send('You are not authorized');
}
const authorAuth = (req , res , next)=>{
    if(req.session.email && req.session.role=='author' || req.session.role=='admin')
        next();
    else res.send('You are not authorized');
}


// this is the login route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
})

// this send the page of the admin 
app.get('/admin', adminAuth , (req,res)=>{
    res.sendFile(__dirname + '/admin.html');
})


// this send the admin intro page
app.get('/admin_intro.html',(req,res)=>{
    res.render('adminIntro' , {role:req.session.role , username:req.session.username})
})

// this send teh create blog html page
app.get('/create_blog.html',authorAuth , (req,res)=>{
    res.sendFile(__dirname + '/create_blog.html')
})


// this route create the blog of the page
app.post('/create-blog' , authorAuth , upload.single('blogImage') ,  (req,res)=>{
    const {blogName , blogContent }  = req.body;
    console.log(blogName , blogContent);
    const obj = {
        blogName,
        blogContent,
        blogImage:path.relative('public' , req.file.path),
        creator:req.session.username
    }
    fs.readFile('blog.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('inter nal error occur');
        data = JSON.parse(data);
        data.push(obj);
        fs.writeFile('blog.json' , JSON.stringify(data) , (err)=>{
            if(err) return res.send('internal server error');
            res.send('post created Successfully');
        })
    })
})


// this simply send the html file for signup
app.get('/signup' , (req,res)=>{
    res.sendFile(__dirname + '/signup.html');
})


// this render the dashborad page with ejs
app.get('/dashboard' ,authorAuth ,  (req,res)=>{

    let blogData = [];
    fs.readFile('blog.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('internal server error');
        blogData = JSON.parse(data);
        res.render("dashboard" , {role:req.session.role , username:req.session.username , blogData} );
    })
})



// this handel the signup post to the backend
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

// this handel the login post request to the backend
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

// lets handel the author part
app.get('/create_author.html' , (req,res)=>{
    res.sendFile(__dirname + '/createAuthor.html');
})

// this create a newAuthor
app.post('/createAuthor',(req,res)=>{
    const {username , email , password} = req.body;
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
            res.send('Author created Successfully');
        })
    })
})

app.get('/handle_author.html' , (req,res)=>{
    const authorOnly = [];
    fs.readFile('user.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('internal server error');
        data = JSON.parse(data);
        data.forEach(user => {
            if(user.role === 'author'){
                authorOnly.push({email:user.email , username:user.username})
            }
        })
        console.log(authorOnly)
        res.render('handelAuthor' , {authorOnly});
    })
})

app.delete('/author/:email' , (req,res)=>{
    const email = req.params.email;
    fs.readFile('user.json' , 'utf-8' , (err,data)=>{
        if(err) res.send('internal server error');
        data = JSON.parse(data);
        const newData = data.filter(user => user.email !== email);
        fs.writeFile('user.json' , JSON.stringify(newData) , (err)=>{
            if(err) res.send('internal server error');
            res.send({success:true});
        })
    })
})

app.get('/author' , (req,res)=>{
    res.sendFile(__dirname + '/author.html');
})

app.get('/author_intro.html',(req,res)=>{
    res.render('authorIntro' , {role:req.session.role , username:req.session.username})
})

app.listen(3000, () => {
console.log(`Server is running on http://localhost:3000`);
})