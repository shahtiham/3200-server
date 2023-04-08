const cron = require('node-cron');
const createnotifics = require('./createnotifics')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const {io} = require("socket.io-client");

const awardbounty = async (q_id, u_id, bountyvalue, bountycreated, qownerrep, socket, uw) => {
    // q_id = question that exceeded it's bounty period,
    // u_id = owner of question : q_id
    // qownerrep = reputation point of owner of question : q_id
    try{
        const ans = await prisma.answers.findMany({ // finding all answers of question : q_id where owner of the answer is not blocked and who is not the owner of the question
            where:{
                AND:{
                    q_id:q_id,
                    answeredBy:{
                        AND:{
                            blocked:false,
                            NOT:{id:u_id}
                        }
                    }
                }
            },
            select:{
                a_id:true,
                date:true,
                answeredBy:{
                    select:{
                        rep:true, // selecting the reputation value of owner of answer.
                        email:true
                    }
                },
                u_id:true,
                voteCount:true
            }
        })
        let aid = null
        ans.map(async (item) => {
            if(item.date >= bountycreated){ // taking the highest upvoted answer that was posted after the bounty had started
                if(aid === null) aid = item
                else {
                    if(item.voteCount > aid.voteCount) aid = item
                }
            }
        })
        if(aid !== null){
            //console.log('bounty awarded')
            await prisma.credentials.update({ // awarding reputation to owner of ans. question owner's reputation was deducted while starting bounty
                where:{id:aid.u_id},
                data:{
                    rep: aid.answeredBy.rep + bountyvalue
                }
            }).then(async (someone) => {
                await prisma.questions.update({ // terminating question's bounty. connecting to accepted + bounty awarded answer
                    where:{q_id:q_id},
                    data:{
                        isbountyrunning:false,
                        bountyvalue:0,
                        bountyawarded:bountyvalue,
                        acceptedanswer:{ // if a answer is not awarded bounty then acceptedanswer = null , but is might be accepted
                            connect:{
                                a_id:aid.a_id
                            }
                        }
                    }
                }).then(async (something) => {
                    await prisma.answers.update({ // accepting the awarded answer ( by default accepted if bounty awarded )
                        where:{a_id:aid.a_id},
                        data:{
                            isaccepted:true,
                            bountyreceived:bountyvalue
                        }
                    }).then(async (fc) => {
                        await createnotifics.createnotifics(aid.u.id, uw.id, aid.a_id, q_id, bountyvalue, false, (uw.role === 'ADMIN')?true:false, (uw.role === 'MODERATOR')?true:false, 'BOUNTYRECVED')
                        socket.emit("send_bountyawbyadmin_to_usr", {message: "bountyawbyadmin", nrecverEmail:aid.answeredBy.email})

                        socket.emit("send_msg", {message: "hello"})
                    })
                })
            })
        } else {
            //console.log('failed to award bounty')
            await prisma.credentials.update({ // failed to award bounty to any answer. refunding bounty value
                where:{id:u_id},
                data:{
                    rep: qownerrep + bountyvalue
                }
            }).then(async (someone) => {
                await prisma.questions.update({
                    where:{q_id:q_id},
                    data:{
                        isbountyrunning:false,
                        bountyvalue:0,
                        bountyawarded:0
                    }
                })
            }).then((fm) => {
                socket.emit("send_failed_to_aw_b_msg", {message: "failed to award bounty"})
            })
        }
        //console.log(aid)
    } catch(e) {
        console.log(e)
    } finally {
        prisma.$disconnect()
    }
}

const getq = async (socket) => {
    const bountyPeriod = 1
    const whoisdemotingqmark = 'tihamshah25599@gmail.com'
    try{
        const uw = await prisma.credentials.findFirst({where:{email:whoisdemotingqmark}, select:{id:true, role:true}})
        const q = await prisma.questions.findMany({
            where:{
                AND:{
                    isbountyrunning : true,
                    bountyawarded: 0,
                    askedBy:{
                        blocked:false
                    }
                }
            },
            select:{
                q_id:true,
                created:true,
                isbountyrunning:true,
                bountyvalue:true,
                bountycreated:true,
                bountyawarded:true,
                u_id:true,
                askedBy:{
                    select:{
                        rep:true
                    }
                }
            }
        })
        q.map( async (item) => {
            let date = new Date().toJSON()
            let now = new Date(date)
            // ()/(1000 * 60) -> minutes
            item.bountydur = Math.ceil(Math.abs(item.bountycreated - now) / (1000 * 60))
            // console.log(item.bountydur, date, now, item.bountycreated)
            if(item.bountydur > bountyPeriod){
                await awardbounty(item.q_id, item.u_id, item.bountyvalue, item.bountycreated, item.askedBy.rep, socket, uw)
            }
        })
        return q
    } catch(e) {
        console.log(e)
        return 'Error'
    } finally {
        prisma.$disconnect()
    }
}

const demotefrommodtousr = async (item, socket) => {
    const whoisdemotingqmark = 'tihamshah25599@gmail.com'
    try{
        const uw = await prisma.credentials.findFirst({where:{email:whoisdemotingqmark}, select:{id:true, role:true}})
        const u = await prisma.credentials.findFirst({
            where:{ email: item.email },
            select:{ nn:true, nnn:true, id:true }
        })
        await prisma.credentials.update({
            where:{
                email: item.email
            },
            data:{
                role:'USER'
            }
        }).then(async (something) => {
            await createnotifics.createnotifics(u.id, uw.id, -1, -1, 0, false, (uw.role === 'ADMIN')?true:false, (uw.role === 'MODERATOR')?true:false, 'MODTOUSR')
            socket.emit("send_mod_dem_to_usr", {message: "mod dem to usr", nrecverEmail:item.email})
        })
    } catch(e) {
        console.log(e)
    } finally {
        prisma.$disconnect()
    }
}
const getmods = async (socket) => {
    try{
        const m = await prisma.credentials.findMany({
            where:{
                role:'MODERATOR'
            },
            select:{
                id:true,
                email:true,
                role:true,
                rep:true
            }
        })
        m.map(async (item) => {
            if(item.rep < 100){
                await demotefrommodtousr(item, socket)
            }
        })
    } catch(e) {
        console.log(e)
        return 'Error'
    } finally {
        prisma.$disconnect()
    }
}

exports.fn = async () => {
    console.log('147', io)
    const socket = io.connect("http://localhost:8089");
    cron.schedule('0-59/6 * * * * *', async () => {
        // console.log(`CornJob...`);
        // console.log(io.engine.clientsCount)
        
        const q = await getq(socket)
        const q2 = await getmods(socket)
        //socket.on('newev', (ev)=>{
            // socket.emit("newev", {message:"d rec"})
        //})
        // console.log(q)
    });
}

