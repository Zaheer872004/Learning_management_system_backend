import nodemailer,{Transport, Transporter} from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions{
  email: string;
  subject: string;
  template: string;
  // data : {[key:string]: any};
  data : {
    [
      key : string // here data like this name : zaheer
    ] : any
  }
}



// interface emailOptions{
//   email : string
//   subject : string;
//   template : string;
//   data : {[ key : string ] : any}
// }

// typeScript in generic Types
/*
const sendMailp = async <T>(value:T): Promise<T> => {return "abc" as T}

const value = sendMailp("Abc")
const value1 = sendMailp(2004)
const value2 = sendMailp(true)
*/


const sendMail = async (options: EmailOptions): Promise<void> => {

  const transporter:Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    service : process.env.SMTP_SERVICE ,
    auth: {
      user: process.env.SMTP_EMAIL ,
      pass: process.env.SMTP_PASSWORD 
    }
  });

  const {email, subject, template, data} = options;

  console.log("till here done")

  // get the path of the email template file
  const emailPath = path.join(__dirname, `../mails/${template}`,);


  // render the email template with the EJS
  const html = await ejs.renderFile(emailPath, data);

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject,
    html
  }

  await transporter.sendMail(mailOptions);

  
}

export default sendMail;