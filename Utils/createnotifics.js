const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.createnotifics = async (not_receiver_id, not_generator_id, a_id, q_id, bountyval, isaccepted, isadmin, ismod, ntype) => {
    return new Promise( async (resolve, reject) => {
        try{
            let atoq;
            if(ntype === 'ATOQ' || ntype === 'QEDTSUGSTED' || ntype === 'QEDTSUGACCEPTED' || ntype === 'DELA') {
                atoq = {
                    a_id:a_id,
                    q_id:q_id,
                }
            } else if(ntype === 'USRTOMOD' || ntype === 'MODTOUSR') {
                atoq = undefined
            } else if(ntype === 'BOUNTYRECVED') {
                atoq = {
                    a_id:a_id,
                    q_id:q_id,
                    bountyval:bountyval
                }
            } else if(ntype === 'ANSACCEPTED') {
                atoq = {
                    a_id:a_id,
                    q_id:q_id,
                    isaccepted:isaccepted
                }
            } else {
                atoq = undefined
            }

            await prisma.notifications.create({
                data:{
                    n_for:{
                        connect:[{id:not_receiver_id}]
                    },
                    n_by:{
                        connect:{id:not_generator_id}
                    },
                    ...(isadmin === true && {
                        nByAdmin:true
                    }),
                    ...(ismod === true && {
                        nByMod:true
                    }),
                    ntype:ntype,
                    ...(atoq !== undefined && atoq !== null && {
                        natoq:{
                            create:{
                                ...(atoq.a_id !== undefined && atoq.a_id !== null && {
                                    a_id:atoq.a_id
                                }),
                                ...(atoq.q_id !== undefined && atoq.q_id !== null && {
                                    q_id:atoq.q_id
                                }),
                                ...(atoq.bountyval !== undefined && atoq.bountyval !== null && atoq.bountyval !== 0 && {
                                    bountyval:atoq.bountyval
                                }),
                                ...(atoq.isaccepted !== undefined && atoq.isaccepted !== null && atoq.isaccepted !== false && {
                                    isaccepted:atoq.isaccepted
                                }),
                            }
                        }
                    })
                }
            })
            const u = await prisma.credentials.findFirst({where:{id:not_receiver_id}, select:{nn:true, nnn:true}})
            await prisma.credentials.update({
                where:{id:not_receiver_id},
                data:{
                    nn: u.nn + 1,
                    nnn: u.nnn + 1
                }
            })
            resolve('success')
        } catch(e) {
            reject(e)
        } finally {
            prisma.$disconnect()
        }
    })
}