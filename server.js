const express = require('express')
const app = express();
const session = require('express-session');
app.set('view engine', 'ejs');

const fs = require('fs')
app.use(session({
    secret:'cristianoRonaldoCR7',
    resave:false,
    saveUninitialized:false
}))
app.get('/logout' , (req,res)=>{
    req.session.destroy((err)=>{
        if(err) res.send('internal server error');
        res.redirect('/');
    })
})
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
})

app.get('/signup' , (req,res)=>{
    res.sendFile(__dirname + '/signup.html');
})
const authorAuth = (req,res,next)=>{
    if(req.session.email && req.session.role === 'author'){
        next();
    }
    else res.send('You are not authorized');
}

app.get('/dashboard' ,authorAuth ,  (req,res)=>{
    res.render("dashboard" , {email:req.session.email});
})
const adminAuth = (req,res,next)=>{
    if(req.session.email && req.session.role === 'admin'){
        next();
    }else{
        res.send('You are not authorized');
    }

}
app.get('/adminDash' ,adminAuth ,  (req,res)=>{
    res.sendFile(__dirname + '/adminDashboard.html');
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
            req.session.email = email
            req.session.role = user.role;
            res.redirect('/dashboard');
        }else{
            res.send('Invalid email or password');
        }
    })
})
app.listen(3000, () => {
console.log(`Server is running on http://localhost:3000`);
})