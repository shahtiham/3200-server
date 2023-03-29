const { PrismaClient } = require('@prisma/client')
const e = require('express')
const prisma = new PrismaClient()

exports.tags = async (req, res, next) => {
    try{
        const tags = await prisma.tag.findMany()
        res.json(tags)
    } catch (e) {
        res.status(404).send("Error")
    } finally {
        prisma.$disconnect()
    }
}

exports.reqcreatetag = async (req, res, next) => {
    const {reqtag} = req.body
    try{
        const ui = await prisma.credentials.findUnique({
            where:{id:req.user.user_id},
            select:{
                role:true,
                rep:true,
                blocked:true
            }
        })
        if(ui.blocked === true){
            return res.status(404).send('Your account is blocked and you can not request tag')
        }
        if(ui.rep < 1500) return res.status(404).send('You do not have enough reputation to request a new tag')
        const tgs = await prisma.tag.findUnique({
            where:{tag:reqtag}
        })
        
        if(tgs !== null) return res.status(404).send('Requested tag already exists')
        
        const rqtgs = await prisma.reqtag.findUnique({
            where:{reqtag:reqtag}
        })
       
        if(rqtgs !== null) return res.status(404).send('Request to create this tag already exists')
        if(ui.role === "ADMIN" || ui.role === 'MODERATOR') {
            const ct = await prisma.tag.create({
                data:{
                    tag:reqtag
                }
            })
            return res.status(200).send('New tag added')
        } else {
            //console.log(12)
            //res.send('hello')
            const rqtct = await prisma.reqtag.create({
                data:{
                    reqtag:reqtag,
                    tagreqBy:{
                        connect:{
                            id:req.user.user_id
                        }
                    }
                }
            })
            return res.status(200).send('Successfully requested to create the tag')
        }
    }catch(e){
        console.log(e)
        res.status(404).send("Error")
    }finally{
        prisma.$disconnect()
    }
}

exports.addordiscardtagreq = async (req, res, next) => {
    const {reqtag_id, add} = req.body
    const user_id = req.user.user_id
    try{
        const ui = await prisma.credentials.findUnique({
            where:{id:user_id},
            select:{
                rep:true,
                role:true
            }
        })
        if(ui.role === 'USER'){
            return res.status(404).send('You can not perform this operation')
        }
        const rqt = await prisma.reqtag.findUnique({
            where:{reqtag_id:reqtag_id},
            select:{reqtag:true}
        })
        if(add === true){
            await prisma.tag.create({
                data:{
                    tag:rqt.reqtag
                }
            })
            await prisma.reqtag.delete({
                where:{reqtag_id:reqtag_id}
            })
            return res.status(200).send('Tag added')
        } else {
            await prisma.reqtag.delete({
                where:{reqtag_id:reqtag_id}
            })
            return res.status(200).send('Tag request discarded')
        }
    } catch(e) {
        console.log(e)
        res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}

exports.reqtaglist = async (req, res, next) => {
    const user_id = req.user.user_id
    try{
        const ui = await prisma.credentials.findUnique({
            where:{id:user_id},
            select:{
                rep:true,
                role:true
            }
        })
        if(ui.role === 'USER'){
            return res.status(404).send('You can not view the list')
        }
        const lst = await prisma.reqtag.findMany({
            select:{
                reqtag:true,
                reqtag_id:true,
                created:true,
                tagreqBy:{
                    select:{
                        id:true,
                        email:true,
                        blocked:true,
                        rep:true,
                        role:true,
                        created:true
                    }
                }
            }
        })
        res.status(200).json(lst)
    } catch(e) {
        console.log(e)
        res.status(404).send('Error')
    } finally {
        prisma.$disconnect()
    }
}