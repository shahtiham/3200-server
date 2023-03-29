const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.votequp = async (req, res, next) => {
    const {id} = req.params
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not cast vote')
        }
        if(uinfo.rep < 20){
            return res.status(404).send('You do not have enough reputation point to cast vote')
        }
        
        const q = await prisma.questions.findUnique({
            where:{q_id:parseInt(id)},
            select:{
                upvotedBy:true,
                downvotedBy:true,
                voteCount:true,
                u_id:true
            }
        })
        if(q.u_id === user_id){
            return res.send("not allowed to vote on you'r questions")
        }
        if(q.upvotedBy.includes(user_id) || q.downvotedBy.includes(user_id)){
            return res.send("Already Voted")
        }
        await prisma.questions.update({
            where:{q_id:parseInt(id)},
            data:{
                upvotedBy:{
                    push:user_id
                },
                voteCount: q.voteCount + 1
            }
        })
        // increase rep of owner of the question by 10
        qowner = await prisma.credentials.findUnique({
            where:{id:q.u_id},
            select:{
                rep:true
            }
        })
        await prisma.credentials.update({
            where:{id:q.u_id},
            data:{
                rep: qowner.rep + 10
            }
        })
        const rltup = q.voteCount + 1
        res.json(rltup)

    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.voteaup = async (req, res, next) => {
    const {id} = req.params
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not cast vote')
        }
        if(uinfo.rep < 20){
            return res.status(404).send('You do not have enough reputation point to cast vote')
        }
        
        const a = await prisma.answers.findUnique({
            where:{a_id:parseInt(id)},
            select:{
                upvotedBy:true,
                downvotedBy:true,
                voteCount:true,
                u_id:true
            }
        })
        if(a.u_id === user_id){
            return res.send("not allowed to vote on you'r answers")
        }
        if(a.upvotedBy.includes(user_id) || a.downvotedBy.includes(user_id)){
            return res.send("Already Voted")
        }
        await prisma.answers.update({
            where:{a_id:parseInt(id)},
            data:{
                upvotedBy:{
                    push:user_id
                },
                voteCount: a.voteCount + 1
            }
        })
        // increase rep of owner of the answer by 10
        aowner = await prisma.credentials.findUnique({
            where:{id:a.u_id},
            select:{
                rep:true
            }
        })
        await prisma.credentials.update({
            where:{id:a.u_id},
            data:{
                rep: aowner.rep + 10
            }
        })
        const rltup = a.voteCount + 1
        res.json(rltup)

    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.voteqdn = async (req, res, next) => {
    const {id} = req.params
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not cast vote')
        }
        if(uinfo.rep < 125){
            return res.status(404).send('You do not have enough reputation point to cast vote')
        }

        const q = await prisma.questions.findUnique({
            where:{q_id:parseInt(id)},
            select:{
                upvotedBy:true,
                downvotedBy:true,
                voteCount:true,
                u_id:true
            }
        })
        if(q.u_id === user_id){
            return res.send("not allowed to vote on you'r questions")
        }
        if(q.upvotedBy.includes(user_id) || q.downvotedBy.includes(user_id)){
            return res.send("Already Voted")
        }
        await prisma.questions.update({
            where:{q_id:parseInt(id)},
            data:{
                downvotedBy:{
                    push:user_id
                },
                voteCount: q.voteCount - 1
            }
        })

        // decrease rep of owner of the question by 2
        qowner = await prisma.credentials.findUnique({
            where:{id:q.u_id},
            select:{
                rep:true
            }
        })
        await prisma.credentials.update({
            where:{id:q.u_id},
            data:{
                rep: qowner.rep - 2
            }
        })

        // // decrease rep of voter by 1
        // await prisma.credentials.update({
        //     where:{id:user_id},
        //     data:{
        //         rep: uinfo.rep - 1
        //     }
        // })
        const rltup = q.voteCount - 1
        res.json(rltup)


    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.voteadn = async (req, res, next) => {
    const {id} = req.params
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not cast vote')
        }
        if(uinfo.rep < 125){
            return res.status(404).send('You do not have enough reputation point to cast vote')
        }

        const a = await prisma.answers.findUnique({
            where:{a_id:parseInt(id)},
            select:{
                upvotedBy:true,
                downvotedBy:true,
                voteCount:true,
                u_id:true
            }
        })
        if(a.u_id === user_id){
            return res.send("not allowed to vote on you'r answers")
        }
        if(a.upvotedBy.includes(user_id) || a.downvotedBy.includes(user_id)){
            return res.send("Already Voted")
        }
        await prisma.answers.update({
            where:{a_id:parseInt(id)},
            data:{
                downvotedBy:{
                    push:user_id
                },
                voteCount: a.voteCount - 1
            }
        })

        // decrease rep of owner of the answer by 2
        aowner = await prisma.credentials.findUnique({
            where:{id:a.u_id},
            select:{
                rep:true
            }
        })
        await prisma.credentials.update({
            where:{id:a.u_id},
            data:{
                rep: aowner.rep - 2
            }
        })

        // decrease rep of voter by 1
        await prisma.credentials.update({
            where:{id:user_id},
            data:{
                rep: uinfo.rep - 1
            }
        })
        const rltup = a.voteCount - 1
        res.json(rltup)


    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.voteqcup = async (req, res, next) => {
    const {id} = req.params
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not cast vote')
        }
        if(uinfo.rep < 1000){
            return res.status(404).send('You do not have enough reputation point to cast vote')
        }
        
        const q = await prisma.quscomments.findUnique({
            where:{id:parseInt(id)},
            select:{
                upvotedBy:true,
                votes:true,
                credentialsId:true
            }
        })
        if(q.credentialsId === user_id){
            return res.status(404).send("not allowed to vote on your comments")
        }
        if(q.upvotedBy.includes(user_id)){
            return res.status(404).send("Already Voted")
        }

        const rltup = q.votes + 1

        await prisma.quscomments.update({
            where:{id:parseInt(id)},
            data:{
                upvotedBy:{
                    push:user_id
                },
                votes: rltup
            }
        })
        
        res.json(rltup)

    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.voteacup = async (req, res, next) => {
    const {id} = req.params
    const user_id = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{
                id:user_id
            },
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(uinfo.blocked === true){
            return res.status(404).send('Your account is blocked and you can not cast vote')
        }
        if(uinfo.rep < 1000){
            return res.status(404).send('You do not have enough reputation point to cast vote')
        }
        
        const a = await prisma.anscomments.findUnique({
            where:{id:parseInt(id)},
            select:{
                upvotedBy:true,
                votes:true,
                credentialsId:true
            }
        })
        if(a.credentialsId === user_id){
            return res.status(404).send("not allowed to vote on your comments")
        }
        if(a.upvotedBy.includes(user_id)){
            return res.status(404).send("Already Voted")
        }

        const rltup = a.votes + 1

        await prisma.anscomments.update({
            where:{id:parseInt(id)},
            data:{
                upvotedBy:{
                    push:user_id
                },
                votes: rltup
            }
        })
        
        res.json(rltup)

    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}