const path = require('path');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const handlebars = require('nodemailer-express-handlebars');

const {
    CLIENT_ID, 
    CLIENT_SECRET, 
    REFRESH_TOKEN, 
    REDIRECT_URL, 
    MAIL_ADDRESS,
} = process.env;


// Google api
const oauth2Client = new google.auth.OAuth2( 
    CLIENT_ID, 
    CLIENT_SECRET, 
    REDIRECT_URL
);

// Set refresh token 
oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN});



const sendMail = async (messageData) => {
    try {
        // Get the access token
        const gmailAccessTokhon = oauth2Client.getAccessToken();

        // Create a transport 
        const transporter = nodemailer.createTransport(
            {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    type: 'oauth2',
                    user: MAIL_ADDRESS,
                    clientId: CLIENT_ID,
                    clientSecret: CLIENT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: gmailAccessTokhon
                },
                logger: process.env.NODE_ENV === 'production'? false : true,
                transactionLog: process.env.NODE_ENV === 'production'? false : true // include SMTP traffic in the logs
            },
            {
                from: `coding-queries <${MAIL_ADDRESS}>`
            }
        );

        // Add template engine
        transporter.use('compile', handlebars({
            viewEngine: {
                partialsDir: path.resolve('views'),
                defaultLayout: false
            },
            viewPath: path.resolve('views')
        }));

        // Send the message
        const result = await transporter.sendMail(messageData);

        return result;
    }
    catch(error) {
        console.log('Something went wrong', error.message);
    }
}



module.exports = sendMail;