const express = require('express');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const client = twilio(accountSid, authToken);

const personA = process.env.PERSON_A;
const personB = process.env.PERSON_B;
const TRANSLATION_WS = process.env.TRANSLATION_WS;
const PUBLIC_URL = process.env.PUBLIC_URL;

app.use(express.urlencoded({ extended: false }));

// Twilio webhook for each call
app.post('/voice', (req, res) => {
  const response = new twilio.twiml.VoiceResponse();

  response.start().stream({ url: TRANSLATION_WS });

  const dial = response.dial();
  dial.conference('LiveTranslateRoom');

  res.type('text/xml');
  res.send(response.toString());
});

// Trigger to start 3-way call
app.get('/start-call', async (req, res) => {
  try {
    await client.calls.create({
      url: `${PUBLIC_URL}/voice`,
      to: personA,
      from: process.env.TWILIO_PHONE,
    });

    await client.calls.create({
      url: `${PUBLIC_URL}/voice`,
      to: personB,
      from: process.env.TWILIO_PHONE,
    });

    res.send('Calls initiated to both participants!');
  } catch (err) {
    console.error('Error starting calls:', err.message);
    res.status(500).send('Call initiation failed');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
