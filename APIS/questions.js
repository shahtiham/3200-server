const createnotifics = require('../Utils/createnotifics')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.questionstagged = async (req, res, next) => {
    const {tag, bountied, un} = req.query
    // console.log(bountied, un)
    const ordBydate = {
        created:'desc'
    }
    const ordByvoted = {
        voteCount:'desc'
    }
    const ordByvotea = {
        voteCount:'asc'
    }
    //console.log(tag)
    try{
        const q = await prisma.questions.findMany({
            ...(req.params.o != undefined && req.params.o != null && {
                orderBy:(req.params.o === 'date')?ordBydate:(req.params.o === 'vote(High to Low)')?ordByvoted:ordByvotea
            }),
            where:{
                ...(req.params.qid != -1 && {
                    q_id:(typeof(req.params.qid) === 'string')?parseInt(req.params.qid):req.params.qid
                }),
                ...(tag != undefined && tag != null && {
                    tag:{
                        some:{
                            tag:{
                                in:tag
                            }
                        }
                    }
                }),
                ...(bountied !== undefined && bountied !== null && {
                    isbountyrunning:true
                }),
                ...(un !== undefined && un !== null && {
                    answers:{
                        every:{
                            a_id:-1
                        }
                    }
                }),
                NOT:{
                    askedBy:{
                        blocked:true,
                    }
                }
            },
            include:{
                tag:true,
                askedBy:true,
                acceptedanswer:true,
                suggestededit:{
                    include:{
                        tag:{
                            select:{
                                tag:true
                            }
                        },
                        sugBy:true
                    }
                },
                quscomments:{
                    include:{
                        qcommentedBy:{
                            select:{
                                id:true,
                                username:true,
                                rep:true,
                                role:true,
                                blocked:true
                            }
                        }
                    },
                    where:{
                        AND:{
                            qcommentedBy:{
                                rep:{
                                    gte:1000
                                },
                                blocked:false
                            }
                        }
                    },
                    orderBy:{
                        date:'desc'
                    }
                }
            }
        })
        q.map(item => {item.votes = item.voteCount; delete item.voteCount; item.upcnt = item.upvotedBy.length; item.dwncnt = item.downvotedBy.length; item.username = item.askedBy.username})
        res.json(q)

    } catch (err) {
        console.log(err)
    } finally {
        prisma.$disconnect()
    }
}

// todo: check privilages/restrictions
exports.questions = async (req, res, next) => {
    //console.log('4')
    const {title, question, tag} = req.body
    //console.log(req.user.user_id)
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:req.user.user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not post a question')
        }
        
        const tagAr = await prisma.tag.findMany({
            where:{
                tag:{
                    in:tag
                }
            },
            select:{
                tag_id:true
            }
        })
        
        qstn = await prisma.questions.create({
            data:{
                question:question,
                title:title,
                tag:{
                    // this connects many to many relation.
                    connect:tagAr
                    // create:[{tag:"openAI"}, {tag:"spaceX"}] // or directly create new tag while asking new question
                },
                askedBy:{
                    connect:{
                        id:req.user.user_id
                    }
                }
            }
        })
        // console.log(qstn)
        qstn.insertId = qstn.q_id
        res.json(qstn)

    }catch(e){
        console.log(e)
        res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
    
    //for mysql
    /* db.query(`INSERT INTO questions (u_id, title, question, tag) VALUES (${req.user.user_id}, "${req.body.title}", "${req.body.question}", '${req.body.tag}')`, (err, rlt) => {
        if(err) {
            console.log(err.stack);
            //hello
            res.send('Error communicating with DB server');
        } else {
            //console.log(rlt)
            res.json(rlt);
        }
    }); */
}

exports.editquestion = async (req, res, next) => {
    // u_id = owner of the question.
    const {q_id, u_id, title, question, tag} = req.body
    const user_id = req.user.user_id
    try{
        const tagAr = await prisma.tag.findMany({
            where:{
                tag:{
                    in:tag
                }
            },
            select:{
                tag_id:true
            }
        })
        const quinfo = await prisma.credentials.findFirst({where:{id:u_id}, select:{email:true, role:true}})
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(user_id === u_id){
            if(uinfo.blocked === true){
                return res.status(404).send('Your account is blocked and you can not edit your question')
            }
            if(uinfo.rep < 350){
                return res.status(404).send('You do not have enough reputation to edit your question')
            }
            await prisma.questions.update({
                where:{q_id:q_id},
                data:{
                    title:title,
                    question:question,
                    tag:{
                        connect:tagAr
                    }
                }
            }).then(async (smtn) => {
                return res.status(200).send('Successfully editted the question')
            })
        }
        else {
            if(uinfo.blocked === true){
                return res.status(404).send("Your account is blocked and you can not suggest edit to other's question")
            }
            if(uinfo.rep < 3000){
                return res.status(404).send("You do not have enough reputation to suggest edit to other's question")
            }
            await prisma.suggestededit.create({
                data:{
                    question:question,
                    title:title,
                    tag:{
                        connect:tagAr
                    },
                    sugofQs:{
                        connect:{
                            q_id:q_id
                        }
                    },
                    sugBy:{
                        connect:{
                            id:user_id
                        }
                    }
                }
            }).then(async (smtn) => {
                await createnotifics.createnotifics(u_id, user_id, -1, q_id, 0, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'QEDTSUGSTED')
                socket.emit("send_qedtsug_to_usr", {message: "qedtsug", nrecverEmail:quinfo.email})        

                return res.status(200).send("Successfully suggested the edit")
            })
        }
    } catch(e) {
        console.log(e)
        res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

function gettag(tag) {
    return new Promise((resolve) => {
        const tgs = []
        for(let i =0; i < tag.length ; i++){
            tgs.push(tag[i].tag)
        }
        resolve(tgs)
    });
  }

exports.acceptedtsgt = async (req, res, next) => {
    const {tq} = req.body
    const user_id = req.user.user_id
    try{
        const qi = await prisma.questions.findUnique({
            where:{q_id:tq.q_id},
            select:{u_id:true}
        })
        if(user_id !== qi.u_id){
            return res.status(404).send("You are not the owner of this question")
        }
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        const sgtuinfo = await prisma.credentials.findUnique({
            where:{
                id:tq.u_id
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked')
        }
        const tgs = await gettag(tq.tag)
        const tagAr = await prisma.tag.findMany({
            where:{
                tag:{
                    in:tgs
                }
            },
            select:{
                tag_id:true
            }
        })
        
        await prisma.questions.update({
            where:{q_id:tq.q_id},
            data:{
                title:tq.title,
                question:tq.question,
                tag:{
                    connect:tagAr
                }
            }
        }).then(async (sm) => {
            await prisma.suggestededit.delete({
                where:{id:tq.id}
            }).then(async (again) => {
                await prisma.credentials.update({
                    where:{
                        id:tq.u_id
                    },
                    data:{
                        rep: sgtuinfo.rep + 2
                    }
                }).then(async (done) => {
                    await createnotifics.createnotifics(sgtuinfo.id, user_id, -1, tq.q_id, 0, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'QEDTSUGACCEPTED')
                    socket.emit("send_qedtsugaccepted_to_usr", {message: "qedtsugaccepted", nrecverEmail:sgtuinfo.email})        

                    return res.status(200).send('Successfully applied the suggested edit')
                })
            })
        })
        
    }catch(e){
        console.log(e)
        res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.discardedtsgt = async (req, res, next) => {
    const {tq} = req.body
    const user_id = req.user.user_id
    try{
        const qi = await prisma.questions.findUnique({
            where:{q_id:tq.q_id},
            select:{u_id:true}
        })
        if(user_id !== qi.u_id){
            return res.status(404).send("You are not the owner of this question")
        }
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked')
        }
        await prisma.suggestededit.delete({
            where:{id:tq.id},
        }).then(async (done) => {
            return res.status(200).send('Successfully discarded the suggested edit')
        })

    }catch(e){
        console.log(e)
        return res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.setbounty = async (req, res, next) => {
    const {q_id, bountyvalue} = req.body
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not set bounty')
        }
        const qi = await prisma.questions.findUnique({
            where:{q_id:q_id},
            select:{
                created:true,
                isbountyrunning:true,
                bountyawarded:true,
                // bountyvalue:true,
                acceptedanswer:true,
                u_id:true
            }
        })
        if(qi.u_id !== user_id){
            return res.status(404).send('You are not the owner of this question')
        }
        if(qi.bountyawarded > 0){
            return res.status(404).send('This question already awarded a bounty')
        }
        if(qi.acceptedanswer !== null){
            return res.status(404).send('This question already accepted an answer')
        }
        if(qi.isbountyrunning === true){
            return res.status(404).send('A bounty is already running for this question')
        }
        if(uinfo.rep < 75){
            return res.status(404).send('You do not have enough reputation to start a bounty')
        }
        if(bountyvalue < 50){
            return res.status(404).send('Bounty value must be at least 50')
        }
        if(bountyvalue > 500){
            return res.status(404).send('Bounty value can be at most 500')
        }

        /* TODO: ADD this and test */
        let date = new Date().toJSON();
        let now = new Date(date)
        let dur = Math.ceil(Math.abs(qi.created - now) / (1000 * 60 * 60 * 24))
        /* if(dur <= 1){
            return res.status(404).send('You can not start bounty within 1 days of asking a question')
        } */
        // 

        await prisma.credentials.update({
            where:{id:user_id},
            data:{
                rep:uinfo.rep - bountyvalue
            }
        }).then(async (someone) => {
            await prisma.questions.update({
                where:{q_id:q_id},
                data:{
                    isbountyrunning:true,
                    bountyvalue:bountyvalue,
                    bountycreated:now
                }
            }).then(async (something) => {
                return res.status(200).send('Bounty started successfully')
            })
        })
    } catch (e) {
        console.log(e)
        return res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
    
}

exports.delq = async (req, res) => {
    const {q_id} = req.body
    const user_id = req.user.user_id
    try{
        const quinfo = await prisma.questions.findFirst({where:{q_id:q_id}, include:{askedBy:{select:{id:true, email:true, role:true}}}})
        const uinfo = await prisma.credentials.findUnique({where:{id:user_id}, select:{email:true, role:true}})
        await prisma.questions.delete({
            where:{q_id:q_id}
        }).then(async something => {
            await createnotifics.createnotifics(quinfo.askedBy.id, user_id, -1, -1, 0, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'DELQ')
            socket.emit("send_delq_to_usr", {message: "delq", nrecverEmail:quinfo.askedBy.email})        

            return res.status(200).send('Successfully deleted the question')
        })

    }catch(e){
        console.log(e)
        return res.status(404).send('Failed to delete the question')
    }finally{
        prisma.$disconnect()
    }
}