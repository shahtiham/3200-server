// const { PrismaClient } = require('@prisma/client')
// const prisma = new PrismaClient()

const mysql = require('mysql')
const helmet = require('helmet')
const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto');

const cors = require('cors')

const comments = require('./APIS/comments')
const tags = require('./APIS/tags')
const main = require('./APIS/main')
const questions = require('./APIS/questions')
const users = require('./APIS/users')
const answers = require('./APIS/answers')
const votes = require('./APIS/votes')

const app = express();
const http = require("http");
const { Server } = require("socket.io");

app.use(cors());

app.use(helmet());
app.use(express.json());
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
});
//console.log(io)
// Testing node-cron

const nodecron = require('./Utils/cornJob')
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
    //console.log(socket)
    socket.on("send_msg", (data) => {
        console.log(data, socket.id)
        socket.broadcast.emit("from_cron", {message:'call'})
    })
    socket.on('disconnect', () => {
        console.log(`🔥: A user disconnected: ${socket.id}`);
    });
    socket.on("send_failed_to_aw_b_msg", (ev) => {
        // console.log(ev)
        socket.broadcast.emit("failed_to_aw_b", ev)
    })
    socket.on("send_mod_dem_to_usr", (ev) => {
        socket.broadcast.emit("mod_dem_to_usr", ev)
    })
});
nodecron.fn(io)


//console.log(`${Date.now() + crypto.randomBytes(10).toString('hex')}`)


// Testing
const sendMail = require('./Utils/sendmail')

const vcode = `${Date.now() + crypto.randomBytes(10).toString('hex')}`

// sendMail({
//     to: "@gmail.com",
//     subject: "Verification Code",
//     text: "Hello World",
//     template: 'email',
//     context: {
//         username: 'John doe',
//         email: '@gmail.com', //'istiyak.riyad@gmail.com',
//         link: 'google.com',
//         code: vcode
//     }
// }).then(console.log);

// Testing

/*
CREATE DATABASE project3100;

CREATE TABLE questions (
    q_id INT AUTO_INCREMENT PRIMARY KEY,
    u_id INT,
    title VARCHAR(1024)
    question VARCHAR(15000) NOT NULL,
    tag VARCHAR(32) NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
    a_id INT AUTO_INCREMENT PRIMARY KEY,
    answer VARCHAR(15000) NOT NULL,
    q_id INT,
    u_id INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (q_id) REFERENCES questions(q_id)
);

CREATE TABLE credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(64) NOT NULL,
    pass VARCHAR(128) NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE q_vote (
    q_id INT,
    vote INT,
    u_id INT,
    primary key(q_id, u_id)
);

CREATE TABLE a_vote (
    a_id INT,
    vote INT,
    u_id INT,
    primary key(a_id, u_id)
);

*/

/* app.use(
    cors({
        origin: '*',
        methods: ["GET", "POST"],
        credentials: false,
    })
) */

// const db = mysql.createConnection({
//     //host: 'process.env.HOST',
//     host: 'localhost',
//     //port: process.env.port,
//     //user: process.env.USER,
//     user: 'root',
//     //password: process.env.PASSWORD,
//     password: '',
//     //database: process.env.DATABASE
//     database: 'project3100'
// });

const auth = (req, res, next) => {
    //console.log(req)
    const token =
        req.body.token || req.query.token || req.headers["authorization"];
    //console.log(token)
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, 'keyboardkat');
        req.user = decoded;
        //console.log(132, req.user)
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }

    return next();
};


app.get('/questions/:uid/:o', users.userasked)
app.get('/questions/ans/:uid/:o', users.useranswered)

//query to get questions of current user (these two are used in user.js in client folder):
//
//SELECT questions.q_id, questions.question, questions.tag, questions.created, UPVOTE.votes FROM questions LEFT JOIN (SELECT q_vote.q_id, SUM(q_vote.vote) as votes FROM q_vote GROUP BY q_vote.q_id) AS UPVOTE ON questions.q_id = UPVOTE.q_id WHERE questions.u_id = 14
// app.get('/questions/:uid/:o', (req, res) => {
//     //console.log('2')
//     let q = `SELECT T.q_id, T.title, T.username, T.created, S.votes FROM (SELECT questions.q_id, questions.title, credentials.username, questions.created FROM questions RIGHT JOIN credentials ON questions.u_id = credentials.id WHERE credentials.id = ${req.params.uid}) AS T LEFT JOIN (SELECT SUM(q_vote.vote) AS votes, q_vote.q_id FROM q_vote GROUP BY q_vote.q_id) AS S ON T.q_id = S.q_id ORDER BY ${(req.params.o === 'date')?'T.created':'S.votes'} DESC`
//     db.query(q, (err, rlt) => {
//         if(err) {
//             console.log(err.stack);
//             res.send('Error communicating with DB server');
//         } else {
//             res.json(rlt);
//         }
//     });
// });
// app.get('/questions/ans/:uid/:o', (req, res) => {
//     let q = `SELECT S.q_id, S.title, S.a_id, S.username, S.date, R.votes FROM (SELECT T.q_id, T.title, T.a_id, credentials.username, T.date FROM (SELECT questions.q_id, questions.title, answers.a_id, answers.u_id, answers.date FROM questions JOIN answers ON questions.q_id = answers.q_id WHERE answers.u_id = ${req.params.uid}) AS T RIGHT JOIN credentials ON T.u_id = credentials.id WHERE credentials.id = ${req.params.uid}) AS S LEFT JOIN (SELECT SUM(a_vote.vote) AS votes, a_vote.a_id FROM a_vote GROUP BY a_vote.a_id) AS R ON R.a_id = S.a_id ORDER BY ${(req.params.o === 'date')?'S.date':'R.votes'} DESC`
//     db.query(q, (err, rlt) => {
//         if(err){
//             console.log(err.stack);
//             res.send('Error communicating with DB server');
//         } else {
//             res.json(rlt);
//         }
//     })
// })

//get tags

//get all the tags
app.get('/tags', tags.tags)

//request to create tag TODO:clientside(admin/moderator)
app.post('/reqcreatetag', auth, tags.reqcreatetag)


app.get('/main', main.main)


    // with/without tag & with? username
// for prisma
app.get('/questions/tagged/:qid/:o', questions.questionstagged)

// for mysql
// app.get('/questions/tagged/:qid/:o', (req, res) => {
//     //console.log('3')
//     //`SELECT LT.q_id, LT.u_id, credentials.username, LT.title, LT.question, LT.tag, LT.created, LT.votes FROM (SELECT questions.q_id, questions.u_id, questions.title, questions.question, questions.tag, questions.created, UPVOTE.votes FROM questions LEFT JOIN (SELECT q_vote.q_id, SUM(q_vote.vote) as votes FROM q_vote GROUP BY q_vote.q_id) AS UPVOTE ON questions.q_id = UPVOTE.q_id) AS LT LEFT JOIN credentials ON LT.u_id = credentials.id WHERE LT.tag LIKE 'vanilla'`

//     let q = `SELECT questions.q_id, questions.u_id, questions.title, questions.question, questions.tag, questions.created, UPVOTE.votes FROM questions LEFT JOIN (SELECT q_vote.q_id, SUM(q_vote.vote) as votes FROM q_vote GROUP BY q_vote.q_id) AS UPVOTE ON questions.q_id = UPVOTE.q_id`
//     q = `SELECT LT.q_id, LT.u_id, credentials.username, LT.title, LT.question, LT.tag, LT.created, LT.votes FROM (SELECT questions.q_id, questions.u_id, questions.title, questions.question, questions.tag, questions.created, UPVOTE.votes FROM questions LEFT JOIN (SELECT q_vote.q_id, SUM(q_vote.vote) as votes FROM q_vote GROUP BY q_vote.q_id) AS UPVOTE ON questions.q_id = UPVOTE.q_id) AS LT LEFT JOIN credentials ON LT.u_id = credentials.id`
//     const {tag} = req.query
//     //console.log(tag)
//     if(tag != undefined && tag != null && (tag.includes('all') === false)){
//         if(typeof(tag) === 'string')
//             q = q + ` WHERE LT.tag LIKE '${tag}'`
//         else {
//             let qq = "("
//             tag.forEach((e, index) => {
//                 qq = qq + `'` + e + `'`
//                 if(index + 1 !== tag.length) qq += ','
//             })
//             qq += ")"
//             //console.log(qq)
//             q = q + ` WHERE LT.tag IN ` + qq
//         }
            
//     } else {
//         if(req.params.qid !== '-1'){
//             q = q + ` WHERE LT.q_id = ${req.params.qid}`
//         }
//     }
//     q = q + ` ORDER BY ${(req.params.o === 'date')?'LT.created':'LT.votes'} DESC`
//     // with username
    
//     db.query(q, (err, rlt) => {
//         if(err) {
//             console.log(err.stack);
//             res.send('Error communicating with DB server');
//         } else {
//             //console.log(rlt)
//             res.json(rlt);
//         }
//     });

// });

//

//comment on question
// todo: add auth


app.post('/comm/question', auth, comments.comonq)

//comment on answer
// todo: add auth
app.post('/comm/answer', auth, comments.comona)

//accept answer
app.post('/acceptanswer', auth, answers.acceptans)

//award bounty
app.post('/awardbounty', auth, answers.awardbounty)

//set bounty
app.post('/setbounty', auth, questions.setbounty)

// post a question
app.post('/questions', auth, questions.questions)

app.post('/questions/edit', auth, questions.editquestion)

//accept suggested edit
app.post('/questions/acceptedtsgt', auth, questions.acceptedtsgt)

//discard suggested edit
app.post('/questions/discardedtsgt', auth, questions.discardedtsgt)


//EDIT QUESTION

//
// app.post('/questions/edit', auth, (req, res) => {
//     //console.log(req.user.user_id, req.body.u_id)
//     if(req.user.user_id !== req.body.u_id){
//         res.send("You can not edit other's question")
//     } else {
//         db.query(`UPDATE questions SET title = "${req.body.title}", question = "${req.body.question}", tag = "${req.body.tag}" WHERE q_id = ${req.body.q_id}`, (err, rlt) => {
//             if(err) {
//                 console.log(err.stack);
//                 res.send('Error communicating with DB server')
//             } else {
//                 //console.log(rlt);
//                 res.json(rlt)
//             }
//         });
//     }
// })
//

app.get('/answers/:q_id', answers.getans)

//get ans
//
// app.get('/answers/:q_id', (req, res) => {
//     //console.log("hello", req.user)
//     //`SELECT * FROM answers, (SELECT a_id, COUNT(a_id) AS upvote FROM a_vote) AS UPVOTE WHERE q_id = ${req.params.q_id} AND UPVOTE.a_id = answers.a_id`
//     //`SELECT * FROM answers, (SELECT a_id, SUM(vote) AS upvote FROM a_vote GROUP BY a_id) AS UPVOTE WHERE q_id = ${req.params.q_id} AND UPVOTE.a_id = answers.a_id`
//     //`SELECT * FROM answers LEFT JOIN (SELECT a_vote.a_id, SUM(a_vote.vote), a_vote.u_id FROM a_vote GROUP BY a_id) AS UPVOTE ON answers.a_id = UPVOTE.a_id WHERE answers.q_id = ${req.params.q_id}`
    
//     // query to get with username(person who posted the answer) / correct one :
//     //SELECT FT.a_id,FT.answer,FT.q_id,FT.u_id,credentials.username,FT.votes FROM (SELECT answers.a_id, answers.answer, answers.q_id, answers.u_id, answers.date, UPVOTE.votes FROM answers LEFT JOIN (SELECT a_vote.a_id, SUM(a_vote.vote) as votes FROM a_vote GROUP BY a_id) AS UPVOTE ON answers.a_id = UPVOTE.a_id WHERE answers.q_id = 1) AS FT LEFT JOIN credentials ON FT.u_id = credentials.id
    
//     //SELECT LT.a_id,LT.answer,LT.q_id,LT.u_id,credentials.username,LT.date,LT.votes FROM (SELECT answers.a_id, answers.answer, answers.q_id, answers.u_id, answers.date, UPVOTE.votes FROM answers LEFT JOIN (SELECT a_vote.a_id, SUM(a_vote.vote) as votes FROM a_vote GROUP BY a_id) AS UPVOTE ON answers.a_id = UPVOTE.a_id) AS LT LEFT JOIN credentials ON LT.u_id = credentials.id WHERE LT.q_id = 1

//     // correct one :
//     // SELECT answers.a_id, answers.answer, answers.q_id, answers.u_id, answers.date, UPVOTE.votes FROM answers LEFT JOIN (SELECT a_vote.a_id, SUM(a_vote.vote) as votes FROM a_vote GROUP BY a_id) AS UPVOTE ON answers.a_id = UPVOTE.a_id WHERE answers.q_id = 1
//     const q = `SELECT LT.a_id,LT.answer,LT.q_id,LT.u_id,credentials.username,LT.date,LT.votes FROM (SELECT answers.a_id, answers.answer, answers.q_id, answers.u_id, answers.date, UPVOTE.votes FROM answers LEFT JOIN (SELECT a_vote.a_id, SUM(a_vote.vote) as votes FROM a_vote GROUP BY a_id) AS UPVOTE ON answers.a_id = UPVOTE.a_id) AS LT LEFT JOIN credentials ON LT.u_id = credentials.id WHERE LT.q_id = ${req.params.q_id} ORDER BY LT.votes DESC`
//     db.query(q , (err, rlt) => {
//         if(err) {
//             console.log(err.stack);
//             res.send('Error communicating with DB server');
//         } else {
//             res.json(rlt);
//         }
//     });

// });


app.post('/answers', auth, answers.postans)

//post answer
//
// app.post('/answers', auth, (req, res) => {

//     db.query(`INSERT INTO answers (answer, q_id, u_id) VALUES ("${req.body.answer}", ${req.body.q_id}, ${req.user.user_id})`, (err, rlt) => {
//         if(err) {
//             console.log(err.stack);
//             res.send('Error communicating with DB server');
//         } else {
//             console.log(rlt)
//             res.json(rlt);
//         }
//     });
// });


app.post('/answers/edit', auth, answers.editanswer)

// EDIT ANSWER

//edit answer
//
// app.post('/answers/edit', auth, (req, res) => {
//     //console.log(req.user.user_id, req.body)
//     if(req.user.user_id !== req.body.u_id){
//         res.send("You can not edit other's answer")
//     } else {
//         db.query(`UPDATE answers SET answer = "${req.body.answer}" WHERE a_id = ${req.body.a_id}`, (err, rlt) => {
//             if(err) {
//                 console.log(err.stack);
//                 res.send('Error communicating with DB server')
//             } else {
//                 //console.log(rlt);
//                 res.json(rlt)
//             }
//         });
//     }
// });


/* function getq(words){
    return new Promise((resolve, reject) => {
        let s_rlt = []
        for(let i=0; i<words.length; i++) {
            db.query(`SELECT * FROM questions WHERE question LIKE '%${words[i]}%'`, (err, rlt) => {
                if(err) {
                    console.log(err.stack);
                    res.send('Error communicating with DB server');
                } else {
                    s_rlt.push(rlt);
                    console.log(s_rlt.length);         
                }
            })
        }
        resolve(s_rlt)
    })
} */

/* app.get('/search/:search', async (req, res) => {
    let s_rlt = [];
    let words = req.params.search.split(' ');

    try{
        const wait = await getq(words)
        console.log(wait.length, 'hi');
        res.json(wait);
    } catch{
        console.log('error')
    }
}); */

// vote up question
app.get('/vote/u/q/:id', auth, votes.votequp)

//vote up answer
app.get('/vote/u/a/:id', auth, votes.voteaup)

//vote down question
app.get('/vote/d/q/:id', auth, votes.voteqdn)

//vote down answer
app.get('/vote/d/a/:id', auth, votes.voteadn)

//vote up question comment
app.get('/vote/u/cq/:id', auth, votes.voteqcup)

//vote up answer comment
app.get('/vote/u/ca/:id', auth, votes.voteacup)

/* app.get('/vote/:ud/:qa/:id', auth, (req, res) => {
    let aorq = (req.params.qa === 'q')?'questions':'answers'
    db.query(`SELECT u_id FROM ${aorq} WHERE ${req.params.qa}_id = ${req.params.id}`, (err1, rlt1) => {
        if(err1) {
            console.log(err1.stack);
            res.send('Error communicating with DB server');
        } else {
            if(rlt1[0].u_id === req.user.user_id){
                res.send("not allowed to vote on you'r "+aorq)
            } else {
                db.query(`INSERT INTO ${req.params.qa}_vote (${req.params.qa}_id, vote, u_id) VALUES (${req.params.id}, ${req.params.ud === 'u' ? 1 : -1}, ${req.user.user_id})`, (err, rlt) => {
                    console.log(rlt,err)
                    if(err) {
                        if(err.code === 'ER_DUP_ENTRY') {
                            res.send('Already Voted');
                        } else {
                            console.log(err.stack);
                            res.send('Error communicating with DB server');
                        }
                    } else {
                        // query to get updated vote count (vote : GET REQUEST)
                        const q = `SELECT ${req.params.qa}_id, SUM(vote) as vote FROM ${req.params.qa}_vote WHERE ${req.params.qa}_id = ${req.params.id} GROUP BY ${req.params.qa}_id`
                        db.query(q , (errUp, rltUp) => {
                            if(errUp) {
                                //console.log(errUp.stack);
                                res.send('Error communicating with DB server. Failed to get updated vote count');
                            } else {
                                res.json(rltUp);
                                //console.log('updated res: ', rltUp)
                            }
                        });

                        // vote : POST REQUEST
                        //res.json(rlt);
                    }
                });
            }
        }
    });
    
}); */

app.get('/isloggedin', auth, users.isloggedin)

//send user info
app.get('/userinfo', auth, users.userinfo)

//send detailed user info
app.get('/detaileduinfo/:userId', users.detaileduinfo)

//send user list
app.get('/userslist', users.userlist)

//register
app.post("/register", users.register);

// login
app.post("/login", users.login);

// verify
app.post('/verifyuser', users.verify)

// resend verification code
app.post('/resendverify', users.resendverify)

// reset password
app.post('/resetpass', users.resetpass)

// send password reset code
app.post('/sendpassresetcode', users.sendpassresetcode)


// ADMIN - MODERATOR

app.post('/promotetomod', users.protomod)
app.post('/demotetousr', users.detousr)

app.post('/restrictusr', users.restusr)
app.post('/unrestrictusr', users.unrestusr)

app.post('/deletequestion', questions.delq)
app.post('/deleteanswer', answers.dela)

//get list of requested tags
app.get('/requestedtaglist', auth, tags.reqtaglist)

//add or discard tag request
app.post('/addordiscardtagreq', auth, tags.addordiscardtagreq)


// app.all('*', (req, res) => res.status(404).send('Requested resource not found on server.'));

const PORT = process.env.PORT || 8089;
server.listen(PORT, () => console.log(`Listening at port ${PORT}`));