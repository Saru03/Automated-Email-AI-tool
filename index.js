import dotenv from 'dotenv';
import express from 'express';
import GoogleAuth from 'passport-google-oauth2';
import passport from 'passport';
import session from 'express-session';
import OpenAI from 'openai';

const openai = new OpenAI({
        apiKey:process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser:true
})
let GoogleStrategy=GoogleAuth.Strategy;
dotenv.config();
const app=express();

const sessionConfig={
    name:'session',
    secret:'thishouldbeabettersecret!',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        // secure:true,
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7
    }
}

app.use(session(sessionConfig))
app.use(passport.initialize())
app.use(passport.session());




passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  (request, accessToken, refreshToken, profile, done)=>{
    const user={accessToken, refreshToken, profile,provider:'google'};
    
      return done(null, user);
    
  }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
  

app.get('/auth/google',
    passport.authenticate('google', { scope:
        [ 'email', 'profile' ] }
  ));
  
app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
          successRedirect: '/auth/gmail/success',
          failureRedirect: '/auth/google/failure'
  }));



async function getMessages(number=2){
    const response=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults="+number,{
        method:'GET',
        headers: new Headers({Authorization:`Bearer ${process.env.ACCESS_TOKEN}`})
    })
    const info = await response.json();
    for (const message of info.messages) {
        const messageResponse=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,{
            method:'GET',
            headers:new Headers({Authorization:`Bearer ${process.env.ACCESS_TOKEN}`})
        })
        const messageData=await messageResponse.json();
        const messageDetails={
            id:messageData.id,
            snippet:messageData.snippet,
            
        }
        console.log(messageDetails)

    }
}
getMessages()
  
async function setLabels(label="Interested"){
    const response=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels",{
        method:'POST',
        headers: new Headers({Authorization:`Bearer ${process.env.ACCESS_TOKEN}`,'Content-Type' : 'application/json'}),
        body: JSON.stringify({name:label}),
    })
    const labelName = await response.json();
    console.log(labelName)
}
