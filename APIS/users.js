const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const sendMail = require('../Utils/sendmail');
const createnotifics = require('../Utils/createnotifics')
const Axios = require('axios')
const {io} = require("socket.io-client");
const socket = io.connect("http://localhost:8089");

exports.login = async (req, res, next) => {
    
    const { email, pass, ctoken } = req.body;

    const cap = await Axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${ctoken}`)
    
    if(!cap.data.success){
        return res.status(404).send("Bots are not allowed")
    }

    if (!(email && pass)) {
        return res.status(404).send("All input is required");
    }

    //for prisma
    try{
        let us = await prisma.credentials.findUnique({
            where:{
                email:email
            },
            select:{
                id:true,
                email:true,
                pass:true,
                created:true,
                rep:true,
                role:true,
                blocked:true,
                Code:true,
                verified:true
            }
        })
        //console.log(us, email, pass)
        if(us === null) return res.status(400).send("Invalid credentials")
        //console.log(us)

        if(await bcrypt.compare(pass, us.pass)){
            if(us.blocked === true){
                return res.status(400).send("User is blocked")
            }
            if(us.verified === false){
                return res.status(404).send('please verify email')
            }
            us.insertId = us.id
            //console.log(us.insertId, us.id, 44)
            const token = jwt.sign(
                { user_id: us.insertId, email },
                'keyboardkat',
                {
                    expiresIn: "4h",
                }
            )
            us.token = token
            return res.status(200).json(us)
        } else {
            return res.status(400).send("Invalid credentials")
        }
    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.verify = async (req, res, next) => {
    const {code, email} = req.body
    try{
        const ui = await prisma.credentials.findFirst({
            where:{
                Code:{
                    code:code
                }
            },
            select:{
                id:true,
                created:true,
                rep:true,
                role:true,
                blocked:true,
                Code:true,
                verified:true
            }
        })
        if(ui === null){
            return res.status(404).send("Invalid verification code")
        }
        const uii = await prisma.credentials.findFirst({
            where:{
                email:email
            },
            select:{
                id:true,
                Code:true
            }
        })
        if(uii === null){
            return res.status(404).send("Invalid email")
        }
        if(uii.id !== ui.id){
            return res.status(404).send('This code was not sent to this email address')
        }
        if(ui.verified === true){
            return res.status(404).send("Already verified")
        }
        if(ui.blocked === true){
            return res.status(404).send("User is blocked")
        }
        await prisma.credentials.update({
            where:{
                id:ui.id
            },
            data:{
                verified:true
            }
        }).then(async someone => {
            prisma.code.delete({
                where:{user_id:ui.id}
            }).then(async something => {
                res.status(200).send('Verified')
            })
        })
        //res.json(ui)
    } catch(e) {
        console.log(e)
        return res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

exports.resendverify = async (req, res, next) => {
    const {email} = req.body
    try{
        const ui = await prisma.credentials.findFirst({
            where:{
                email:email
            },
            select:{
                id:true,
                created:true,
                rep:true,
                role:true,
                blocked:true,
                Code:true,
                verified:true
            }
        })
        if(ui === null){
            return res.status(404).send('Invalid email')
        }
        if(ui.verified === true){
            return res.status(404).send('User is already verified')
        }
        if(ui.blocked === true){
            return res.status(404).send('User is blocked')
        }
        let code=`${Date.now() + crypto.randomBytes(10).toString('hex')}`
        await prisma.code.update({
            where:{user_id:ui.id},
            data:{
                code:code
            }
        })
        await sendMail({
            to: email,
            subject: "Verification Code",
            text: "Hello World",
            template: 'email',
            context: {
                email: email,
                code: code
            }
        }).then((value) => {
            return res.status(200).send('Verification code resent successfully')
        }).catch((reason) => {
            return res.status(404).send('Failed to resend verification code')
        })
        
    } catch(e) {
        console.log(e)
        return res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

exports.register = async (req, res, next) => {
    //console.log('hello')
    const { username, email, pass, ctoken } = req.body;

    if (!(email && pass && username)) {
        return res.status(404).send("All input is required");
    }
    
    const cap = await Axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${ctoken}`)
    
    if(!cap.data.success){
        return res.status(404).send("Bots are not allowed")
    }

    // for prisma
    try{
        let code=`${Date.now() + crypto.randomBytes(10).toString('hex')}`
        //code = '1'
        let us = await prisma.credentials.create({
            data:{
                email:email,
                username:username,
                pass:await bcrypt.hash(pass, 10),
                Code:{
                    create:{
                        code:code
                    }
                }
            }
        })
        // Before verification.
        // us.insertId = us.id
        // const token = jwt.sign(
        //     { user_id: us.insertId, email },
        //     'keyboardkat',
        //     {
        //         expiresIn: "120s",
        //     }
        // )
        // us.token = token
        // console.log(us)
        // Before verification.
        // res.json(us)

        //just comment out this part and add dummy code to create user with fake email
        await sendMail({
            to: email,
            subject: "Verification Code",
            text: "Hello World",
            template: 'email',
            context: {
                username: username,
                email: email,
                code: code
            }
        }).then(console.log);
        res.status(404).send('please verify your account using the verification code sent to your email')
    } catch (e) {
        //console.log(e.code)
        if(e.code === 'P2002'){
            return res.status(404).send('Email Already exists')
        } else {
            return res.status(404).send('Error')
        }
    } finally {
        prisma.$disconnect()
    }
}

exports.sendpassresetcode = async (req, res, next) => {
    const {email} = req.body
    try{
        const ui = await prisma.credentials.findFirst({
            where:{
                email:email
            },
            select:{
                id:true,
                created:true,
                rep:true,
                role:true,
                blocked:true,
                Code:true,
                verified:true
            }
        })
        if(ui === null){
            return res.status(404).send('Invalid email')
        }
        if(ui.verified === false){
            return res.status(404).send('Verify email before resetting password')
        }
        if(ui.blocked === true){
            return res.status(404).send('User is blocked')
        }
        let code=`${Date.now() + crypto.randomBytes(10).toString('hex')}`
        if(ui.Code === null){
            await prisma.code.create({
                data:{
                    code:code,
                    user_id:ui.id
                }
            })
        } else {
            await prisma.code.update({
                where:{user_id:ui.id},
                data:{
                    code:code
                }
            })
        }
        await sendMail({
            to: email,
            subject: "Password Reset Code",
            text: "Hello World",
            template: 'passreset',
            context: {
                email: email,
                code: code
            }
        }).then((value) => {
            return res.status(200).send('Password Reset code sent successfully')
        }).catch((reason) => {
            return res.status(404).send('Failed to send password reset code')
        })
        
    } catch(e) {
        console.log(e)
        return res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}
exports.resetpass = async (req, res, next) => {
    const {pass, code, email} = req.body
    try{
        const ui = await prisma.credentials.findFirst({
            where:{
                Code:{
                    code:code
                }
            },
            select:{
                id:true,
                email:true,
                created:true,
                rep:true,
                role:true,
                blocked:true,
                Code:true,
                verified:true
            }
        })
        if(ui === null){
            return res.status(404).send('Invalid Password Reset Code')
        }
        if(ui.verified === false){
            return res.status(404).send('Verify email before resetting password')
        }
        if(ui.blocked === true){
            return res.status(404).send('User is blocked')
        }
        const uii = await prisma.credentials.findFirst({
            where:{
                email:email
            },
            select:{
                id:true,
                Code:true
            }
        })
        if(uii === null){
            return res.status(404).send("Invalid email")
        }
        if(uii.id !== ui.id){
            return res.status(404).send('This code was not sent to this email address')
        }
        await prisma.credentials.update({
            where:{
                id:ui.id
            },
            data:{
                pass:await bcrypt.hash(pass, 10)
            }
        }).then(async someone => {
            prisma.code.delete({
                where:{user_id:ui.id}
            }).then(async something => {
                res.status(200).send('Password has been reset successfully')
            })
        })
    } catch(e) {
        console.log(e)
        return res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

exports.userasked = async (req, res, next) => {
    const {uid} = req.params
    const ordBydate = {
        created:'desc'
    }
    const ordByvote = {
        voteCount:'desc'
    }
    try{
        const q = await prisma.questions.findMany({
            ...(req.params.o != undefined && req.params.o != null && {
                orderBy:(req.params.o === 'date')?ordBydate:ordByvote
            }),
            where:{
                u_id:parseInt(uid)
            },
            select:{
                q_id:true,
                title:true,
                askedBy:{
                    select:{
                        username:true
                    }
                }
            }
        })
        //console.log(q)
        q.map(item => {item.username = item.askedBy.username})
        res.json(q)
    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.useranswered = async (req, res, next) => {
    const {uid} = req.params
    const ordBydate = {
        date:'desc'
    }
    const ordByvote = {
        voteCount:'desc'
    }
    try{
        const a = await prisma.answers.findMany({
            ...(req.params.o != undefined && req.params.o != null && {
                orderBy:(req.params.o === 'date')?ordBydate:ordByvote
            }),
            where:{
                u_id:parseInt(uid)
            },
            select:{
                a_id:true,
                answersToAQ:{
                    select:{
                        q_id:true,
                        title:true
                    }
                },
                answeredBy:{
                    select:{
                        username:true
                    }
                }
            }
        })
        a.map(item => {item.q_id = item.answersToAQ.q_id; item.title = item.answersToAQ.title; item.username = item.answeredBy.username})
        //console.log(a)
        res.json(a)
    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.userinfo = async (req, res, next) => {
    try{
        const user = await prisma.credentials.findUnique({
            where:{
                id:req.user.user_id
            }
        })
        return res.json(user)
    }catch(e){
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }   
}

exports.detaileduinfo = async (req, res, next) => {
    const {userId} = req.params
    //console.log('a')
    try{
        const u = await prisma.credentials.findFirst({
            where:{id:parseInt(userId)},
            include:{
                questions:{
                    select:{
                        tag:{
                            select:{tag:true}
                        }
                    }
                }
            }
        })
        const t = await prisma.tag.findMany({select:{tag:true}})
        const ob = []
        t.forEach(async (tag) => {
            //console.log(tag)
            let c = 0
            u.questions.forEach((val) => {
                //console.log(val)
                const isF = val.tag.some((val) => {
                    if(val.tag === tag.tag) return true
                    return false
                })
                if(isF){
                    //console.log(tag)
                    c=c+1;
                }
            })
            ob.push({'tag':tag.tag, 'posts':c})
            ob.sort((a,b) => b.posts - a.posts)
        })
        return res.json({u,ob})

    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.getnncnt = async (req, res) => {
    const {email} = req.params
    try{
        const u = await prisma.credentials.findFirst({
            where:{email:email},
            select:{email:true, nn:true}
        })
        return res.status(200).json(u)
    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.setnncnt2z = async (req, res) => {
    const {email} = req.params
    try{
        const u = await prisma.credentials.update({
            where:{email:email},
            data:{nn:0}
        })
        return res.status(200).json(u)
    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.getnotifics = async (req, res) => {
    const {email} = req.params
    try{
        const u = await prisma.credentials.findFirst({
            where:{email:email},
            include:{
                mynotifics:{
                    include:{
                        n_by:true,
                        natoq:true
                    }
                }
            }
        })
        return res.status(200).json(u)
    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.userlist = async (req, res, next) => {
    const {mod, sort} = req.query
    const ordBydate = {
        created:'desc'
    }
    const ordByrepd = {
        rep:'desc'
    }
    const ordByrepa = {
        rep:'asc'
    }
    console.log(sort, mod)
    try{
        const u = await prisma.credentials.findMany({
            ...(sort != undefined && sort != null && {
                orderBy:(sort === 'Date')?ordBydate:(sort === 'Reputation(High to Low)'?ordByrepd:ordByrepa)
            }),
            where:{
                ...(mod === 'y' && {
                    role:'MODERATOR'
                }),
                ...(mod === 'n' &&{
                    role:'USER'
                })//,
                //blocked:false
            }
        })
        return res.json(u)
    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.protomod = async (req, res) => {
    // email of the person to be promoted
    const {email} = req.body

    // the mod/admin
    const whoispromotingqmark = 1//req.user.user_id
    try{
        const uw = await prisma.credentials.findFirst({where:{id:whoispromotingqmark}, select:{email:true, role:true}})
        const u = await prisma.credentials.findFirst({
            where:{ email: email },
            select:{ nn:true, nnn:true, id:true }
        })
        await prisma.credentials.update({
            where:{
                email: email
            },
            data:{
                role:'MODERATOR'
            }
        }).then(async (something) => {
            await createnotifics.createnotifics(u.id, whoispromotingqmark, -1, -1, 0, false, (uw.role === 'ADMIN')?true:false, (uw.role === 'MODERATOR')?true:false, 'USRTOMOD')
            socket.emit("send_protomod_to_usr", {message: "User promoted to moderator", nrecverEmail:email})
            return res.status(200).send('User promoted to moderator')
        })
    }catch(e){
        console.log(e)
        return res.status(404).send('Failed to promote user to moderator')
    }finally{
        prisma.$disconnect()
    }
}
exports.detousr = async (req, res) => {
    // email of the mod to be demoted
    const {email} = req.body

    // the mod/admin
    const whoisdemotingqmark = 1//req.user.user_id
    try{
        const uw = await prisma.credentials.findFirst({where:{id:whoisdemotingqmark}, select:{email:true, role:true}})
        const u = await prisma.credentials.findFirst({
            where:{ email: email },
            select:{ nn:true, nnn:true, id:true }
        })
        await prisma.credentials.update({
            where:{
                email: email
            },
            data:{
                role:'USER'
            }
        }).then(async (something) => {
            await createnotifics.createnotifics(u.id, whoisdemotingqmark, -1, -1, 0, false, (uw.role === 'ADMIN')?true:false, (uw.role === 'MODERATOR')?true:false, 'MODTOUSR')
            socket.emit("send_detousr_to_usr", {message: "Moderator demoted to user", nrecverEmail:email})
            return res.status(200).send('Moderator demoted to user')
        })
    }catch(e){
        console.log(e)
        return res.status(404).send('Failed to demote moderator to user')
    }finally{
        prisma.$disconnect()
    }
}

exports.restusr = async (req, res) => {
    const {email} = req.body
    try{
        await prisma.credentials.update({
            where:{
                email: email
            },
            data:{
                blocked:true,
                role:'USER'
            }
        }).then(async something => {
            return res.status(200).send('User successfully restricted')
        })
    }catch(e){
        console.log(e)
        return res.status(404).send('Failed to restrict user')
    }finally{
        prisma.$disconnect()
    }
}
exports.unrestusr = async (req, res) => {
    const {email} = req.body
    try{
        await prisma.credentials.update({
            where:{
                email: email
            },
            data:{
                blocked:false
            }
        }).then(async something => {
            return res.status(200).send('User successfully unrestricted')
        })
    }catch(e){
        console.log(e)
        return res.status(404).send('Failed to unrestrict user')
    }finally{
        prisma.$disconnect()
    }
}

exports.isloggedin = async (req, res, next) => {
    //console.log(req.user)
    const user = {user_id:req.user.user_id,email:req.user.email,isloggedin:'loggedin'}
    //res.send('loggedin');
    res.json(user)
}