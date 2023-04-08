const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const createnotifics = require('../Utils/createnotifics')
const {io} = require("socket.io-client");
const socket = io.connect("http://localhost:8089");

exports.getans = async (req, res, next) => {
    const {q_id} = req.params
    try{
        const q = await prisma.answers.findMany({
            orderBy:{
                date:'desc'
            },
            where:{
                q_id:parseInt(q_id),
                NOT:{
                    answeredBy:{
                        blocked:true
                    }
                }
            },
            include:{
                answeredBy:{
                    select:{
                        id:true,
                        username:true,
                        rep:true,
                        role:true,
                        blocked:true
                    }
                },
                anscomments:{
                    include:{
                        anscommentedBy:{
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
                            anscommentedBy:{
                                rep:{
                                    gte:1000
                                },
                                blocked:false
                            }
                        }
                    },
                    orderBy:{
                        votes:'desc'
                    }
                }
            }
        })
        q.map(item => {item.votes = item.voteCount; delete item.voteCount; item.upcnt = item.upvotedBy.length; item.dwncnt = item.downvotedBy.length; item.username = item.answeredBy.username})
        res.json(q)
    } catch(e) {
        console.log(e)
        res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

// todo: check privilages/restrictions
exports.postans = async (req, res, next) => {
    const {answer, q_id} = req.body
    const user_id = req.user.user_id
    //console.log(user_id, req.user.user_id)
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
            return res.status(404).send('Your account is blocked and you can not post an answer')
        }
        
        const a = await prisma.answers.create({
            data:{
                answer:answer,
                answersToAQ:{
                    connect:{q_id:(typeof(q_id) === 'string')?parseInt(q_id):q_id}
                },
                answeredBy:{
                    connect:{id:user_id}
                }
            },
            include:{
                answersToAQ:{
                    include:{
                        askedBy:{
                            select:{
                                id:true,
                                email:true,
                                role:true
                            }
                        }
                    }
                }
            }
        })
        a.insertId = a.a_id
        // console.log(a)
        await createnotifics.createnotifics(a.answersToAQ.askedBy.id, user_id, a.a_id, a.answersToAQ.q_id, 0, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'ATOQ')
        socket.emit("send_anstoaq_to_usr", {message: "ans to a q", nrecverEmail:a.answersToAQ.askedBy.email})
        res.json(a)
    } catch(e) {
        console.log(e)
        res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

exports.editanswer = async (req, res, next) => {
    const {a_id, u_id, answer} = req.body
    const user_id = req.user.user_id
    try{
        if(user_id !== u_id){
            return res.status(404).send("You can not edit other's answer")
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
            return res.status(404).send('Your account is blocked and you can not edit your answer')
        }
        if(uinfo.rep < 350){
            return res.status(404).send('You do not have enough reputation to edit your answer')
        }
        await prisma.answers.update({
            where:{a_id:a_id},
            data:{
                answer:answer
            }
        }).then(async (smtn) => {
            return res.status(200).send('Successfully editted the answer')
        })
    }catch(e){
        console.log(e)
        res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.awardbounty = async (req, res, next) => {
    const {a_id, q_id, u_id} = req.body
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
        const ansui = await prisma.credentials.findUnique({
            where:{
                id:u_id
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        const qinfo = await prisma.questions.findUnique({
            where:{q_id:q_id},
            select:{
                q_id:true,
                u_id:true,
                bountyvalue:true,
                isbountyrunning:true,
                acceptedanswer:true
            }
        })
        if(qinfo === null){
            return res.status(404).send('Question does not exist')
        }
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked')
        }
        if(qinfo.u_id !== user_id){
            return res.status(404).send('You are not the owner of this question')
        }
        if(qinfo.isbountyrunning === false){
            return res.status(404).send('There is no bounty running for this question')
        }
        if(user_id === u_id){
            return res.status(404).send('You can not give bounty to your own answer')
        }
        if(ansui.blocked === true){
            return res.status(404).send('Owner of this answer is blocked')
        }

        await prisma.credentials.update({
            where:{id:ansui.id},
            data:{
                rep: ansui.rep + qinfo.bountyvalue
            }
        }).then(async (someone) => {
            await prisma.questions.update({
                where:{q_id:qinfo.q_id},
                data:{
                    isbountyrunning:false,
                    bountyvalue:0,
                    bountyawarded:qinfo.bountyvalue,
                    acceptedanswer:{
                        connect:{
                            a_id:a_id
                        }
                    }
                }
            }).then(async (something) => {
                await prisma.answers.update({
                    where:{a_id:a_id},
                    data:{
                        isaccepted:true,
                        bountyreceived:qinfo.bountyvalue
                    }
                }).then(async (smtn) => {
                    await createnotifics.createnotifics(ansui.id, user_id, a_id, q_id, qinfo.bountyvalue, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'BOUNTYRECVED')
                    socket.emit("send_bountyaw_to_usr", {message: "bountyaw", nrecverEmail:ansui.email})
                    
                    socket.emit("send_bounty_awarded_to_usr", {message: "bounty awarded", answerOwnerId:u_id})
                    res.status(200).send('Bounty awarded successfully')
                })
            })
        })

    } catch (e) {
        console.log(e)
        return res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

exports.acceptans = async (req, res, next) => {
    const user_id = req.user.user_id
    const {a_id, u_id, q_id} = req.body // u_id = owner of the answer, user_id = current user. should be the owner of the question.
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                id:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        const ansui = await prisma.credentials.findUnique({
            where:{
                id:u_id
            },
            select:{
                email:true,
                role:true,
                rep:true,
                blocked:true
            }
        })
        const qinfo = await prisma.questions.findUnique({
            where:{q_id:q_id},
            select:{
                u_id:true,
                acceptedanswer:true
            }
        })
        
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not accept an answer')
        }
        if(qinfo.u_id !== user_id){
            return res.status(404).send("You are not the owner of this question")
        }
        if(qinfo.acceptedanswer !== null){
            return res.status(404).send("This question already accepted an answer")
        }
        if(uinfo.id === u_id){
            return res.status(404).send("Your can not accept you'r own answer")
        }
        if(ansui.blocked === true){
            return res.status(404).send("Owner of this answer has been blocked")
        }
        await prisma.answers.update({
            where:{a_id:a_id},
            data:{
                isaccepted:true,
                acceptedansToAQ:{
                    connect:{
                        q_id:q_id
                    }
                }
            }
        })
        await prisma.credentials.update({
            where:{id:user_id},
            data:{
                rep: uinfo.rep + 2
            }
        })
        await prisma.credentials.update({
            where:{id:u_id},
            data:{
                rep: ansui.rep + 15
            }
        })
        await createnotifics.createnotifics(u_id, user_id, a_id, q_id, 0, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'ANSACCEPTED')
        socket.emit("send_ansaccepted_to_usr", {message: "ansaccepted", nrecverEmail:ansui.email})

        res.status(200).send('answer accepted successfully')
    }catch(e){
        console.log(e)
        res.status(404).send('Error')
    }finally{
        prisma.$disconnect()
    }
}

exports.dela = async (req, res) => {
    const {a_id} = req.body
    const user_id = req.user.user_id
    try{
        const auinfo = await prisma.answers.findFirst({where:{a_id:a_id}, include:{answeredBy:{select:{id:true, email:true, role:true}}}})
        const uinfo = await prisma.credentials.findUnique({where:{id:user_id}, select:{email:true, role:true}})
        const a = await prisma.answers.findFirst({
            where:{a_id:a_id}
        })
        if(a.isaccepted === true){
            return res.status(404).send('You can not delete an accepted answer')
        }
        await prisma.answers.delete({
            where:{a_id:a_id}
        }).then(async something => {
            await createnotifics.createnotifics(auinfo.answeredBy.id, user_id, -1, a.q_id, 0, false, (uinfo.role === 'ADMIN')?true:false, (uinfo.role === 'MODERATOR')?true:false, 'DELA')
            socket.emit("send_dela_to_usr", {message: "dela", nrecverEmail:auinfo.answeredBy.email})        

            return res.status(200).send('Successfully deleted the answer')
        })

    }catch(e){
        console.log(e)
        return res.status(404).send('Failed to delete the answer')
    }finally{
        prisma.$disconnect()
    }
}