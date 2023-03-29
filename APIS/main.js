const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.main = async (req, res, next) => {
    try{
        //
        let tags
        /* tags = await prisma.tag.createMany({
            data:[
                {tag:'javascript'},
                {tag:'python'},
                {tag:'java'},
                {tag:'nodejs'},
                {tag:'reactjs'},
                {tag:'php'},
                {tag:'html'},
                {tag:'css'},
                {tag:'jquery'},
                {tag:'mysql'},
                {tag:'sql'},
                {tag:'django'},
                {tag:'angular'},
                {tag:'ajax'},
                {tag:'ruby'},
                {tag:'linux'},
                {tag:'android'},
                {tag:'c#'},
                {tag:'c'},
                {tag:'c++'},
                {tag:'laravel'},
                {tag:'typescript'},
                {tag:'wordpress'},
                {tag:'mongodb'},
                {tag:'windows'},
                {tag:'postgresql'},
                {tag:'oracle'},
                {tag:'git'},
                {tag:'bash'},
                {tag:'algorithm'},
                {tag:'data structure'},
                {tag:'vscode'},
                {tag:'docker'},
                {tag:'firebase'},
                {tag:'iphone'},
                {tag:'flutter'},
                {tag:'powershell'},
                {tag:'chocolate'},
                {tag:'strawberry'},
                {tag:'vanilla'}
            ]
        }) */
        /* const user3 = await prisma.credentials.create({
            data:{
                username:"u2",
                email:"u2email",
                pass:"u2pass",
            }
        }) */
        let qstn
        //qstn = await prisma.questions.deleteMany()
        const tagAr = [{tag_id:1}]
        /* qstn = await prisma.questions.create({
            data:{
                question:"q1 by user with id 1",
                title:"a q1 by uid 1",
                tag:{
                    // this connects many to many relation.
                    connect:tagAr
                },
                askedBy:{
                    connect:{id:1}
                }
            }
        }) */
        /* await prisma.tag.delete({
            where:{
                //email:'tihamshah25599@gmail.com'
                tag:'newtag'
            }
        }) */
        //await prisma.quscomments.deleteMany()
        /* await prisma.credentials.update({
            where:{
                email: "u1@gmail.com" //'tihamshah25599@gmail.com'
            },
            data:{
                // rep:78,
                //blocked:true
                // role:'MODERATOR',
                //verified:false
                //rep:50000
            }
        }) */
        /* await prisma.reqtag.delete({
            where:{reqtag_id:1}
        }) */
        // await prisma.credentials.delete({where:{email:"bizrzrv@gmail.com"}})
        //await prisma.code.delete({where:{user_id:34}})

        qstn = await prisma.answers.findMany({include:{acceptedansToAQ:true}})
        //console.log(qstn)
        let user = await prisma.credentials.findMany({include:{Code:true,suggestededit:true}})
        // user = prisma.credentials.findUnique({where:{email:"bizrzrv@gmail.com"}})
        //console.log(user)
        //console.log(user[0].created)
        let date = new Date().toJSON();
        //console.log(new Date(date));
        // (1000 * 60) => minutes
        // (1000 * 60 * 60 * 24) => days
        //console.log(Math.ceil(Math.abs(user[0].created - new Date(date)) / (1000 * 60 )))
        res.json(user)
    }catch(e){
        res.status(404).send('Error')
        console.log(e)
    }finally{
        prisma.$disconnect()
    }

}