const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.comonq = async (req, res, next) => {
    const {qid, comment} = req.body
    const userid = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{id:userid},
            select:{rep:true,blocked:true}
        })
        if(uinfo.blocked === true) return res.status(404).send('Your account is blocked and you can not post a comment')
        if(uinfo.rep < 1000) return res.status(404).send("You do not have enough reputation point to post a comments")
        const com = await prisma.quscomments.create({
            data:{
                comment:comment,
                qcommentedBy:{
                    connect:{
                        id:userid
                    }
                },
                commentofQs:{
                    connect:{
                        q_id:qid
                    }
                }
            }
        })
        if(com === null) return res.status(404).send("Failed to post comment")
        //console.log(com)
        res.json(com)
    } catch(e) {
        console.log(e)
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.comona = async (req, res, next) => {
    const {aid, comment} = req.body
    const userid = req.user.user_id
    try{
        const uinfo = await prisma.credentials.findUnique({
            where:{id:userid},
            select:{rep:true,blocked:true}
        })
        if(uinfo.blocked === true) return res.status(404).send('Your account is blocked and you can not post a comment')
        if(uinfo.rep < 1000) return res.status(404).send("You do not have enough reputation point to post a comment")
        const com = await prisma.anscomments.create({
            data:{
                comment:comment,
                anscommentedBy:{
                    connect:{
                        id:userid
                    }
                },
                commentofAns:{
                    connect:{
                        a_id:aid
                    }
                }
            }
        })
        if(com === null) return res.status(404).send("Failed to post comment")
        //console.log(com)
        res.json(com)
    }catch(e){
        console.log(e)
        res.status(404).send("Error")
    }finally{
        prisma.$disconnect()
    }
}