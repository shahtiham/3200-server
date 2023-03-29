const token = await  new Token({
            userId: createdUser._id,
            tokenType: 'signup'
        }).save();

        // Activation mail
        const activateLink = `${process.env.SERVER_URL}/api/v1/activate/${token.token}`;
        await sendMail({
            to: createdUser.email,
            subject: 'Verification Mail',
            text: `Click on the given link ${activateLink}`,
            template: 'email',
            context: {
                username: createdUser.name,
                email: createdUser.email,
                link: activateLink
            }
        });
